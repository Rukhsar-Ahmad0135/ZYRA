/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Embedding Service
 * Uses Gemini to generate embeddings for product retrieval
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const USD_TO_PKR = 280;

let genAI = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured in .env");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function generateProductText(product) {
  const priceDisplay = product.discountPrice 
    ? `$${product.discountPrice.toFixed(2)} ($${product.price.toFixed(2)} discounted)`
    : `$${product.price.toFixed(2)}`;

  const inStock = product.countInStock > 0 ? "In Stock" : "Out of Stock";
  const sizes = product.sizes?.join(", ") || "";
  const colors = product.colors?.join(", ") || "";
  const tags = product.tags?.join(", ") || "";
  const collection = product.collections || product.collection || "";

  const text = `
Product: ${product.name}
Description: ${product.description}
Category: ${product.category}
Subcategory: ${product.subcategory || "General"}
Gender: ${product.gender}
Brand: ${product.brand || "Generic"}
Material: ${product.material || "Mixed"}
Colors: ${colors}
Sizes: ${sizes}
Collection: ${collection}
Style: ${tags}
Price: ${priceDisplay}
Stock: ${inStock} (${product.countInStock} units)
`.trim();

  return text;
}

export function getEmbeddingModel() {
  return process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
}

export async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured in .env");
  }
  
  if (!apiKey.startsWith("AIza")) {
    throw new Error("Invalid GEMINI_API_KEY format. Google AI keys start with 'AIza'. Please get a valid key from https://aistudio.google.com/");
  }
  
  const model = getGeminiClient().getGenerativeModel({ 
    model: getEmbeddingModel()
  });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateProductEmbedding(product) {
  const text = generateProductText(product);
  return generateEmbedding(text);
}

export function generateQueryText(params) {
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
    preferences
  } = params;

  let query = "";

  if (gender) {
    query += `${gender}'s `;
  }

  if (occasion) {
    query += `${occasion} `;
  }

  if (style) {
    query += `${style} `;
  }

  if (category) {
    query += `${category} `;
  }

  if (color) {
    query += `${color} `;
  }

  if (material) {
    query += `${material} `;
  }

  if (brand) {
    query += `${brand} `;
  }

  query += "outfit";

  if (budget) {
    const budgetText = currency === "PKR" 
      ? `under Rs. ${budget}` 
      : `under $${budget}`;
    query += ` ${budgetText}`;
  }

  if (preferences) {
    query += `. Preferences: ${preferences}`;
  }

  return query.trim();
}

export function convertBudget(budget, fromCurrency, toCurrency = "USD") {
  if (fromCurrency === toCurrency) {
    return budget;
  }

  if (fromCurrency === "PKR" && toCurrency === "USD") {
    return budget / USD_TO_PKR;
  }

  if (fromCurrency === "USD" && toCurrency === "PKR") {
    return budget * USD_TO_PKR;
  }

  return budget;
}

export function detectCurrency(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("rs.") || lowerText.includes("pkr") || lowerText.includes("rupee")) {
    return "PKR";
  }
  
  return "USD";
}

export function extractBudget(text) {
  const patterns = [
    /under\s*\$?\s*(\d+(?:\.\d{2})?)\s*(?:usd|dollar)?/i,
    /budget\s*\$?\s*(\d+(?:\.\d{2})?)/i,
    /(\d+(?:\.\d{2})?)\s*(?:usd|dollar)/i,
    /rs\.?\s*(\d+(?:\.\d{2})?)/i,
    /(\d+(?:\.\d{2})?)\s*pkr/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  return null;
}

export default {
  generateProductText,
  generateEmbedding,
  generateProductEmbedding,
  generateQueryText,
  convertBudget,
  detectCurrency,
  extractBudget,
  getEmbeddingModel
};
