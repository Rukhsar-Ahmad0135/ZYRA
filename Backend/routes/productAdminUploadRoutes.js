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
        return res.status(400).json({ message: "No images uploaded" });
      }

      // Validate file types and sizes
      for (const file of req.files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.mimetype)) {
          return res.status(400).json({ message: `Invalid file type: ${file.originalname}. Only JPEG, PNG, WEBP, GIF, AVIF allowed.` });
        }
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: `File too large: ${file.originalname}. Max size is 5MB.` });
        }
      }

      const folder = process.env.CLOUDINARY_PRODUCT_FOLDER || "ZYRA";
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
      return next(error);
    }
  }
);

export default router;
