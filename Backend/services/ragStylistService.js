/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Context-Aware RAG Service
 * Maintains conversation context, locked items, and outfit state
 * Product IDs ALWAYS verified against MongoDB
 */

import OpenAI from "openai";
import { ragRetrievalService } from "./ragRetrievalService.js";
import {
  getContext,
  updateContext,
  smartUpdateContext,
  lockItem,
  unlockItem,
  getLockedItems,
  isItemLocked,
  addItemToOutfit,
  removeItemFromOutfit,
  replaceItemInOutfit,
  getOutfitState,
  getFullSessionData,
  setOutfitSummary,
  addConversationMessage,
  getConversationHistory,
  clearSession,
  createSession,
  getCanonicalCategory,
  normalizeCategory
} from "./conversationMemoryService.js";
import { fetchProductByIds } from "./stylistResponse.js";

const USD_TO_PKR = 280;

const CATEGORY_ITEMS = {
  tops: "Shirts, Tops, Blouses",
  bottoms: "Pants, Jeans, Shorts, Skirts",
  dresses: "Dresses, Gowns, Jumpsuits",
  outerwear: "Jackets, Coats, Blazers",
  shoes: "Shoes, Sneakers, Heels",
  accessories: "Bags, Belts, Jewelry, Watches",
  bags: "Bags, Handbags, Backpacks"
};

function getProviderConfig() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.STYLIST_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey.startsWith("AIza")) {
    return { provider: "gemini", apiKey: geminiKey };
  }

  if (openrouterKey) {
    return { provider: "openrouter", apiKey: openrouterKey };
  }

  if (openaiKey) {
    return { provider: "openai", apiKey: openaiKey };
  }

  return { provider: "fallback", apiKey: null };
}

function getOpenAIClient(apiKey, baseURL) {
  return new OpenAI({
    apiKey,
    baseURL: baseURL || "https://openrouter.ai/api/v1",
    timeout: 60000
  });
}

async function fetchAllProducts() {
  const { default: Product } = await import("../models/Product.js");
  return Product.find({ isPublished: true }).lean();
}

async function fetchProductsByCategory(category, gender, excludeIds = [], limit = 10) {
  const { default: Product } = await import("../models/Product.js");
  const query = { isPublished: true, countInStock: { $gt: 0 } };

  if (gender) {
    query.gender = { $in: [gender.toLowerCase(), "unisex"] };
  }

  if (category) {
    const normalized = normalizeCategory(category);
    if (normalized) {
      query.category = new RegExp(normalized, "i");
    }
  }

  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }

  return Product.find(query).limit(limit).lean();
}

function detectIntent(prompt, currentContext = {}) {
  const text = String(prompt || "").toLowerCase();
  const out = {
    action: "recommend",
    gender: currentContext.gender || null,
    occasion: currentContext.occasion || null,
    style: currentContext.style || null,
    budget: currentContext.budget || null,
    category: null,
    modifyCategory: null,
    explicitGender: false,
    keywords: []
  };

  if (/change|switch|replace|update|modify/i.test(text)) {
    out.action = "modify";

    for (const [cat, aliases] of Object.entries({
      tops: ["shirt", "top", "blouse", "tee", "t-shirt", "polo"],
      bottoms: ["pant", "jean", "short", "skirt", "trouser"],
      dresses: ["dress", "gown", "jumpsuit"],
      outerwear: ["jacket", "coat", "blazer", "hoodie", "sweater"],
      shoes: ["shoe", "sneaker", "heel", "boot", "sandal"],
      accessories: ["belt", "watch", "jewelry", "scarf", "hat", "sunglasses", "tie"]
    })) {
      for (const alias of aliases) {
        if (text.includes(alias)) {
          out.modifyCategory = cat;
          break;
        }
      }
      if (out.modifyCategory) break;
    }
  }

  if (/lock|keep|keep this|don't change|stay/i.test(text)) {
    out.action = "lock";
  }

  if (/unlock|release|allow change|can change/i.test(text)) {
    out.action = "unlock";
  }

  if (/women|woman|female|girl|lady/.test(text)) {
    out.gender = "women";
    out.explicitGender = true;
  } else if (/men|man|male|guy|boy/.test(text)) {
    out.gender = "men";
    out.explicitGender = true;
  }

  const occasionPatterns = {
    casual: ["casual", "college", "weekend", "everyday", "daily", "hangout", "brunch", "relaxed"],
    formal: ["formal", "office", "business", "interview", "meeting", "work", "professional"],
    party: ["party", "night out", "club", "date", "evening", "dinner", "celebration", "glam"],
    sport: ["sport", "gym", "workout", "running", "athletic", "active", "fitness"],
    wedding: ["wedding", "ceremony", "festive", "guest"],
    beach: ["beach", "vacation", "resort", "summer", "holiday"],
    streetwear: ["streetwear", "street", "urban", "hip", "trendy", "cool"],
    minimal: ["minimal", "minimalist", "simple", "clean", "basic", "essential"],
    vintage: ["vintage", "retro", "classic", "old school", "90s", "80s"],
    elegant: ["elegant", "sophisticated", "luxury", "chic"]
  };

  for (const [occasion, keywords] of Object.entries(occasionPatterns)) {
    if (keywords.some(k => text.includes(k))) {
      out.style = occasion;
      if (/casual|college|weekend|hangout/.test(text)) out.occasion = "casual";
      else if (/formal|office|business|meeting|interview/.test(text)) out.occasion = "formal";
      else if (/party|night|club|date|evening/.test(text)) out.occasion = "party";
      else if (/sport|gym|workout|athletic/.test(text)) out.occasion = "sport";
      else if (/wedding|ceremony|festive/.test(text)) out.occasion = "wedding";
      else if (/beach|vacation|resort|summer/.test(text)) out.occasion = "beach";
      break;
    }
  }

  const budgetMatch = text.match(/(?:under|below|less than|budget|budget of)\s*\$?\s*(\d+)/i);
  if (budgetMatch) {
    out.budget = parseInt(budgetMatch[1], 10);
  }

  return out;
}

