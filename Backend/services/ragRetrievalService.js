/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - RAG Retrieval Service
 * Combines Pinecone vector search with MongoDB verification
 * Product IDs are ALWAYS verified against MongoDB before returning
 */

import mongoose from "mongoose";
import Product from "../models/Product.js";
import { generateEmbedding, generateQueryText, extractBudget, detectCurrency } from "./embeddingService.js";
import { queryVectors, getTopK } from "./pineconeService.js";

const USD_TO_PKR = 280;

class RAGRetrievalService {
  constructor() {
    this.connected = false;
  }

  async ensureConnection() {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI;
      if (mongoUri) {
        await mongoose.connect(mongoUri);
      }
    }
    this.connected = mongoose.connection.readyState === 1;
  }

  async retrieveProducts(params) {
    const {
      gender,
      occasion,
      style,
      budget,
      currency = "USD",
      category,
      color,
      material,
      brand,
      preferences,
      userQuery,
      filters = {},
      topK = null
    } = params;

    await this.ensureConnection();

    let queryText;
    let queryBudget = budget;

    if (userQuery) {
      queryText = userQuery;
      queryBudget = extractBudget(userQuery) || budget;
    } else {
      queryText = generateQueryText({
        gender,
        occasion,
        style,
        budget: queryBudget,
        currency,
        category,
        color,
        material,
        brand,
        preferences
      });
    }

    const queryEmbedding = await generateEmbedding(queryText);

    let vectorResults = [];
    try {
      vectorResults = await queryVectors(queryEmbedding, {
        topK: topK || getTopK(),
        filter: this.buildFilter(filters)
      });
    } catch (err) {
      console.warn("Pinecone query failed:", err.message);
      return [];
    }

    const verifiedProducts = await this.verifyAndEnrichProducts(
      vectorResults,
      queryBudget,
      currency
    );

    return verifiedProducts;
  }

  buildFilter(filters) {
    const filterConditions = [];

    if (filters.category) {
      filterConditions.push({ category: filters.category });
    }

    if (filters.gender) {
      filterConditions.push({ gender: filters.gender });
    }

    if (filters.minPrice !== undefined) {
      filterConditions.push({ price: { $gte: filters.minPrice } });
    }

    if (filters.maxPrice !== undefined) {
      filterConditions.push({ price: { $lte: filters.maxPrice } });
    }

    if (filters.colors && filters.colors.length > 0) {
      filterConditions.push({ colors: { $in: filters.colors } });
    }

    if (filters.sizes && filters.sizes.length > 0) {
      filterConditions.push({ sizes: { $in: filters.sizes } });
    }

    if (filters.collections && filters.collections.length > 0) {
      filterConditions.push({ collections: { $in: filters.collections } });
    }

    if (filterConditions.length === 0) {
      return null;
    }

    if (filterConditions.length === 1) {
      return filterConditions[0];
    }

    return { $and: filterConditions };
  }

  async verifyAndEnrichProducts(vectorResults, budget, currency = "USD") {
    if (!vectorResults || vectorResults.length === 0) {
      return [];
    }

    const productIds = vectorResults
      .map(r => r.id || r.metadata?.productId)
      .filter(Boolean);

    if (productIds.length === 0) {
      return [];
    }

    const objectIds = productIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const products = await Product.find({
      _id: { $in: objectIds },
      isPublished: true,
      countInStock: { $gt: 0 }
    }).lean();

    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const verifiedResults = [];

    for (const result of vectorResults) {
      const productId = result.id || result.metadata?.productId;
      const product = productMap.get(productId);

      if (!product) {
        continue;
      }

      const normalizedPrice = this.normalizePrice(product.price, currency);
      const normalizedDiscountPrice = product.discountPrice
        ? this.normalizePrice(product.discountPrice, currency)
        : null;

      if (budget && normalizedPrice > budget) {
        continue;
      }

      const enrichedProduct = {
        ...product,
        _id: product._id,
        productId: product._id.toString(),
        vectorScore: result.score || 0,
        displayPrice: this.formatPrice(
          normalizedDiscountPrice || normalizedPrice,
          currency
        ),
        originalPrice: this.formatPrice(normalizedPrice, currency),
        isOnSale: !!product.discountPrice && product.discountPrice < product.price,
        currency
      };

      verifiedResults.push(enrichedProduct);
    }

    verifiedResults.sort((a, b) => b.vectorScore - a.vectorScore);

    return verifiedResults;
  }

  normalizePrice(price, currency) {
    if (!price) return 0;

    if (currency === "PKR") {
      return price * USD_TO_PKR;
    }

    return price;
  }

  formatPrice(price, currency = "USD") {
    if (currency === "PKR") {
      return `Rs. ${Math.round(price).toLocaleString()}`;
    }
    return `$${price.toFixed(2)}`;
  }

  async getProductById(productId) {
    await this.ensureConnection();

    try {
      const product = await Product.findOne({
        _id: productId,
        isPublished: true
      }).lean();

      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  async getProductsByIds(productIds) {
    await this.ensureConnection();

    const objectIds = productIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const products = await Product.find({
      _id: { $in: objectIds },
      isPublished: true
    }).lean();

    return products;
  }

  async getOutfitRecommendations(context) {
    const {
      existingItems = [],
      occasion,
      style,
      budget,
      currency = "USD"
    } = context;

    await this.ensureConnection();

    const existingCategories = existingItems.map(item => item.category).filter(Boolean);
    const existingProductIds = existingItems.map(item => item.productId).filter(Boolean);

    const complementaryCategories = this.getComplementaryCategories(existingCategories);

    const complementaryProducts = await this.retrieveProducts({
      category: complementaryCategories,
      occasion,
      style,
      budget,
      currency,
      filters: existingProductIds.length > 0
        ? {}
        : {}
    });

    const filteredProducts = complementaryProducts.filter(
      p => !existingProductIds.includes(p.productId)
    );

    return {
      complementary: filteredProducts.slice(0, 10),
      existingItems,
      missingCategories: complementaryCategories.filter(
        cat => !existingCategories.includes(cat)
      )
    };
  }

  getComplementaryCategories(existingCategories) {
    const allCategories = [
      "Tops", "Bottoms", "Dresses", "Outerwear",
      "Shoes", "Accessories", " Bags", "Jewelry"
    ];

    const categoryRelations = {
      "Tops": ["Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"],
      "Bottoms": ["Tops", "Outerwear", "Shoes", "Accessories"],
      "Dresses": ["Outerwear", "Shoes", "Accessories", "Bags"],
      "Outerwear": ["Tops", "Bottoms", "Dresses", "Shoes"],
      "Shoes": ["Tops", "Bottoms", "Dresses", "Outerwear"],
      "Accessories": ["Tops", "Bottoms", "Dresses", "Outerwear"],
      "Bags": ["Tops", "Bottoms", "Dresses", "Outerwear"],
      "Jewelry": ["Tops", "Dresses", "Accessories"]
    };

    const complementary = new Set();

    for (const cat of existingCategories) {
      const related = categoryRelations[cat] || [];
      related.forEach(c => complementary.add(c));
    }

    existingCategories.forEach(cat => complementary.delete(cat));

    if (complementary.size === 0) {
      return allCategories.filter(c => !existingCategories.includes(c));
    }

    return Array.from(complementary);
  }

  async getSimilarProducts(productId, limit = 5) {
    await this.ensureConnection();

    const product = await this.getProductById(productId);
    if (!product) {
      return [];
    }

    const similarProducts = await this.retrieveProducts({
      category: product.category,
      gender: product.gender,
      budget: product.price * 1.5,
      currency: "USD",
      filters: {
        category: product.category
      },
      topK: limit + 1
    });

    return similarProducts
      .filter(p => p.productId !== productId)
      .slice(0, limit);
  }
}

export const ragRetrievalService = new RAGRetrievalService();

export default ragRetrievalService;
