/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */
const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();
// @route GET /api/admin/products
// @desc Get all products (admin only)
// @access Private/admin
router.get("/", protect, admin, async (req, res) => { 
    try {
        const products= await Product.find({});
        res.json(products);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
}); 

// @route POST /api/admin/products
// @desc Create a new product (admin only)
// @access Private/admin

// @route PUT /api/admin/products/:id
// @desc Update a product (admin only)
// @access Private/admin



module.exports = router;