function buildContextAwareSystemPrompt(context, outfitState, lockedItems, sessionData) {
  const existingItems = outfitState?.items || [];
  const locked = lockedItems || [];

  const lockedText = locked.length > 0
    ? `LOCKED ITEMS (DO NOT REPLACE OR REMOVE): ${locked.map(l => `${l.category} (${l.productId})`).join(", ")}`
    : "No locked items.";

  const currentOutfit = existingItems.length > 0
    ? existingItems.map(i => `${i.category}: ${i.name} (${i.productId})${i.isLocked ? " [LOCKED]" : ""}`).join("\n")
    : "No items in outfit yet.";

  return `You are ZARA, an expert AI fashion stylist for the ZYRA e-commerce store.

PERSONALITY: Friendly, knowledgeable, and helpful. You give practical fashion advice while respecting the user's preferences and locked items.

CURRENT CONVERSATION CONTEXT:
- Gender: ${context?.gender || "not specified"}
- Occasion/Style: ${context?.style || context?.occasion || "not specified"}
- Budget: ${context?.budget ? `$${context.budget}` : "any"}

CURRENT OUTFIT STATE:
${currentOutfit}

${lockedText}

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. NEVER replace, remove, or modify LOCKED items - they must stay in the outfit
2. When user asks to "change the [category]", ONLY change items in that category
3. Keep the gender context unless user explicitly asks for different gender
4. ALWAYS select products from the provided catalog ONLY - DO NOT invent products
5. NEVER say "no products available" - use products from the catalog
6. NEVER invent product IDs - ONLY use IDs from the catalog below
7. Product IDs are 24-character hex strings like "6789abcdef0123456789abcd" - copy them EXACTLY
8. Select 3-8 products that form a cohesive outfit
9. Respect budget constraints when specified

RESPONSE FORMAT (JSON only):
{
  "message": "Your response to the user",
  "action": "recommend|modify|lock|unlock|explain",
  "outfitName": "Name for the outfit",
  "productIds": ["EXACT_ID_FROM_CATALOG_1", "EXACT_ID_FROM_CATALOG_2", ...],
  "modifications": {
    "added": ["EXACT_ID_1", ...],
    "removed": ["EXACT_ID_2", ...],
    "replaced": [{"from": "EXACT_ID_OLD", "to": "EXACT_ID_NEW"}, ...]
  },
  "locked": [{"productId": "EXACT_ID", "category": "tops"}, ...],
  "unlocked": ["EXACT_ID", ...],
  "contextUpdate": {
    "gender": "men|women|null",
    "occasion": "string|null",
    "style": "string|null",
    "budget": number|null
  }
}`;
}

