/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import express from "express";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validate,
  validateObjectId,
  nameValidator,
  priceValidator,
  countInStockValidator,
  skuValidator,
  genderValidator,
  imagesValidator,
} from "../middleware/validate.js";
import { cleanupRemovedImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// @route   GET /api/admin/products
// @desc    Get all products with search + pagination (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({ products, page, pages: Math.ceil(total / pageSize), total });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/products
// @desc    Create a new product (admin only)
// @access  Private/Admin
router.post(
  "/",
  protect,
  admin,
  [
    nameValidator(),
    priceValidator(),
    countInStockValidator(),
    skuValidator(),
    genderValidator().optional(),
    imagesValidator().optional(),
  ],
  validate,
  async (req, res, next) => {
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
        metaTitle,
        metaDescription,
        metaKeywords,
      } = req.body;

      // Check for duplicate SKU
      const existing = await Product.findOne({ sku });
      if (existing) {
        res.status(400);
        throw new Error(`Product with SKU "${sku}" already exists`);
      }

      // Normalize incoming images: accept either { url, publicId, altText }
      // objects or legacy string URLs. Strip out anything that's not a string
      // url to avoid breaking the schema.
      const normalizedImages = Array.isArray(images)
        ? images
            .map((img) => {
              if (typeof img === "string") {
                return { url: img };
              }
              if (img && typeof img.url === "string") {
                return {
                  url: img.url,
                  publicId:
                    typeof img.publicId === "string" && img.publicId
                      ? img.publicId
                      : undefined,
                  altText:
                    typeof img.altText === "string" ? img.altText : undefined,
                };
              }
              return null;
            })
            .filter(Boolean)
        : [];

      const product = new Product({
        name,
        description: description || "",
        price,
        discountPrice,
        countInStock,
        category: category || "Uncategorized",
        brand,
        sizes: sizes || [],
        colors: colors || [],
        collections: collections || "General",
        material,
        gender,
        images: normalizedImages,
        isFeatured: isFeatured || false,
        isPublished: isPublished !== undefined ? isPublished : true,
        tags: tags || [],
        dimensions,
        weight,
        sku,
        metaTitle,
        metaDescription,
        metaKeywords,
        user: req.user._id,
      });

      const createdProduct = await product.save();
      res.status(201).json(createdProduct);
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/admin/products/:id
// @desc    Update a product (admin only)
// @access  Private/Admin
router.put(
  "/:id",
  protect,
  admin,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

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
        metaTitle,
        metaDescription,
        metaKeywords,
      } = req.body;

      // Check for duplicate SKU if changing SKU
      if (sku && sku !== product.sku) {
        const existing = await Product.findOne({ sku, _id: { $ne: product._id } });
        if (existing) {
          res.status(400);
          throw new Error(`Product with SKU "${sku}" already exists`);
        }
      }

      // Capture previous images BEFORE mutating the document so we can
      // clean up any Cloudinary assets that were removed during this edit.
      const previousImages = product.images || [];

      // Normalize incoming images (same shape as the create handler).
      const normalizedImages = Array.isArray(images)
        ? images
            .map((img) => {
              if (typeof img === "string") {
                return { url: img };
              }
              if (img && typeof img.url === "string") {
                return {
                  url: img.url,
                  publicId:
                    typeof img.publicId === "string" && img.publicId
                      ? img.publicId
                      : undefined,
                  altText:
                    typeof img.altText === "string" ? img.altText : undefined,
                };
              }
              return null;
            })
            .filter(Boolean)
        : product.images;

      product.name = name || product.name;
      product.description = description !== undefined ? description : product.description;
      product.price = price ?? product.price;
      product.discountPrice = discountPrice ?? product.discountPrice;
      product.countInStock = countInStock ?? product.countInStock;
      product.category = category || product.category;
      product.brand = brand !== undefined ? brand : product.brand;
      product.sizes = sizes || product.sizes;
      product.colors = colors || product.colors;
      product.collections = collections || product.collections;
      product.material = material !== undefined ? material : product.material;
      product.gender = gender !== undefined ? gender : product.gender;
      product.images = normalizedImages;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags || product.tags;
      product.dimensions = dimensions || product.dimensions;
      product.weight = weight !== undefined ? weight : product.weight;
      product.sku = sku || product.sku;
      product.metaTitle = metaTitle !== undefined ? metaTitle : product.metaTitle;
      product.metaDescription = metaDescription !== undefined ? metaDescription : product.metaDescription;
      product.metaKeywords = metaKeywords !== undefined ? metaKeywords : product.metaKeywords;

      const updatedProduct = await product.save();

      // Best-effort Cloudinary cleanup: remove any images that were on the
      // previous product but are no longer in the new image list.
      try {
        await cleanupRemovedImages(previousImages, normalizedImages);
      } catch (cleanupErr) {
        console.warn(
          "[admin/products PUT] cloudinary cleanup warning:",
          cleanupErr?.message,
        );
      }

      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  protect,
  admin,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }
      await product.deleteOne();
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
