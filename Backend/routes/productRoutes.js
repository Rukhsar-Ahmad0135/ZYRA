/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validate, validateObjectId, paginationValidator } from "../middleware/validate.js";
import { rankSimilarProductsByName } from "../services/localStore.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route GET /api/products
// @desc List/search/filter products with pagination
// @access Public
router.get("/", [...paginationValidator(), validate], async (req, res, next) => {
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
      page: pageQ,
      pageSize: pageSizeQ,
    } = req.query;

const page = parseInt(pageQ, 10) || 1;
    // Support both `pageSize` and `limit` query params for backward compatibility
    const pageSize = parseInt(pageSizeQ || req.query.limit, 10) || 20;

    let query = {};

    // Only return published products for public listing
    query.isPublished = true;

    if (collection && collection.toLowerCase() !== "all") {
      query.collections = collection;
    }
    if (category && category.toLowerCase() !== "all") {
      query.category = { $regex: category, $options: "i" };
    }
    if (material) query.material = { $in: material.split(",") };
    if (brand) query.brand = { $in: brand.split(",") };
    if (size) query.sizes = { $in: size.split(",") };
    if (color) query.colors = { $in: [color] };
if (gender) {
      // Case-insensitive gender matching (supports "Men"/"men", "Women"/"women")
      const genderRegexMap = {
        men: "Men",
        women: "Women",
        male: "Men",
        female: "Women",
      };
      const normalizedGender = genderRegexMap[gender.toLowerCase()] || gender;
      query.gender = { $regex: new RegExp(`^${normalizedGender}$`, "i") };
    }

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
          sort = { createdAt: -1 };
          break;
        default:
          break;
      }
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      products,
      page,
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    next(error);
  }
});

// @route GET /api/products/similar/:id
// @desc Retrieve similar products based on product name relevance
// @access Public
router.get("/similar/:id", async (req, res, next) => {
  const id = req.params.id.trim();
  try {
    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid product id");
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const candidateProducts = await Product.find({
      _id: { $ne: id },
      isPublished: true,
    });

    const similarProducts = rankSimilarProductsByName(candidateProducts, product, 4);

    res.json(similarProducts);
  } catch (error) {
    next(error);
  }
});

// @route GET /api/products/best-seller
// @desc Retrieve the product with highest rating
// @access Public
router.get("/best-seller", async (req, res, next) => {
  try {
    const bestSeller = await Product.findOne({ isPublished: true }).sort({
      rating: -1,
    });
    if (!bestSeller) {
      res.status(404);
      throw new Error("No products found");
    }
    res.json(bestSeller);
  } catch (error) {
    next(error);
  }
});

// Alias for frontend if it uses plural
router.get("/best-sellers", async (req, res, next) => {
  try {
    const bestSeller = await Product.findOne({ isPublished: true }).sort({
      rating: -1,
    });
    if (!bestSeller) {
      res.status(404);
      throw new Error("No products found");
    }
    res.json(bestSeller);
  } catch (error) {
    next(error);
  }
});

// @route GET /api/products/new-arrivals
// @desc Retrieve latest 8 products
// @access Public
router.get("/new-arrivals", async (req, res, next) => {
  try {
    const newArrivals = await Product.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(newArrivals);
  } catch (error) {
    next(error);
  }
});

// @route GET /api/products/:id
// @desc Get a single product by ID
// @access Public
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id.trim();
    if (!isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid product id");
    }

    const product = await Product.findById(id);
    if (product) return res.json(product);
    res.status(404);
    throw new Error("Product not found");
  } catch (error) {
    next(error);
  }
});

export default router;
