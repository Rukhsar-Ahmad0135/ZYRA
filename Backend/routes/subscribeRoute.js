/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import Subscriber from "../models/Subscriber.js";
import { validate, emailValidator } from "../middleware/validate.js";

const router = express.Router();

// @route   POST /api/subscribers
// @desc    Handle newsletter subscription
// @access  Public
router.post("/", [emailValidator()], validate, async (req, res, next) => {
  try {
    const { email } = req.body;

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error("Email is already subscribed");
    }

    await Subscriber.create({ email });
    res.status(201).json({ message: "Successfully subscribed to the newsletter" });
  } catch (error) {
    next(error);
  }
});

export default router;

