/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadMany, uploadToCloudinary } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * Multi-image upload for admin product create/edit flow.
 * Accepts `multipart/form-data` with one or more `images` fields.
 * Returns an array of `{ url, publicId }` suitable for direct assignment
 * to `product.images`.
 */
router.post(
  "/",
  protect,
  admin,
  uploadMany.array("images", 10),
  async (req, res, next) => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        res.status(400);
        throw new Error("No images uploaded");
      }

      const folder = process.env.CLOUDINARY_PRODUCT_FOLDER || "zyra/products";
      const results = [];
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, folder);
        results.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
      res.status(201).json({ images: results });
    } catch (error) {
      if (error.message && error.message.includes("Invalid file type")) {
        res.status(400);
      }
      next(error);
    }
  }
);

export default router;
