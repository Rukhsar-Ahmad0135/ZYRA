/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Product Indexing Script
 * Indexes products from MongoDB into Pinecone for RAG retrieval
 * 
 * Usage: node Backend/scripts/index-products.js
 * Or: npm run index-products
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Product from "../models/Product.js";
import { generateProductEmbedding, generateProductText } from "../services/embeddingService.js";
import { upsertVectors, createIndexIfNotExists, getNamespace } from "../services/pineconeService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const BATCH_SIZE = 50;
const EMBEDDING_DIMENSION = parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS || "768", 10);

async function indexProducts() {
  console.log("🚀 Starting ZYRA Product Indexing...\n");

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not configured in .env");
    }

    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔧 Checking/creating Pinecone index...");
    try {
      await createIndexIfNotExists(EMBEDDING_DIMENSION);
      console.log("✅ Pinecone index ready");
    } catch (err) {
      console.error("⚠️  Pinecone index error:", err.message);
      console.log("⚠️  Continuing anyway - RAG will use catalog fallback");
    }

    const namespace = getNamespace();
    console.log(`📋 Using namespace: ${namespace}\n`);

    let skip = 0;
    let totalIndexed = 0;
    let hasMore = true;

    while (hasMore) {
      console.log(`\n📦 Fetching products batch (skip: ${skip}, limit: ${BATCH_SIZE})...`);
      
      const products = await Product.find({ isPublished: true })
        .select("name description category subcategory gender brand material colors sizes collections tags price discountPrice countInStock images")
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      if (products.length === 0) {
        hasMore = false;
        console.log("No more products to index.");
        break;
      }

      console.log(`📝 Processing ${products.length} products...`);

      const vectors = [];

      for (const product of products) {
        try {
          const productText = generateProductText(product);
          const embedding = await generateProductEmbedding(product);

          vectors.push({
            id: product._id.toString(),
            values: embedding,
            metadata: {
              productId: product._id.toString(),
              name: product.name,
              category: product.category,
              gender: product.gender || "unisex",
              brand: product.brand || "",
              material: product.material || "",
              colors: product.colors || [],
              sizes: product.sizes || [],
              price: product.price || 0,
              discountPrice: product.discountPrice || product.price || 0,
              countInStock: product.countInStock || 0,
              tags: product.tags || [],
              collections: product.collections || "",
              imageUrl: product.images?.[0]?.url || "",
              embeddingText: productText.substring(0, 1000)
            }
          });

          console.log(`  ✓ ${product.name}`);
        } catch (err) {
          console.error(`  ✗ Error embedding ${product.name}:`, err.message);
        }
      }

      if (vectors.length > 0) {
        console.log(`\n☁️  Uploading ${vectors.length} vectors to Pinecone...`);
        const result = await upsertVectors(vectors, namespace);
        totalIndexed += result.upsertedCount;
        console.log(`✅ Uploaded ${result.upsertedCount} vectors`);
      }

      skip += BATCH_SIZE;

      if (products.length < BATCH_SIZE) {
        hasMore = false;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 INDEXING COMPLETE!");
    console.log(`📊 Total products indexed: ${totalIndexed}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ INDEXING FAILED:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

async function reindexProduct(productId) {
  console.log(`\n🔄 Reindexing single product: ${productId}`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const product = await Product.findById(productId).lean();
    
    if (!product) {
      console.log(`Product ${productId} not found`);
      return { success: false, error: "Product not found" };
    }

    const productText = generateProductText(product);
    const embedding = await generateProductEmbedding(product);

    const vector = {
      id: product._id.toString(),
      values: embedding,
      metadata: {
        productId: product._id.toString(),
        name: product.name,
        category: product.category,
        gender: product.gender || "unisex",
        brand: product.brand || "",
        material: product.material || "",
        colors: product.colors || [],
        sizes: product.sizes || [],
        price: product.price || 0,
        discountPrice: product.discountPrice || product.price || 0,
        countInStock: product.countInStock || 0,
        tags: product.tags || [],
        collections: product.collections || "",
        imageUrl: product.images?.[0]?.url || "",
        embeddingText: productText.substring(0, 1000)
      }
    };

    await upsertVectors([vector], getNamespace());
    console.log(`✅ Product ${product.name} reindexed successfully`);
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Reindex failed:`, error.message);
    return { success: false, error: error.message };
  } finally {
    await mongoose.disconnect();
  }
}

async function deleteProduct(productId) {
  console.log(`\n🗑️  Deleting product from Pinecone: ${productId}`);
  
  try {
    const { deleteVector } = await import("../services/pineconeService.js");
    await deleteVector(productId, getNamespace());
    console.log(`✅ Product ${productId} deleted from Pinecone`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Delete failed:`, error.message);
    return { success: false, error: error.message };
  }
}

const args = process.argv.slice(2);

if (args[0] === "reindex" && args[1]) {
  reindexProduct(args[1]);
} else if (args[0] === "delete" && args[1]) {
  deleteProduct(args[1]);
} else {
  indexProducts();
}

export { reindexProduct, deleteProduct };
