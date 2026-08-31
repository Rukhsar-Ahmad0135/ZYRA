/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import User from "../models/Users.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validate,
  validateObjectId,
  nameValidator,
  emailValidator,
  passwordValidator,
  roleValidator,
} from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users with search + pagination (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({ users, page, pages: Math.ceil(total / pageSize), total });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users
// @desc    Add a new user (admin only)
// @access  Private/Admin
router.post(
  "/",
  protect,
  admin,
  [nameValidator(), emailValidator(), passwordValidator(), roleValidator()],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400);
        throw new Error("User already exists");
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || "customer",
      });

      res.status(201).json({
        message: "User created successfully",
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/admin/users/:id
// @desc    Update user info (admin only)
// @access  Private/Admin
router.put(
  "/:id",
  protect,
  admin,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.role) user.role = req.body.role;
      // Optional password update by admin
      if (req.body.password) user.password = req.body.password;

      const updatedUser = await user.save();
      res.json({
        message: "User updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  protect,
  admin,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }
      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot delete your own account");
      }
      await user.deleteOne();
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

