/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload, uploadToCloudinary } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload a single image to Cloudinary (authenticated users only)
// @access  Private
router.post("/", protect, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const result = await uploadToCloudinary(req.file.buffer, "zyra");
    res.json({ imageUrl: result.secure_url, publicId: result.public_id });
  } catch (error) {
    // Multer file-type errors come through here
    if (error.message && error.message.includes("Invalid file type")) {
      res.status(400);
    }
    next(error);
  }
});

export default router;