function parseJsonResponse(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch { }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch { }
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function callAIChat(systemPrompt, userPrompt, config) {
  if (config.provider === "gemini") {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        responseMimeType: "application/json"
      }
    });

    return result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (config.provider === "openrouter" || config.provider === "openai") {
    const client = getOpenAIClient(
      config.apiKey,
      config.provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
    );

    const model = config.provider === "openrouter"
      ? (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini")
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    return completion.choices?.[0]?.message?.content || "";
  }

  throw new Error("No AI provider configured");
}

export async function processStylistMessage({ prompt, sessionId }) {
  const config = getProviderConfig();

  await smartUpdateContext(sessionId, prompt);

  let sessionData = await getFullSessionData(sessionId);
  if (!sessionData) {
    await createSession(sessionId);
    sessionData = await getFullSessionData(sessionId);
  }

  const context = sessionData?.context || {};
  const outfitState = sessionData?.outfitState || { items: [] };
  const lockedItems = sessionData?.lockedItems || [];

  const intent = detectIntent(prompt, context);

  if (intent.action === "lock") {
    const productId = extractProductIdFromPrompt(prompt, outfitState.items);
    if (productId) {
      await lockItem(sessionId, productId);
    }
    return {
      message: "Item locked. It won't be changed unless you unlock it.",
      action: "lock",
      lockedItems: await getLockedItems(sessionId),
      outfitState: await getOutfitState(sessionId)
    };
  }

  if (intent.action === "unlock") {
    const productId = extractProductIdFromPrompt(prompt, outfitState.items);
    if (productId) {
      await unlockItem(sessionId, productId);
    }
    return {
      message: "Item unlocked. You can now change it.",
      action: "unlock",
      lockedItems: await getLockedItems(sessionId),
      outfitState: await getOutfitState(sessionId)
    };
  }

  let products = [];
  const lockedIds = lockedItems.map(l => l.productId);

  if (intent.action === "modify" && intent.modifyCategory) {
    const currentCategoryItems = outfitState.items.filter(i => i.category === intent.modifyCategory);
    const lockedCategoryItems = lockedItems.filter(l => l.category === intent.modifyCategory);

    const excludeIds = [
      ...outfitState.items.filter(i => !lockedItems.some(l => l.productId === i.productId)).map(i => i.productId),
      ...lockedIds
    ];

    const categoryProducts = await fetchProductsByCategory(
      intent.modifyCategory,
      intent.gender || context.gender,
      excludeIds,
      15
    );

    products = categoryProducts;
  } else {
    const excludeIds = lockedIds;
    products = await fetchAllProducts();

    if (intent.gender || context.gender) {
      const gender = intent.gender || context.gender;
      products = products.filter(p =>
        !p.gender || p.gender.toLowerCase() === gender.toLowerCase() || p.gender.toLowerCase() === "unisex"
      );
    }

    if (intent.style || context.style) {
      const style = (intent.style || context.style).toLowerCase();
      products = products.filter(p =>
        (p.tags && p.tags.some(t => t.toLowerCase().includes(style))) ||
        (p.collections && p.collections.toLowerCase().includes(style)) ||
        (p.category && p.category.toLowerCase().includes(style))
      );
    }

    if (products.length < 5) {
      products = await fetchAllProducts();
    }

    products = products.slice(0, 25);
  }

  if (products.length === 0) {
    products = await fetchAllProducts();
    products = products.slice(0, 25);
  }

  const catalogText = products.map(p =>
    `[${p._id}] ${p.name} - $${(p.discountPrice || p.price).toFixed(2)} | ${p.category} | ${p.gender || "unisex"} | ${(p.colors || []).join(", ")}`
  ).join("\n");

  const systemPrompt = buildContextAwareSystemPrompt(context, outfitState, lockedItems, sessionData);

  const userPrompt = `
USER REQUEST: "${prompt}"

INTENT DETECTED:
- Action: ${intent.action}
- Gender: ${intent.gender || context.gender || "any"}
- Style/Occasion: ${intent.style || intent.occasion || context.style || context.occasion || "any"}
- Budget: ${intent.budget || context.budget || "any"}
- Modify Category: ${intent.modifyCategory || "none"}

CATALOG - COPY IDS EXACTLY:
${catalogText}

CRITICAL: Copy the product IDs from the catalog EXACTLY as shown in brackets [ID]. Do NOT modify or shorten them. Invalid IDs will be rejected.

Respond with JSON only.`.trim();

  try {
    const raw = await callAIChat(systemPrompt, userPrompt, config);
    const parsed = parseJsonResponse(raw);

    if (!parsed) {
      return await buildCatalogOutfit(sessionId, products, lockedItems, context, config);
    }

    if (parsed.contextUpdate) {
      await updateContext(sessionId, parsed.contextUpdate);
    }

    if (parsed.locked && Array.isArray(parsed.locked)) {
      for (const lock of parsed.locked) {
        if (/^[a-fA-F0-9]{24}$/.test(lock.productId)) {
          await lockItem(sessionId, lock.productId, lock.category);
        }
      }
    }

    if (parsed.unlocked && Array.isArray(parsed.unlocked)) {
      for (const id of parsed.unlocked) {
        if (/^[a-fA-F0-9]{24}$/.test(id)) {
          await unlockItem(sessionId, id);
        }
      }
    }

    const hasValidProductIds = Array.isArray(parsed.productIds) &&
                               parsed.productIds.length > 0 &&
                               parsed.productIds.every(id => /^[a-fA-F0-9]{24}$/.test(id));

    let outfitProducts = [];

    if (hasValidProductIds) {
      outfitProducts = await fetchProductByIds(parsed.productIds);
    }

    if (outfitProducts.length === 0 && products.length > 0) {
      outfitProducts = await buildCatalogProducts(products, lockedItems);
    }

    const lockedIds = lockedItems.map(l => l.productId);

    if (parsed.modifications && Array.isArray(parsed.modifications.removed)) {
      for (const id of parsed.modifications.removed) {
        if (!lockedIds.includes(id)) {
          await removeItemFromOutfit(sessionId, id);
        }
      }
    }

    if (parsed.modifications && Array.isArray(parsed.modifications.replaced)) {
      for (const swap of parsed.modifications.replaced) {
        if (!lockedIds.includes(swap.from)) {
          const newProduct = outfitProducts.find(p => String(p._id) === swap.to);
          if (newProduct) {
            await replaceItemInOutfit(sessionId, swap.from, {
              productId: String(newProduct._id),
              name: newProduct.name,
              category: getCanonicalCategory(newProduct.category) || newProduct.category,
              price: newProduct.discountPrice || newProduct.price,
              imageUrl: newProduct.images?.[0]?.url || ""
            });
          }
        }
      }
    }

    if (intent.action === "modify" && intent.modifyCategory) {
      const currentOutfit = await getOutfitState(sessionId);
      for (const item of currentOutfit.items) {
        if (item.category !== intent.modifyCategory && !lockedIds.includes(item.productId)) {
          await removeItemFromOutfit(sessionId, item.productId);
        }
      }
    }

    const existingIds = (await getOutfitState(sessionId)).items.map(i => i.productId);

    for (const product of outfitProducts) {
      const productIdStr = String(product._id);
      if (!existingIds.includes(productIdStr) && !lockedIds.includes(productIdStr)) {
        await addItemToOutfit(sessionId, {
          productId: productIdStr,
          name: product.name,
          category: getCanonicalCategory(product.category) || product.category,
          price: product.discountPrice || product.price,
          imageUrl: product.images?.[0]?.url || ""
        });
      }
    }

    await setOutfitSummary(sessionId, parsed.outfitName || "Your Outfit", parsed.message || "Here's your outfit!");

    const finalOutfit = await getOutfitState(sessionId);
    const finalProducts = await fetchProductByIds(finalOutfit.items.map(i => i.productId));
    const finalLocked = await getLockedItems(sessionId);
    const finalContext = await getContext(sessionId);

    await addConversationMessage(sessionId, "user", prompt);
    await addConversationMessage(sessionId, "assistant", parsed.message || "Here's my recommendation!");

    return {
      message: parsed.message || "I've put together an outfit for you!",
      outfitName: parsed.outfitName || "Your Outfit",
      products: finalProducts,
      productIds: finalProducts.map(p => String(p._id)),
      action: parsed.action || "recommend",
      outfitState: finalOutfit,
      lockedItems: finalLocked,
      context: finalContext,
      source: finalProducts.length > 0 ? "ai" : "fallback",
      provider: config.provider
    };
  } catch (error) {
    console.error("AI stylist error:", error?.message || error);
    return await getFallbackResponse(sessionId, outfitState, lockedItems, context, config, products);
  }
}

