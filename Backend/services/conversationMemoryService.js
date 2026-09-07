/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Conversation Memory Service
 * Manages outfit state, context, and locked items for AI styling sessions
 */

import ConversationMemory from "../models/ConversationMemory.js";

const CATEGORY_MAP = {
  tops: ["top", "tops", "shirt", "shirts", "blouse", "t-shirt", "tee", "polo", "tank", "crop top", "top wear", "upper wear"],
  bottoms: ["bottom", "bottoms", "pants", "jeans", "trousers", "shorts", "skirt", "leggings", "palazzo", "bottom wear", "lower wear"],
  dresses: ["dress", "dresses", "gown", "jumpsuit", "romper"],
  outerwear: ["jacket", "coat", "blazer", "cardigan", "hoodie", "sweater", "outerwear"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "heel", "heels", "flat", "loafer", "boot", "sandals", "slippers", "footwear"],
  accessories: ["accessory", "accessories", "belt", "watch", "jewelry", "scarf", "hat", "bag", "purse", "wallet", "sunglasses", "tie"],
  bags: ["bag", "bags", "handbag", "backpack", "clutch", "tote"]
};

const CATEGORY_REVERSE_MAP = {};
for (const [canonical, aliases] of Object.entries(CATEGORY_MAP)) {
  for (const alias of aliases) {
    CATEGORY_REVERSE_MAP[alias.toLowerCase()] = canonical;
  }
}

export function normalizeCategory(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  return CATEGORY_REVERSE_MAP[lower] || lower;
}

export function getCanonicalCategory(category) {
  return normalizeCategory(category);
}

export function getAllCategoryAliases() {
  return CATEGORY_MAP;
}

export async function createSession(sessionId, userId = null) {
  const session = new ConversationMemory({
    sessionId,
    userId,
    context: {
      gender: null,
      occasion: null,
      style: null,
      budget: null,
      lastUpdated: new Date()
    },
    outfitState: {
      name: "",
      items: [],
      totalPrice: 0,
      summary: ""
    },
    conversationHistory: [],
    lockedItems: []
  });
  await session.save();
  return session;
}

export async function getSession(sessionId) {
  return ConversationMemory.findOne({ sessionId }).lean();
}

export async function getContext(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    return {
      gender: null,
      occasion: null,
      style: null,
      budget: null
    };
  }
  return session.context;
}

export async function updateContext(sessionId, updates) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const allowedFields = ["gender", "occasion", "style", "budget"];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      session.context[field] = updates[field];
    }
  }
  session.context.lastUpdated = new Date();
  session.lastUpdated = new Date();
  await session.save();

  return session.context;
}

export async function smartUpdateContext(sessionId, prompt) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const text = prompt.toLowerCase();

  const explicitWomen = /women|woman|female|girl|lady|for women|women's/.test(text);
  const explicitMen = /men|man|male|guy|boy|for men|men's/.test(text);

  if (explicitWomen && !explicitMen) {
    session.context.gender = "women";
    session.outfitState.items = [];
    session.lockedItems = [];
  } else if (explicitMen) {
    session.context.gender = "men";
    session.outfitState.items = [];
    session.lockedItems = [];
  } else if (!session.context.gender) {
    if (/women|woman|female|girl|lady/.test(text)) {
      session.context.gender = "women";
    } else if (/men|man|male|guy|boy/.test(text)) {
      session.context.gender = "men";
    }
  }

  const occasionPatterns = {
    casual: ["casual", "college", "weekend", "everyday", "daily", "hangout", "brunch", "relaxed"],
    formal: ["formal", "office", "business", "interview", "meeting", "work", "professional"],
    party: ["party", "night out", "club", "date", "evening", "dinner", "celebration"],
    sport: ["sport", "gym", "workout", "running", "athletic", "active", "fitness"],
    wedding: ["wedding", "ceremony", "festive", "guest"],
    beach: ["beach", "vacation", "resort", "summer", "holiday"],
    streetwear: ["streetwear", "street", "urban", "hip", "trendy"],
    minimal: ["minimal", "minimalist", "simple", "clean", "basic", "essential"],
    vintage: ["vintage", "retro", "classic", "old school"],
    elegant: ["elegant", "sophisticated", "luxury", "chic", "glam"]
  };

  for (const [occasion, keywords] of Object.entries(occasionPatterns)) {
    if (keywords.some(k => text.includes(k))) {
      session.context.style = occasion;
      break;
    }
  }

  const budgetMatch = text.match(/(?:under|below|less than| budget |budget of)\s*\$?\s*(\d+)/i);
  if (budgetMatch) {
    session.context.budget = parseInt(budgetMatch[1], 10);
  }

  session.context.lastUpdated = new Date();
  session.lastUpdated = new Date();
  await session.save();

  return session.context;
}

export async function lockItem(sessionId, productId, category = null) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const existingLock = session.lockedItems.find(l => l.productId === productId);
  if (existingLock) {
    return { lockedItems: session.lockedItems, alreadyLocked: true };
  }

  const item = session.outfitState.items.find(i => i.productId === productId);
  const itemCategory = category || item?.category || "unknown";

  session.lockedItems.push({
    productId,
    category: getCanonicalCategory(itemCategory) || itemCategory,
    lockedAt: new Date()
  });

  if (item) {
    item.isLocked = true;
    item.lockedAt = new Date();
  }

  session.lastUpdated = new Date();
  await session.save();

  return { lockedItems: session.lockedItems, alreadyLocked: false };
}

