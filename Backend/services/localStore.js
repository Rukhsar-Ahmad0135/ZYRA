import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import products from "../data/products.js";

const storePath = path.resolve(process.cwd(), "data", "local-store.json");

const generateId = () => new mongoose.Types.ObjectId().toString();

const now = () => new Date().toISOString();

const clone = (value) => JSON.parse(JSON.stringify(value));

const toPlainUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const toPlainProduct = (product) => ({
  ...clone(product),
  _id: product._id,
  id: product._id,
});

const createInitialStore = () => {
  const adminId = generateId();
  const seededProducts = products.map((product) => ({
    ...clone(product),
    _id: generateId(),
    id: undefined,
    user: adminId,
    isPublished: true,
    isFeatured: Boolean(product.isFeatured),
    createdAt: now(),
    updatedAt: now(),
  }));

  const adminPassword = bcrypt.hashSync("Admin1234", 10);

  return {
    meta: {
      createdAt: now(),
      updatedAt: now(),
    },
    products: seededProducts,
    users: [
      {
        _id: adminId,
        name: "Admin User",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    carts: [],
    checkouts: [],
    orders: [],
    subscribers: [],
  };
};

const ensureStoreFile = () => {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify(createInitialStore(), null, 2), "utf8");
  }
};

const readStore = () => {
  ensureStoreFile();
  const raw = fs.readFileSync(storePath, "utf8");
  return JSON.parse(raw);
};

const writeStore = (store) => {
  ensureStoreFile();
  store.meta.updatedAt = now();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
  return store;
};

const withStore = (mutator) => {
  const store = readStore();
  const result = mutator(store);
  writeStore(store);
  return result;
};

const ensureSeeded = () => {
  ensureStoreFile();
  const store = readStore();
  if (!store.products || store.products.length === 0) {
    writeStore(createInitialStore());
  }
};

const getLocalStore = () => {
  ensureSeeded();
  return readStore();
};

const isLocalMode = () => process.env.USE_LOCAL_DATA === "true";

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

const getNameKeywords = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && !["shirt", "top", "wear", "men", "women", "man", "woman", "style", "classic"].includes(part));

const rankSimilarProductsByName = (productsList, baseProduct, limit = 4) => {
  if (!baseProduct) return [];

  const baseName = normalizeText(baseProduct.name);
  const baseTokens = getNameKeywords(baseProduct.name);

  return [...productsList]
    .filter((product) => product._id !== baseProduct._id)
    .map((product) => {
      const candidateName = normalizeText(product.name);
      const candidateTokens = getNameKeywords(product.name);

      let score = 0;
      if (candidateName.includes(baseName) || baseName.includes(candidateName)) score += 100;

      const sharedTokens = candidateTokens.filter((token) => baseTokens.includes(token));
      score += sharedTokens.length * 10;

      if (normalizeText(product.brand) && normalizeText(product.brand) === normalizeText(baseProduct.brand)) score += 4;
      if (normalizeText(product.category) === normalizeText(baseProduct.category)) score += 2;
      if (normalizeText(product.gender) === normalizeText(baseProduct.gender)) score += 1;

      return { product, score };
    })
    .sort((left, right) => right.score - left.score || new Date(right.product.createdAt) - new Date(left.product.createdAt))
    .slice(0, limit)
    .map(({ product }) => product);
};

const paginate = (items, page = 1, pageSize = 20) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const limit = Math.max(1, Number(pageSize) || 20);
  const total = items.length;
  return {
    items: items.slice((currentPage - 1) * limit, currentPage * limit),
    page: currentPage,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
};

const matchesGender = (productGender, requestedGender) => {
  if (!requestedGender) return true;
  const normalized = normalizeText(requestedGender);
  const aliases = {
    men: ["men", "male"],
    women: ["women", "female"],
    male: ["men", "male"],
    female: ["women", "female"],
    unisex: ["unisex"],
  };
  const accepted = aliases[normalized] || [normalized];
  return accepted.includes(normalizeText(productGender));
};

const getProductView = (product) => {
  if (!product) return null;
  return toPlainProduct(product);
};

const filterProducts = (productsList, query = {}) => {
  let result = [...productsList];

  if (query.collection && normalizeText(query.collection) !== "all") {
    result = result.filter((product) => normalizeText(product.collections) === normalizeText(query.collection));
  }
  if (query.category && normalizeText(query.category) !== "all") {
    result = result.filter((product) => normalizeText(product.category).includes(normalizeText(query.category)));
  }
  if (query.size) {
    const sizes = String(query.size).split(",").map(normalizeText);
    result = result.filter((product) => (product.sizes || []).some((size) => sizes.includes(normalizeText(size))));
  }
  if (query.color) {
    const colors = String(query.color).split(",").map(normalizeText);
    result = result.filter((product) => (product.colors || []).some((color) => colors.includes(normalizeText(color))));
  }
  if (query.brand) {
    const brands = String(query.brand).split(",").map(normalizeText);
    result = result.filter((product) => brands.includes(normalizeText(product.brand)));
  }
  if (query.material) {
    const materials = String(query.material).split(",").map(normalizeText);
    result = result.filter((product) => materials.includes(normalizeText(product.material)));
  }
  if (query.gender) {
    result = result.filter((product) => matchesGender(product.gender, query.gender));
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const minPrice = query.minPrice === undefined || query.minPrice === "" ? null : Number(query.minPrice);
    const maxPrice = query.maxPrice === undefined || query.maxPrice === "" ? null : Number(query.maxPrice);
    result = result.filter((product) => {
      const price = Number(product.price) || 0;
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  }
  if (query.search) {
    const needle = normalizeText(query.search);
    result = result.filter((product) =>
      [product.name, product.description, product.brand, product.sku]
        .filter(Boolean)
        .some((field) => normalizeText(field).includes(needle))
    );
  }

  switch (query.sortBy) {
    case "priceAsc":
      result.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "priceDesc":
      result.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "newest":
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  return result;
};

const getCartKey = (userId, guestId) => (userId ? `user:${userId}` : guestId ? `guest:${guestId}` : null);

const findUserById = (store, userId) => store.users.find((user) => user._id === userId) || null;

const findUserByEmail = (store, email) => store.users.find((user) => normalizeText(user.email) === normalizeText(email)) || null;

const ensureCart = (store, userId, guestId) => {
  const key = getCartKey(userId, guestId);
  if (!key) return null;
  let cart = store.carts.find((entry) => entry.key === key);
  if (!cart) {
    cart = {
      _id: generateId(),
      key,
      user: userId || undefined,
      guestId: guestId || undefined,
      products: [],
      totalPrice: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    store.carts.push(cart);
  }
  return cart;
};

const recalcCart = (cart) => {
  cart.totalPrice = cart.products.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  cart.updatedAt = now();
  return cart;
};

const ensureCheckout = (store, checkoutId) => store.checkouts.find((checkout) => checkout._id === checkoutId) || null;

const ensureOrder = (store, orderId) => store.orders.find((order) => order._id === orderId) || null;

const seedIfNeeded = () => {
  ensureSeeded();
};

export {
  clone,
  createInitialStore,
  ensureCart,
  ensureCheckout,
  ensureOrder,
  ensureSeeded,
  findUserByEmail,
  findUserById,
  filterProducts,
  generateId,
  getLocalStore,
  getProductView,
  isLocalMode,
  now,
  paginate,
  recalcCart,
  seedIfNeeded,
  normalizeText,
  rankSimilarProductsByName,
  toPlainProduct,
  toPlainUser,
  withStore,
};