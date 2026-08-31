/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the license file for more information.
 */

import express from "express";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/authMiddleware.js";
import {
  validate,
  nameValidator,
  emailValidator,
  passwordValidator,
  roleValidator,
} from "../middleware/validate.js";

const router = express.Router();

const DEFAULT_TOKEN_TTL = "40h";

/**
 * Sign a JWT for a user. Pulls TTL from JWT_EXPIRES_IN when present.
 */
const signAuthToken = (user) => {
  const payload = { user: { id: user._id, role: user.role } };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_TTL,
  });
};

/**
 * Shape user for safe public-facing responses (drops sensitive fields).
 */
const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  addresses: user.addresses || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// @route POST /api/users/register
// @desc Register a new user
// @access Public
router.post(
  "/register",
  [nameValidator(), emailValidator(), passwordValidator(), roleValidator(), validate],
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409); // 409 Conflict is semantically correct for duplicate
        throw new Error("An account with this email already exists");
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || "customer",
      });

      const token = signAuthToken(user);
      res.status(201).json({ user: toPublicUser(user), token });
    } catch (error) {
      next(error);
    }
  }
);

// @route POST /api/users/login
// @desc Authenticate user
// @access Public
router.post(
  "/login",
  [emailValidator(), validate],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      // Explicitly select password — schema sets select:false by default.
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        // Use the same generic message for both not-found and wrong-password
        // to avoid leaking which emails are registered.
        res.status(401);
        throw new Error("Invalid email or password");
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        res.status(401);
        throw new Error("Invalid email or password");
      }

      const token = signAuthToken(user);
      res.json({ user: toPublicUser(user), token });
    } catch (error) {
      next(error);
    }
  }
);

// @route GET /api/users/profile
// @desc Get logged-in user's profile
// @access Private
router.get("/profile", protect, async (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

// @route PUT /api/users/profile
// @desc Update logged-in user's profile
// @access Private
router.put(
  "/profile",
  protect,
  [
    nameValidator().optional(),
    emailValidator().optional(),
    // If password is included in the update, validate complexity +
    // length. We do NOT trust the model validator alone because the
    // field uses select:false and pre-save hooks bypass the path-level
    // validators when called programmatically.
    passwordValidator().optional(),
    validate,
  ],
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select("+password");
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      if (typeof req.body.name === "string" && req.body.name.length >= 2) {
        user.name = req.body.name;
      }
      if (typeof req.body.email === "string" && req.body.email) {
        const existing = await User.findOne({ email: req.body.email });
        if (existing && existing._id.toString() !== user._id.toString()) {
          res.status(409);
          throw new Error("Email already in use");
        }
        user.email = req.body.email;
      }
      if (typeof req.body.phone === "string") {
        user.phone = req.body.phone;
      }
      if (Array.isArray(req.body.addresses)) {
        user.addresses = req.body.addresses;
      }
      if (typeof req.body.password === "string" && req.body.password.length > 0) {
        // Assigning to a selected-off field via Mongoose still works
        // because we explicitly .select("+password") above.
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const token = signAuthToken(updatedUser);
      res.json({ user: toPublicUser(updatedUser), token });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
