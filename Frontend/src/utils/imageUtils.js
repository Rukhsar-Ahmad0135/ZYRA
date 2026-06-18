/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

// Centralized image normalization so UI works with different backend shapes.
// Supported shapes (best-effort):
// - product.images: [{ url, altText }, { url, alt }, "string-url", { imageUrl }]
// - product.image: "url" 
// - product.imageUrl: "url"
// - item.image: "url"

export function normalizeProductImages(product) {
  if (!product) return [];

  // 1) Common: images array
  if (Array.isArray(product.images)) {
    return product.images
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string") {
          return { url: img, altText: "" };
        }
        const url = img.url ?? img.imageUrl ?? img.image;
        const altText = img.altText ?? img.alt ?? "";
        if (!url) return null;
        return { url, altText };
      })
      .filter(Boolean);
  }

  // 2) Single image fields
  const singleUrl = product.image ?? product.imageUrl ?? null;
  if (typeof singleUrl === "string" && singleUrl) {
    return [{ url: singleUrl, altText: product.name ?? "" }];
  }

  return [];
}

