import OpenAI from "openai";
import { isLocalMode, getLocalStore } from "./localStore.js";
import { responseProduct } from "./stylistResponse.js";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-oss-20b:free";
const TIMEOUT_MS = 25000;

let cachedClient = null;
let cachedKey = null;
let cachedBaseUrl = null;

const isProviderConfigured = () =>
  Boolean(process.env.STYLIST_API_KEY && process.env.STYLIST_API_KEY.trim());

const getClient = () => {
  if (!isProviderConfigured()) return null;
  const apiKey = process.env.STYLIST_API_KEY.trim();
  const baseURL = (process.env.STYLIST_BASE_URL || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  if (cachedClient && cachedKey === apiKey && cachedBaseUrl === baseURL) {
    return cachedClient;
  }
  cachedClient = new OpenAI({ apiKey, baseURL, timeout: TIMEOUT_MS });
  cachedKey = apiKey;
  cachedBaseUrl = baseURL;
  return cachedClient;
};

const getModel = () => (process.env.STYLIST_MODEL || DEFAULT_MODEL).trim();

const GENDER_ALIASES = {
  men: ["men", "male"],
  male: ["men", "male"],
  women: ["women", "female"],
  female: ["women", "female"],
  unisex: ["unisex"],
};

const normalizeGender = (g) => {
  if (!g) return null;
  const key = String(g).trim().toLowerCase();
  return GENDER_ALIASES[key] ? key : key;
};

const matchesGender = (productGender, requested) => {
  if (!requested) return true;
  const accepted = GENDER_ALIASES[normalizeGender(requested)] || [normalizeGender(requested)];
  const pg = String(productGender || "").trim().toLowerCase();
  return accepted.includes(pg);
};

const PROMPT_KEYWORDS = {
  gender: {
    men: ["men", "man", "male", "guy", "gentleman", "boyfriend", "masculine"],
    women: ["women", "woman", "female", "girl", "lady", "feminine", "girlfriend"],
  },
  occasion: {
    casual: ["casual", "college", "weekend", "everyday", "daily", "hangout", "brunch"],
    formal: ["formal", "office", "business", "interview", "meeting", "work"],
    party: ["party", "night out", "club", "date", "evening"],
    sport: ["sport", "gym", "workout", "running", "athletic", "active"],
    wedding: ["wedding", "ceremony", "festive"],
    beach: ["beach", "vacation", "resort", "summer"],
  },
  style: {
    minimal: ["minimal", "simple", "basic", "essentials", "clean"],
    streetwear: ["street", "streetwear", "urban", "hip"],
    vintage: ["vintage", "retro", "classic"],
    elegant: ["elegant", "sophisticated", "polished"],
  },
};

const detectIntent = (prompt) => {
  const text = String(prompt || "").toLowerCase();
  const out = { gender: null, occasion: null, style: null, budget: null, keywords: [] };

  for (const [g, words] of Object.entries(PROMPT_KEYWORDS.gender)) {
    if (words.some((w) => text.includes(w))) out.gender = g;
  }
  for (const [o, words] of Object.entries(PROMPT_KEYWORDS.occasion)) {
    if (words.some((w) => text.includes(w))) out.occasion = o;
  }
  for (const [s, words] of Object.entries(PROMPT_KEYWORDS.style)) {
    if (words.some((w) => text.includes(w))) out.style = s;
  }

  const budgetMatch = text.match(/(?:under|below|less than|<\s*)\s*\$?\s*(\d{2,4})/);
  if (budgetMatch) out.budget = Number(budgetMatch[1]);
  const exactMatch = text.match(/\$\s*(\d{2,4})/);
  if (exactMatch && !out.budget) out.budget = Number(exactMatch[1]);

  const stop = new Set(["create", "make", "me", "a", "an", "the", "for", "with", "in", "on", "of", "to", "and", "or", "outfit", "look", "style", "recommend", "suggest", "please", "need", "want", "looking", "something"]);
  out.keywords = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));

  return out;
};

const fetchCatalog = async () => {
  if (isLocalMode()) {
    const store = getLocalStore();
    return (store.products || []).filter((p) => p.isPublished !== false);
  }
  const { default: Product } = await import("../models/Product.js");
  return Product.find({ isPublished: { $ne: false } }).lean();
};

const compactCatalog = (products) =>
  products.map((p) => ({
    id: String(p._id),
    name: p.name,
    price: Number(p.price) || 0,
    discountPrice: Number(p.discountPrice) || 0,
    gender: p.gender,
    category: p.category,
    collections: p.collections,
    brand: p.brand,
    material: p.material,
    colors: Array.isArray(p.colors) ? p.colors.slice(0, 6) : [],
    sizes: Array.isArray(p.sizes) ? p.sizes.slice(0, 6) : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
  }));