async function buildCatalogProducts(catalogProducts, lockedItems) {
  const lockedIds = lockedItems.map(l => l.productId);
  const categoryMap = {};
  const selected = [];

  for (const product of catalogProducts) {
    const productIdStr = String(product._id);
    const canonical = getCanonicalCategory(product.category) || product.category;

    if (categoryMap[canonical]) continue;
    if (lockedIds.includes(productIdStr)) continue;

    categoryMap[canonical] = true;
    selected.push(product);

    if (selected.length >= 6) break;
  }

  return selected;
}

async function buildCatalogOutfit(sessionId, catalogProducts, lockedItems, context, config) {
  const outfitProducts = await buildCatalogProducts(catalogProducts, lockedItems);

  for (const product of outfitProducts) {
    await addItemToOutfit(sessionId, {
      productId: String(product._id),
      name: product.name,
      category: getCanonicalCategory(product.category) || product.category,
      price: product.discountPrice || product.price,
      imageUrl: product.images?.[0]?.url || ""
    });
  }

  await setOutfitSummary(sessionId, "Your Outfit", "Here's an outfit from our catalog!");

  const finalOutfit = await getOutfitState(sessionId);
  const finalProducts = await fetchProductByIds(finalOutfit.items.map(i => i.productId));

  return {
    message: "Here's an outfit from our catalog!",
    outfitName: "Your Outfit",
    products: finalProducts,
    productIds: finalProducts.map(p => String(p._id)),
    action: "recommend",
    outfitState: finalOutfit,
    lockedItems,
    context,
    source: "fallback",
    provider: config.provider
  };
}

