/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import Order from "../models/order.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate, validateObjectId } from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/admin/orders
// @desc    Get all orders with pagination (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const status = req.query.status || "";

    // Support both the new `orderStatus` taxonomy and the legacy `status`.
    let query = {};
    if (status) {
      const canonical = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];
      const match = canonical.find((s) => s.toLowerCase() === status.toLowerCase());
      query = match
        ? { $or: [{ orderStatus: match }, { status: match.toLowerCase() }] }
        : { status: status.toLowerCase() };
    }
    const total = await Order.countDocuments(query);


    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({ orders, page, pages: Math.ceil(total / pageSize), total });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get single order details (admin only)
// @access  Private/Admin
router.get("/:id", protect, admin, validateObjectId("id"), validate, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order status / mark paid / mark delivered (admin only)
// @access  Private/Admin
router.put("/:id", protect, admin, validateObjectId("id"), validate, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const ORDER_STATUSES = [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    // Map the new taxonomy to the legacy `status` field for old UI.
    const legacyMap = {
      Pending: "processing",
      Confirmed: "processing",
      Packed: "processing",
      Shipped: "shipped",
      Delivered: "delivered",
      Cancelled: "cancelled",
    };

    // Update orderStatus (new taxonomy) if provided
    if (req.body.orderStatus) {
      const incoming = String(req.body.orderStatus).trim();
      const match = ORDER_STATUSES.find(
        (s) => s.toLowerCase() === incoming.toLowerCase()
      );
      if (!match) {
        res.status(400);
        throw new Error("Invalid order status");
      }
      order.orderStatus = match;
      order.status = legacyMap[match];
      if (match === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      } else {
        order.isDelivered = false;
        order.deliveredAt = undefined;
      }
    } else if (req.body.status) {
      // Legacy path
      const VALID_STATUSES = ["processing", "shipped", "delivered", "cancelled"];
      const incomingStatus = String(req.body.status).toLowerCase().trim();
      const safeStatus = incomingStatus === "deliverd" ? "delivered" : incomingStatus;
      if (!VALID_STATUSES.includes(safeStatus)) {
        res.status(400);
        throw new Error("Invalid order status");
      }
      order.status = safeStatus;
      if (safeStatus === "delivered") {
        order.orderStatus = "Delivered";
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      } else {
        order.isDelivered = false;
        order.deliveredAt = undefined;
        if (safeStatus === "shipped") order.orderStatus = "Shipped";
        else if (safeStatus === "cancelled") order.orderStatus = "Cancelled";
        else order.orderStatus = "Pending";
      }
    }

    // Update payment status (Pending / Paid) — used for COD
    if (req.body.paymentStatus) {
      const incoming = String(req.body.paymentStatus).trim();
      const isPaid = incoming.toLowerCase() === "paid";
      order.paymentStatus = isPaid ? "Paid" : "Pending";
      order.isPaid = isPaid;
      order.paidAt = isPaid ? Date.now() : undefined;
    }

    // Mark as paid (boolean)
    if (req.body.isPaid !== undefined) {
      order.isPaid = Boolean(req.body.isPaid);
      order.paymentStatus = order.isPaid ? "Paid" : "Pending";
      order.paidAt = order.isPaid ? Date.now() : undefined;
    }

    // Mark as delivered directly
    if (req.body.isDelivered !== undefined) {
      order.isDelivered = Boolean(req.body.isDelivered);
      order.deliveredAt = order.isDelivered ? Date.now() : undefined;
      if (order.isDelivered) {
        order.status = "delivered";
        order.orderStatus = "Delivered";
      }
    }


    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete an order (admin only)
// @access  Private/Admin
router.delete("/:id", protect, admin, validateObjectId("id"), validate, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }
    await order.deleteOne();
    res.json({ message: "Order removed" });
  } catch (error) {
    next(error);
  }
});

export default router;


