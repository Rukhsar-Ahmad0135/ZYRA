/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import User from "../models/Users.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Dashboard statistics (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res, next) => {
  try {
    // Total revenue (sum of all order totals)
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const revenue = revenueResult[0]?.totalRevenue || 0;
    const totalOrders = revenueResult[0]?.totalOrders || 0;

    // Count products & users
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Order status breakdown
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatus = {
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    statusBreakdown.forEach((s) => {
      if (orderStatus[s._id] !== undefined) orderStatus[s._id] = s.count;
    });

    // Recent orders (5)
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      revenue,
      totalOrders,
      totalProducts,
      totalUsers,
      totalCustomers,
      totalAdmins,
      orderStatus,
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

export default router;


