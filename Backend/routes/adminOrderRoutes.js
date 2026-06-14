/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route GET /api/admin/orders
// @desc Get all orders (admin only)
// @access Private/admin

router.get("/", protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "name email");
        res.json(orders);
    }
    catch (error) { 
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// @route PUT /api/admin/orders/:id
// @desc Update order status
// @access Private/admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            // Normalize status casing to match schema enum:
            // enum is: ["processing", "shipped", "delivered", "cancelled"]
            const incomingStatus = req.body.status || order.status;
            const normalizedStatus = typeof incomingStatus === "string" ? incomingStatus.toLowerCase().trim() : incomingStatus;

            // Support common misspelling coming from frontend/testing:
            // "deliverd" => "delivered"
            const safeStatus = normalizedStatus === "deliverd" ? "delivered" : normalizedStatus;

            order.status = safeStatus;
            order.isDelivered = normalizedStatus === "delivered" ? true : order.isDelivered;
            order.deliveredAt = normalizedStatus === "delivered" ? Date.now() : order.deliveredAt;

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route DELETE /api/admin/orders/:id
// @desc Delete an order (admin only)
// @access Private/admin
router.delete("/:id", protect, admin, async (req, res) => { 
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await order.deleteOne();
            res.json({ message: "Order removed" });
        } else {
            res.status(404).json({ message: "Order not found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;