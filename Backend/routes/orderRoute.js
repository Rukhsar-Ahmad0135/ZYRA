/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the license file for more information.
 */

import express from "express";
import Order from "../models/order.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

//@route GET /api/orders/my-order
// @desc Get logged in user's orders
// @acccess public

// Declare static route first to avoid any accidental matching issues
router.get("/my-orders", protect, async (req, res) => {
    try {
        //find orders for the authenticated  user
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });//srot by most recent orders
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

//@route GET /api/orders/:id
// @desc vGET order details by ID
// @acccess public

router.get("/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent CastError when "id" is not a valid ObjectId
        // (e.g., frontend accidentally calls /api/orders/id)
        if (!id) {
            return res.status(400).json({ message: "Order id is required" });
        }

        // Mongoose allows 12-byte hex strings (ObjectId length: 24 hex chars)
        if (!/^[a-fA-F0-9]{24}$/.test(id)) {
            return res.status(400).json({ message: `Invalid order id: ${id}` });
        }

        const order = await Order.findById(id).populate("user", "name email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Return the full order details
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});
export default router;

