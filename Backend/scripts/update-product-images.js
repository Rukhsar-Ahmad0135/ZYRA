/*
 * Script to update product images in MongoDB
 * Run: node Backend/scripts/update-product-images.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Product from "../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const productImageUpdates = {
  "Slim-Fit Easy-Iron Shirt": [
    { url: "https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950359/Slim-Fit_Stretch_Shirt_jaolne.jpg", altText: "Slim-Fit Easy-Iron Shirt front view" },
    { url: "https://res.cloudinary.com/dab9s1yeq/image/upload/v1785950359/Slim-Fit_Stretch_Shirt1_c5q8va.jpg", altText: "Slim-Fit Easy-Iron Shirt back view" }
  ]
};

async function updateProductImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    let updateCount = 0;

    for (const [productName, images] of Object.entries(productImageUpdates)) {
      const result = await Product.updateOne(
        { name: productName },
        { $set: { images: images } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✓ Updated: ${productName}`);
        updateCount++;
      } else {
        console.log(`✗ Not found or not modified: ${productName}`);
      }
    }

    console.log(`\nTotal updated: ${updateCount} products`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

updateProductImages();
