/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist Routes
 * Context-aware outfit recommendations with locked items support
 */

import express from "express";
import {
  processStylistMessage,
  getCurrentOutfit,
  clearOutfit,
  getStylistChat,
  isRAGConfigured,
  getAIProvider
} from "../services/ragStylistService.js";
import {
  lockItem,
  unlockItem,
  getLockedItems,
  generateSessionId
} from "../services/conversationMemoryService.js";

const router = express.Router();

router.post("/rag/recommend", express.json(), async (req, res, next) => {
  try {
    const { prompt, sessionId: providedSessionId } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    const result = await processStylistMessage({
      prompt: prompt.trim(),
      sessionId
    });

    res.json({
      ...result,
      sessionId,
      ragConfigured: isRAGConfigured(),
      provider: getAIProvider()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/rag/lock/:productId", express.json(), async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format. Please generate a new outfit."
      });
    }

    const category = req.body.category || null;
    const result = await lockItem(sessionId, productId, category);

    if (!result) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      success: true,
      lockedItems: result.lockedItems,
      message: result.alreadyLocked ? "Item already locked" : "Item locked successfully"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/rag/unlock/:productId", express.json(), async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format. Please generate a new outfit."
      });
    }

    const result = await unlockItem(sessionId, productId);

    if (!result) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      success: true,
      lockedItems: result.lockedItems,
      message: "Item unlocked successfully"
    });
  } catch (error) {
    next(error);
  }
});

router.get("/rag/locked/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const lockedItems = await getLockedItems(sessionId);

    res.json({ lockedItems });
  } catch (error) {
    next(error);
  }
});

router.get("/rag/outfit/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const result = await getCurrentOutfit(sessionId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/rag/outfit/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const result = await clearOutfit(sessionId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/rag/chat", express.json(), async (req, res, next) => {
  try {
    const { prompt, sessionId: providedSessionId } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    const result = await getStylistChat({
      prompt: prompt.trim(),
      sessionId
    });

    res.json({
      ...result,
      sessionId,
      ragConfigured: isRAGConfigured(),
      provider: getAIProvider()
    });
  } catch (error) {
    next(error);
  }
});

router.get("/rag/status", (req, res) => {
  const config = getAIProvider();
  res.json({
    ragConfigured: isRAGConfigured(),
    provider: config,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.startsWith("AIza")),
    openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY || process.env.STYLIST_API_KEY),
    pineconeConfigured: Boolean(process.env.PINECONE_API_KEY)
  });
});

export default router;
