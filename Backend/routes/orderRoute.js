/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import Order from "../models/order.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate, validateObjectId } from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/orders/my-orders
// @desc    Get logged-in user's orders
// @access  Private
router.get("/my-orders", protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details by ID (ownership validated)
// @access  Private
router.get("/:id", protect, validateObjectId("id"), validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Ownership validation: user can only access their own orders (admin can access all)
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;

