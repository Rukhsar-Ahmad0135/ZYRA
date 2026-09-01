import express from "express";
import { recommendOutfit, isAiConfigured } from "../services/stylistService.js";
import { responseProducts, fetchProductByIds } from "../services/stylistResponse.js";

const router = express.Router();

router.post("/recommend", express.json(), async (req, res, next) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }
    const result = await recommendOutfit({ prompt: prompt.trim() });
    const products = responseProducts(await fetchProductByIds(result.productIds));
    res.json({
      outfitName: result.outfitName,
      summary: result.summary,
      source: result.source,
      aiConfigured: isAiConfigured(),
      aiError: result.aiError,
      products,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
