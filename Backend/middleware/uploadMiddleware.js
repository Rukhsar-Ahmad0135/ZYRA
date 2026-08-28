/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

let _configured = false;

function ensureCloudinaryConfig() {
  if (_configured) return;
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  _configured = true;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_REQUEST = 10;

// Store file in memory so we can stream to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WEBP, GIF and AVIF images are allowed."
        )
      );
    }
  },
});

/**
 * Multi-image upload middleware for admin product create/edit flow.
 * Allows up to `MAX_FILES_PER_REQUEST` files (default 10) in a single
 * `multipart/form-data` request, under the field name `images`.
 */
export const uploadMany = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES_PER_REQUEST },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, WEBP, GIF and AVIF images are allowed."
        )
      );
    }
  },
});

/**
 * Streams an in-memory buffer to Cloudinary and resolves with the upload result.
 * Uses the configured product folder from environment.
 */
export const uploadToCloudinary = (fileBuffer, folder) => {
  ensureCloudinaryConfig();
  const uploadFolder = folder || process.env.CLOUDINARY_PRODUCT_FOLDER || "ZYRA";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: uploadFolder, resource_type: "image" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/**
 * Best-effort deletion of a Cloudinary asset by publicId. Never throws —
 * failures are logged so a single bad asset cannot break an admin request.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || typeof publicId !== "string") return;
  ensureCloudinaryConfig();
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    if (result?.result !== "ok" && result?.result !== "not found") {
      console.warn(
        `[cloudinary] unexpected destroy result for ${publicId}:`,
        result,
      );
    }
  } catch (err) {
    console.warn(`[cloudinary] failed to delete ${publicId}:`, err?.message);
  }
};

/**
 * Compute the set of publicIds that exist on the old product but are no
 * longer referenced by the new image list, and delete them. Safe to call
 * with a missing/empty `previousImages` array.
 */
export const cleanupRemovedImages = async (previousImages, nextImages) => {
  if (!Array.isArray(previousImages) || previousImages.length === 0) return;
  const keep = new Set(
    (Array.isArray(nextImages) ? nextImages : [])
      .map((img) =>
        typeof img === "string" ? null : img?.publicId || null,
      )
      .filter(Boolean),
  );
  const removed = previousImages
    .map((img) => (typeof img === "string" ? null : img?.publicId || null))
    .filter((id) => id && !keep.has(id));
  for (const id of removed) {
    await deleteFromCloudinary(id);
  }
};