async function generateFallbackOutfit(sessionId, context, lockedItems) {
  const lockedIds = lockedItems.map(l => l.productId);

  const query = { isPublished: true, countInStock: { $gt: 0 } };

  if (context?.gender) {
    query.gender = { $in: [context.gender.toLowerCase(), "unisex"] };
  }

  if (context?.budget) {
    query.discountPrice = { $lte: context.budget };
  }

  const { default: Product } = await import("../models/Product.js");

  const styleMatch = context?.style || context?.occasion;
  if (styleMatch) {
    query.$or = [
      { collections: new RegExp(styleMatch, "i") },
      { tags: new RegExp(styleMatch, "i") },
      { category: new RegExp(styleMatch, "i") }
    ];
  }

  let products = await Product.find(query).limit(30).lean();

  if (products.length < 5) {
    products = await Product.find({ isPublished: true, countInStock: { $gt: 0 } }).limit(30).lean();
  }

  const selectedProducts = [];
  const categoryMap = {};
  const categories = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  for (const cat of categories) {
    if (selectedProducts.length >= 6) break;

    const catProducts = products.filter(p => {
      const prodCat = getCanonicalCategory(p.category) || p.category;
      if (prodCat !== cat && !p.category.toLowerCase().includes(cat.replace(/s$/, ""))) return false;
      if (categoryMap[cat]) return false;
      if (lockedIds.includes(String(p._id))) return false;
      return true;
    });

    if (catProducts.length > 0) {
      const product = catProducts[Math.floor(Math.random() * Math.min(catProducts.length, 3))];
      selectedProducts.push(product);
      categoryMap[cat] = true;
    }
  }

  for (const product of selectedProducts) {
    if (lockedIds.includes(String(product._id))) continue;
    const canonical = getCanonicalCategory(product.category) || product.category;

    await addItemToOutfit(sessionId, {
      productId: String(product._id),
      name: product.name,
      category: canonical,
      price: product.discountPrice || product.price,
      imageUrl: product.images?.[0]?.url || ""
    });
  }

  return selectedProducts;
}

async function buildOutfitFromProducts(sessionId, products, context, lockedItems) {
  const lockedIds = lockedItems.map(l => l.productId);
  const currentOutfitItems = [];
  const categoryMap = {};

  for (const product of products) {
    const canonical = getCanonicalCategory(product.category) || product.category;
    if (lockedIds.includes(String(product._id))) continue;
    if (categoryMap[canonical]) continue;

    categoryMap[canonical] = true;
    await addItemToOutfit(sessionId, {
      productId: String(product._id),
      name: product.name,
      category: canonical,
      price: product.discountPrice || product.price,
      imageUrl: product.images?.[0]?.url || ""
    });
    currentOutfitItems.push(product);
  }

  return currentOutfitItems;
}