const buildSystemPrompt = (intent) => `You are a fashion stylist for the ZYRA e-commerce store.
Your job is to recommend 3-6 products that form a complete, wearable outfit based on the user's request.

Rules (STRICT):
- Recommend ONLY products whose "id" appears in the provided catalog.
- Return valid JSON, no commentary, no markdown.
- Respect the user's gender (${intent.gender || "any"}), occasion (${intent.occasion || "any"}), style (${intent.style || "any"}), and budget (${intent.budget ? `under $${intent.budget}` : "any"}).
- If a product is a Top Wear item, do not also recommend a second Top Wear unless the user asked for layers.
- Aim for a complete outfit: 1 top + 1 bottom minimum. Add extras only if they fit the request.
- Prefer lower-priced or discounted products when the user mentions a budget.
- Never invent product names, prices, brands, or ids. The catalog is the source of truth.

Response shape (JSON only):
{
  "outfitName": "short catchy name",
  "summary": "1-2 sentence explanation of the look",
  "productIds": ["id1","id2","id3", ...]
}`;

const parseAiJson = (raw) => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      /* try next */
    }
  }
  return null;
};

const findProduct = (catalog, id) => catalog.find((p) => String(p.id) === String(id) || String(p._id) === String(id));

const callAiStylist = async ({ prompt, intent, catalog }) => {
  const client = getClient();
  if (!client) throw new Error("AI provider not configured");
  const model = getModel();

  const userPayload = {
    request: prompt,
    gender: intent.gender,
    occasion: intent.occasion,
    style: intent.style,
    budget: intent.budget,
    catalog: compactCatalog(catalog),
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 1200,
    messages: [
      { role: "system", content: buildSystemPrompt(intent) },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  return parseAiJson(raw);
};

const rankByIntent = (catalog, intent) => {
  const tokens = new Set(intent.keywords || []);
  return catalog
    .filter((p) => matchesGender(p.gender, intent.gender))
    .map((p) => {
      let score = 0;
      const haystack = [p.name, p.brand, p.collections, p.material, ...(p.colors || []), ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      for (const t of tokens) if (haystack.includes(t)) score += 3;
      if (intent.occasion && p.collections && String(p.collections).toLowerCase().includes(intent.occasion)) score += 4;
      if (intent.style && p.collections && String(p.collections).toLowerCase().includes(intent.style)) score += 4;
      if (intent.budget) {
        const price = Number(p.discountPrice || p.price) || 0;
        if (price <= intent.budget) score += 2;
        else score -= 5;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
};

const buildFallbackOutfit = (catalog, intent, prompt) => {
  const tops = catalog.filter((p) => /top/i.test(p.category || ""));
  const bottoms = catalog.filter((p) => /bottom/i.test(p.category || ""));
  const ranked = rankByIntent(catalog, intent);
  const rankedTops = ranked.filter((p) => /top/i.test(p.category || ""));
  const rankedBottoms = ranked.filter((p) => /bottom/i.test(p.category || ""));

  const picks = [];
  const top = rankedTops[0] || tops[0];
  if (top) picks.push(top);
  const bottom = rankedBottoms[0] || bottoms[0];
  if (bottom && bottom._id !== top?._id) picks.push(bottom);
  if (picks.length === 0 && ranked[0]) picks.push(ranked[0]);

  const summary = intent.gender || intent.occasion || intent.style
    ? `Curated ${intent.gender || ""} ${intent.occasion || ""} ${intent.style || ""} look from your ZYRA catalog.`
    : `Curated look based on: "${prompt.slice(0, 80)}".`;

  return {
    outfitName: "ZYRA Pick",
    summary,
    productIds: picks.map((p) => String(p._id)),
    source: "fallback",
  };
};

const verifyAndShape = (raw, catalog, intent, prompt) => {
  if (!raw || !Array.isArray(raw.productIds)) {
    return buildFallbackOutfit(catalog, intent, prompt);
  }
  const verified = [];
  for (const id of raw.productIds) {
    if (verified.length >= 8) break;
    const product = findProduct(catalog, id);
    if (product) verified.push(product);
  }
  if (verified.length === 0) {
    const fallback = buildFallbackOutfit(catalog, intent, prompt);
    return { ...fallback, rawText: raw };
  }
  return {
    outfitName: String(raw.outfitName || "AI Stylist Pick").slice(0, 80),
    summary: String(raw.summary || "A complete outfit curated from the ZYRA catalog.").slice(0, 400),
    productIds: verified.map((p) => String(p._id)),
    source: "ai",
  };
};

export const recommendOutfit = async ({ prompt }) => {
  const intent = detectIntent(prompt);
  const catalog = await fetchCatalog();
  if (catalog.length === 0) {
    return {
      outfitName: "Empty Catalog",
      summary: "No products are available right now. Please check back later.",
      productIds: [],
      source: "empty",
      aiConfigured: isProviderConfigured(),
    };
  }

  if (!isProviderConfigured()) {
    const fallback = buildFallbackOutfit(catalog, intent, prompt);
    return { ...fallback, aiConfigured: false };
  }

  try {
    const raw = await callAiStylist({ prompt, intent, catalog });
    const shaped = verifyAndShape(raw, catalog, intent, prompt);
    return { ...shaped, aiConfigured: true };
  } catch (err) {
    const fallback = buildFallbackOutfit(catalog, intent, prompt);
    return {
      ...fallback,
      aiConfigured: true,
      aiError: err?.message || "AI call failed",
    };
  }
};

export const isAiConfigured = isProviderConfigured;
