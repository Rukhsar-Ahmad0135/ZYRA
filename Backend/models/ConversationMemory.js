/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Conversation Memory Model
 * Stores outfit state, conversation history, and context for AI styling sessions
 */

import mongoose from "mongoose";

const outfitItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, default: "" },
  category: { type: String, default: "" },
  subcategory: { type: String, default: "" },
  price: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date, default: null },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationContextSchema = new mongoose.Schema({
  gender: { type: String, default: null },
  occasion: { type: String, default: null },
  style: { type: String, default: null },
  budget: { type: Number, default: null },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const conversationMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationMemorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: null },

  context: {
    gender: { type: String, default: null },
    occasion: { type: String, default: null },
    style: { type: String, default: null },
    budget: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now }
  },

  outfitState: {
    name: { type: String, default: "" },
    items: [outfitItemSchema],
    totalPrice: { type: Number, default: 0 },
    summary: { type: String, default: "" }
  },

  conversationHistory: [conversationMessageSchema],

  lockedItems: [{
    productId: { type: String, required: true },
    category: { type: String, required: true },
    lockedAt: { type: Date, default: Date.now }
  }],

  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

conversationMemorySchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 3600 });

const ConversationMemory = mongoose.models.ConversationMemory ||
  mongoose.model("ConversationMemory", conversationMemorySchema);

export default ConversationMemory;
