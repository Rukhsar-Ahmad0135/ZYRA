/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const express = require("express");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
//@route Post /api/products
// @deccreate a new proudct
//@access private/admin

router.post("/", protect, async (req, res) => {
    try {
        const { name, description, price, discountPrice, countInStock, category, brand, sizes, colors, collections, material, gender, images, isFeatured, isPublished, tags, dimensions, weight, sku, } = req.body;
        const product = new Product({
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
            user:req.user._id,//Reference to the admin user owho crated it
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    }
    catch (error) {
       console.error(error); // Log the actual error to the console
       res.status(500).json({ message: "Server Error" });
    }
});

// @route put /api/products/:id
// @desc update an existing product ID
// @access private/admin 
router.put("/:id", protect, async (req, res) => {
    try {
        const { name, description, price, discountPrice, countInStock, category, brand, sizes, colors, collections, material, gender, images, isFeatured, isPublished, tags, dimensions, weight, sku, } = req.body;
        //update product by id
        const productId = req.params.id.trim();
        const product = await Product.findById(productId);
        if (product) {
            //update product fields
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.countInStock = countInStock || product.countInStock;
            product.category = category || product.category;
            product.brand = brand || product.brand;
            product.sizes = sizes || product.sizes;
            product.colors = colors || product.colors;
            product.collections = collections || product.collections;
            product.material = material || product.material;
            product.gender = gender || product.gender;
            product.images = images || product.images;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
            product.tags = tags || product.tags;
            product.dimensions = dimensions || product.dimensions;
            product.weight = weight || product.weight;
            product.sku = sku || product.sku;
            //save the update product

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error(error); // Log the actual error to the console
        res.status(500).send("Server error");
        
    }

    //@route DELETE /api/products/:id
    // @desc delete prodct by id
    // @access pricate admin
    router.delete("/:id", protect, async (req, res) => { 
        try {
            //find the product by id
            const productId = req.params.id.trim();
            const product = await Product.findById(productId);
            if (product) {
                //remove the product from the database
                await Product.deleteOne();
                res.json({ message: "Product deleted successfully" });
            } else {
                res.status(404).json({ message: "Product not found" });
            }
        }
        catch (error) {
            console.error(error); // Log the actual error to the console
            res.status(500).send("Server error");
        }
    });


});
module.exports = router;