async function getFallbackResponse(sessionId, outfitState, lockedItems, context, config, products = []) {
  const fallbackProducts = Array.isArray(products) && products.length > 0 ? products.slice(0, 8) : [];

  if (fallbackProducts.length > 0) {
    await buildOutfitFromProducts(sessionId, fallbackProducts, context, lockedItems);
  }

  const finalOutfit = await getOutfitState(sessionId);
  const finalProducts = await fetchProductByIds(finalOutfit.items.map(i => i.productId));
  const friendlyMessage = finalProducts.length > 0
    ? "Here are some product suggestions from our catalog!"
    : "I had trouble connecting to the AI service. Our team has been notified.";

  return {
    message: friendlyMessage,
    products: finalProducts,
    productIds: finalProducts.map(p => String(p._id)),
    action: "recommend",
    outfitState: finalOutfit,
    lockedItems,
    context,
    source: finalProducts.length > 0 ? "fallback" : "error-fallback",
    provider: config.provider
  };
}

function extractProductIdFromPrompt(prompt, outfitItems) {
  const idMatch = prompt.match(/([a-f0-9]{24})/i);
  if (idMatch) return idMatch[1];

  for (const item of outfitItems) {
    if (prompt.toLowerCase().includes(item.name.toLowerCase())) {
      return item.productId;
    }
  }

  return null;
}

export async function getCurrentOutfit(sessionId) {
  const sessionData = await getFullSessionData(sessionId);
  if (!sessionData) {
    return {
      context: { gender: null, occasion: null, style: null, budget: null },
      outfitState: { name: "", items: [], totalPrice: 0, summary: "" },
      lockedItems: [],
      products: []
    };
  }

  const products = await fetchProductByIds(sessionData.outfitState.items.map(i => i.productId));

  return {
    context: sessionData.context,
    outfitState: sessionData.outfitState,
    lockedItems: sessionData.lockedItems,
    products
  };
}

export async function clearOutfit(sessionId) {
  await clearSession(sessionId);
  return { success: true };
}

export async function getStylistChat({ prompt, sessionId }) {
  const config = getProviderConfig();
  const sessionData = await getFullSessionData(sessionId);
  const context = sessionData?.context || {};
  const outfitState = sessionData?.outfitState || { items: [] };
  const lockedItems = sessionData?.lockedItems || [];

  const systemPrompt = `You are ZARA, a friendly AI fashion stylist for ZYRA.

Current outfit: ${outfitState.items.length} items (${outfitState.items.map(i => `${i.category}: ${i.name}${i.isLocked ? " [LOCKED]" : ""}`).join(", ") || "empty"})
Locked items: ${lockedItems.length > 0 ? lockedItems.map(l => l.category).join(", ") : "none"}
Total price: $${outfitState.items.reduce((sum, i) => sum + (i.price || 0), 0).toFixed(2)}

Be concise, helpful, and stylish in your responses. Focus on fashion advice and outfit coordination.`;

  const messages = (sessionData?.conversationHistory || []).map(h => ({
    role: h.role === "assistant" ? "assistant" : "user",
    content: h.message
  }));

  messages.push({ role: "user", content: prompt });

  try {
    let response;

    if (config.provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
      });

      const fullPrompt = `${systemPrompt}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.content}`).join("\n")}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
      });

      response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help with your fashion needs!";
    } else {
      const client = getOpenAIClient(
        config.apiKey,
        config.provider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined
      );

      const model = config.provider === "openrouter"
        ? (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini")
        : (process.env.OPENAI_MODEL || "gpt-4o-mini");

      const allMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const completion = await client.chat.completions.create({
        model,
        temperature: 0.8,
        max_tokens: 500,
        messages: allMessages
      });

      response = completion.choices?.[0]?.message?.content || "I'm here to help!";
    }

    await addConversationMessage(sessionId, "user", prompt);
    await addConversationMessage(sessionId, "assistant", response);

    return {
      message: response,
      outfitState: await getOutfitState(sessionId),
      lockedItems: await getLockedItems(sessionId),
      context: await getContext(sessionId),
      provider: config.provider
    };
  } catch (error) {
    console.error("Chat error:", error?.message || error);

    const friendlyMessage = "I'm having a little trouble connecting right now. Please try asking for outfit recommendations instead!";

    return {
      message: friendlyMessage,
      outfitState,
      lockedItems,
      context,
      provider: config.provider,
      error: friendlyMessage
    };
  }
}

export function isRAGConfigured() {
  const config = getProviderConfig();
  return config.provider !== "fallback";
}

export function getAIProvider() {
  return getProviderConfig().provider;
}

export default {
  processStylistMessage,
  getCurrentOutfit,
  clearOutfit,
  getStylistChat,
  isRAGConfigured,
  getAIProvider
};