export async function unlockItem(sessionId, productId) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  session.lockedItems = session.lockedItems.filter(l => l.productId !== productId);

  const item = session.outfitState.items.find(i => i.productId === productId);
  if (item) {
    item.isLocked = false;
    item.lockedAt = null;
  }

  session.lastUpdated = new Date();
  await session.save();

  return { lockedItems: session.lockedItems };
}

export async function getLockedItems(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return [];
  return session.lockedItems || [];
}

export async function isItemLocked(sessionId, productId) {
  const lockedItems = await getLockedItems(sessionId);
  return lockedItems.some(l => l.productId === productId);
}

export async function addItemToOutfit(sessionId, item) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const existingIndex = session.outfitState.items.findIndex(i => i.productId === item.productId);
  if (existingIndex !== -1) {
    return session.outfitState;
  }

  session.outfitState.items.push({
    productId: item.productId,
    name: item.name || "",
    category: getCanonicalCategory(item.category) || item.category || "",
    subcategory: item.subcategory || "",
    price: item.price || 0,
    imageUrl: item.imageUrl || "",
    isLocked: false,
    addedAt: new Date()
  });

  recalculateTotal(session);
  session.lastUpdated = new Date();
  await session.save();

  return session.outfitState;
}

export async function removeItemFromOutfit(sessionId, productId) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const isLocked = await isItemLocked(sessionId, productId);
  if (isLocked) {
    return { error: "Cannot remove locked item", locked: true };
  }

  session.outfitState.items = session.outfitState.items.filter(i => i.productId !== productId);
  session.lockedItems = session.lockedItems.filter(l => l.productId !== productId);

  recalculateTotal(session);
  session.lastUpdated = new Date();
  await session.save();

  return session.outfitState;
}

export async function replaceItemInOutfit(sessionId, oldProductId, newItem) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const isLocked = await isItemLocked(sessionId, oldProductId);
  if (isLocked) {
    return { error: "Cannot replace locked item", locked: true };
  }

  session.outfitState.items = session.outfitState.items.filter(i => i.productId !== oldProductId);
  session.lockedItems = session.lockedItems.filter(l => l.productId !== oldProductId);

  session.outfitState.items.push({
    productId: newItem.productId,
    name: newItem.name || "",
    category: getCanonicalCategory(newItem.category) || newItem.category || "",
    subcategory: newItem.subcategory || "",
    price: newItem.price || 0,
    imageUrl: newItem.imageUrl || "",
    isLocked: false,
    addedAt: new Date()
  });

  recalculateTotal(session);
  session.lastUpdated = new Date();
  await session.save();

  return session.outfitState;
}

export async function updateOutfitItem(sessionId, productId, updates) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  const item = session.outfitState.items.find(i => i.productId === productId);
  if (!item) return null;

  if (item.isLocked && updates.isLocked === false) {
    session.lockedItems = session.lockedItems.filter(l => l.productId !== productId);
    item.isLocked = false;
    item.lockedAt = null;
  }

  Object.assign(item, updates);
  recalculateTotal(session);
  session.lastUpdated = new Date();
  await session.save();

  return session.outfitState;
}

function recalculateTotal(session) {
  session.outfitState.totalPrice = session.outfitState.items.reduce(
    (sum, item) => sum + (item.price || 0), 0
  );
}

export async function setOutfitSummary(sessionId, name, summary) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  session.outfitState.name = name || session.outfitState.name;
  session.outfitState.summary = summary || session.outfitState.summary;
  session.lastUpdated = new Date();
  await session.save();

  return session.outfitState;
}

export async function getOutfitState(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    return {
      name: "",
      items: [],
      totalPrice: 0,
      summary: ""
    };
  }
  return session.outfitState;
}

export async function getFullSessionData(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return null;

  return {
    context: session.context,
    outfitState: session.outfitState,
    lockedItems: session.lockedItems || [],
    conversationHistory: session.conversationHistory || []
  };
}

export async function addConversationMessage(sessionId, role, message) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  session.conversationHistory.push({
    role,
    message,
    timestamp: new Date()
  });

  if (session.conversationHistory.length > 50) {
    session.conversationHistory = session.conversationHistory.slice(-50);
  }

  session.lastUpdated = new Date();
  await session.save();

  return session.conversationHistory;
}

export async function getConversationHistory(sessionId, limit = 20) {
  const session = await getSession(sessionId);
  if (!session) return [];
  return session.conversationHistory.slice(-limit);
}

export async function clearSession(sessionId) {
  await ConversationMemory.deleteOne({ sessionId });
  return { success: true };
}

export async function clearOutfitOnly(sessionId) {
  const session = await ConversationMemory.findOne({ sessionId });
  if (!session) return null;

  session.outfitState = {
    name: "",
    items: [],
    totalPrice: 0,
    summary: ""
  };
  session.lockedItems = [];
  session.lastUpdated = new Date();
  await session.save();

  return { success: true };
}

export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export default {
  normalizeCategory,
  getCanonicalCategory,
  getAllCategoryAliases,
  createSession,
  getSession,
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
  updateOutfitItem,
  getOutfitState,
  getFullSessionData,
  setOutfitSummary,
  addConversationMessage,
  getConversationHistory,
  clearSession,
  clearOutfitOnly,
  generateSessionId
};
