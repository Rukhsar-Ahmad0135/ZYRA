/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route Post /api/products
// @desc create a new product
// @access private/admin
router.post("/", protect, async (req, res) => {
  try {
    const {
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
    } = req.body;

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
      user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route put /api/products/:id
// @desc update an existing product
// @access private/admin
router.put("/:id", protect, async (req, res) => {
  try {
    const {
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
    } = req.body;

    const productId = req.params.id.trim();
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(productId);
    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price ?? product.price;
      product.discountPrice = discountPrice ?? product.discountPrice;
      product.countInStock = countInStock ?? product.countInStock;
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

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route DELETE /api/products/:id
// @desc delete product by id
// @access private/admin
router.delete("/:id", protect, async (req, res) => {
  try {
    const productId = req.params.id.trim();
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(productId);
    if (product) {
      await Product.deleteOne({ _id: productId });
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route GET /api/products
// @desc list/search/filter products
// @access public
router.get("/", async (req, res) => {
  try {
    const {
      collection,
      size,
      color,
      gender,
      minPrice,
      maxPrice,
      sortBy,
      search,
      category,
      material,
      brand,
      limit,
    } = req.query;

    let query = {};

    if (collection && collection.toLocaleLowerCase() !== "all") {
      query.collections = collection;
    }
    if (category && category.toLocaleLowerCase() !== "all") {
      query.category = { $regex: category, $options: "i" };
    }
    if (material) query.material = { $in: material.split(",") };
    if (brand) query.brand = { $in: brand.split(",") };
    if (size) query.sizes = { $in: size.split(",") };
    if (color) query.colors = { $in: [color] };
    if (gender) query.gender = gender;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "newest":
          sort = { rating: -1 };
          break;
        default:
          break;
      }
    }

    const products = await Product.find(query).sort(sort).limit(Number(limit) || 0);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route GET /api/products/similar/:id
// @desc retrieve similar products based on the current product gender and category
// @access public
router.get("/similar/:id", async (req, res) => {
  const id = req.params.id.trim();

  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const similarProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      gender: product.gender,
    }).limit(4);

    res.json(similarProducts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route GET /api/products/best-seller
// @desc retrieve the product with highest rating
// @access public
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });
    if (!bestSeller) {
      return res.status(404).json({ message: "No products found" });
    }
    res.json(bestSeller);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Alias for frontend if it uses plural
router.get("/best-sellers", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });
    if (!bestSeller) {
      return res.status(404).json({ message: "No products found" });
    }
    res.json(bestSeller);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//@route GET /api/products/new-arrivals
//@desc retrive latest 8 products = creation date
//@access public
router.get("/new-arrivals", async (req, res) => {
  try {
    const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
    res.json(newArrivals);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route GET /api/products/:id
// @desc Get a single product by ID
// @access public
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (product) return res.json(product);
    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;

