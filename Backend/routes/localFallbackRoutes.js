import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { verifyToken } from "@clerk/backend";
import {
  clone,
  ensureCart,
  ensureCheckout,
  ensureOrder,
  findUserByEmail,
  findUserById,
  filterProducts,
  generateId,
  getLocalStore,
  getProductView,
  isLocalMode,
  normalizeText,
  now,
  paginate,
  recalcCart,
  rankSimilarProductsByName,
  toPlainProduct,
  toPlainUser,
  withStore,
} from "../services/localStore.js";
import {
  validate,
  nameValidator,
  emailValidator,
  passwordValidator,
  roleValidator,
} from "../middleware/validate.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

const router = express.Router();
const uploadsDir = path.resolve(process.cwd(), "uploads");
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);
const localUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, GIF and AVIF images are allowed."));
  },
});

const authError = (res, message = "Not authorized") => res.status(401).json({ message });

const adminError = (res, message = "Forbidden - admin only") => res.status(403).json({ message });

/**
 * Comma-separated list of emails that should be granted the `admin` role when
 * they sign in with Clerk. Case-insensitive and trimmed.
 */
const getClerkAdminEmails = () =>
  (process.env.CLERK_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/**
 * Sync a Clerk-authenticated user into the local store (in local-data mode).
 * Creates the user on first sign-in and auto-promotes CLERK_ADMIN_EMAILS to admin.
 */
const syncLocalClerkUser = (clerkId, email, name) => {
  const adminEmails = getClerkAdminEmails();
  const isAdminEmail = Boolean(email && adminEmails.includes(String(email).toLowerCase()));
  const role = isAdminEmail ? "admin" : "customer";

  return withStore((store) => {
    let existing = null;
    if (email) existing = findUserByEmail(store, email);
    if (!existing && clerkId) {
      existing = store.users.find((user) => user.clerkId === clerkId) || null;
    }

    if (existing) {
      let changed = false;
      if (!existing.clerkId && clerkId) {
        existing.clerkId = clerkId;
        changed = true;
      }
      if (email && String(existing.email).toLowerCase() !== String(email).toLowerCase()) {
        existing.email = String(email).toLowerCase();
        changed = true;
      }
      if (isAdminEmail && existing.role !== "admin") {
        existing.role = "admin";
        changed = true;
      }
      if (changed) {
        existing.updatedAt = now();
      }
      return existing;
    }

    const user = {
      _id: generateId(),
      clerkId,
      name: name || (email ? email.split("@")[0] : "Clerk User"),
      email: (email || `clerk-${clerkId || Date.now()}@clerk.local`).toLowerCase(),
      password: bcrypt.hashSync(`Clerk${String(clerkId || Date.now()).replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "Clerk123"}Aa1!`, 10),
      role,
      createdAt: now(),
      updatedAt: now(),
    };
    store.users.push(user);
    return user;
  });
};

const requireLocalUser = async (req, res) => {
  const tokenName = process.env.JWT_COOKIE_NAME || "zyra_token";
  let token = req.cookies?.[tokenName] || null;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    authError(res, "Not authorized, no token");
    return null;
  }

  // Heuristic: a Clerk session JWT encodes the `azp`/`aud` claims
  // with a `kclerk` namespace. Trying `verifyToken` against every
  // legacy JWT is slow because it hits Clerk JWKS over the network.
  const looksLikeClerkToken =
    /^eyJhbGciOiJSUzI1Ni[A-Za-z0-9_./-]+$/.test(token || "") &&
    token.split(".").length === 3;

  // Try Clerk token FIRST (works for both cookie and header tokens)
  if (looksLikeClerkToken && process.env.CLERK_SECRET_KEY) {
    try {
      const clerkClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      if (clerkClaims?.sub) {
        const clerkId = clerkClaims.sub;
        const email =
          clerkClaims.email_address ||
          clerkClaims.email ||
          clerkClaims.email_addresses?.[0]?.email_address ||
          clerkClaims.emailAddresses?.[0]?.email_address ||
          null;
        const name =
          [clerkClaims.first_name, clerkClaims.last_name].filter(Boolean).join(" ") ||
          clerkClaims.username ||
          null;
        const synced = syncLocalClerkUser(clerkId, email, name);
        if (synced) {
          return toPlainUser(synced);
        }
      }
    } catch {
      // Not a Clerk token — fall through to legacy JWT below.
    }
  }

  // 2) Fallback to legacy JWT (kept for the local /api/users/login fallback).
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const store = getLocalStore();
    const user = findUserById(store, decoded.user.id);
    if (!user) {
      authError(res, "User belonging to this token no longer exists");
      return null;
    }
    return toPlainUser(user);
  } catch {
    authError(res, "Not authorized, token failed");
    return null;
  }
};

const requireLocalAdmin = async (req, res) => {
  const user = await requireLocalUser(req, res);
  if (!user) return null;
  if (!["admin", "superadmin"].includes(user.role)) {
    adminError(res);
    return null;
  }
  return user;
};

const responseUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  addresses: user.addresses || [],
});

const responseProduct = (product) => toPlainProduct(product);

// Match a cart strictly by the provided identity. Guest carts store `user` as
// undefined, so a naive `entry.user === userId` check would wrongly match a
// guest cart when userId is also undefined. Only match on a field that is set.
const findCartByIdentity = (store, userId, guestId) => {
  if (userId) {
    return store.carts.find((entry) => entry.user === userId) || null;
  }
  if (guestId) {
    return store.carts.find((entry) => entry.guestId === guestId) || null;
  }
  return null;
};


const responseCart = (cart) => ({
  _id: cart._id,
  user: cart.user,
  guestId: cart.guestId,
  products: cart.products,
  totalPrice: cart.totalPrice,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
});

const CANONICAL_ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const responseOrder = (order, store) => {
  const user = findUserById(store, order.userId);
  // Map lowercase status to canonical capitalized version
  const canonicalStatus = CANONICAL_ORDER_STATUSES.find(
    (s) => s.toLowerCase() === String(order.status || "").toLowerCase()
  ) || order.status;
  return {
    _id: order._id,
    id: order._id,
    user: user ? responseUser(user) : order.user,
    orderItems: order.orderItems,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    totalPrice: order.totalPrice,
    isPaid: order.isPaid,
    paidAt: order.paidAt,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    paymentStatus: order.paymentStatus,
    status: order.status,
    orderStatus: canonicalStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

router.use((req, res, next) => {
  // In real-DB mode every route below early-returns with `next()`, so this
  // pass-through is effectively a no-op. In local mode we just continue
  // down the local handler chain.
  if (!isLocalMode()) return next();
  return next();
});

router.get("/", (req, res, next) => {
  if (!isLocalMode()) return next();
  res.send("Welcome to the ZYRA API!");
});

router.get("/products", (req, res, next) => {
  if (!isLocalMode()) return next();
  const store = getLocalStore();
  const filtered = filterProducts(store.products, req.query).map(responseProduct);
  const pageSize = parseInt(req.query.pageSize || req.query.limit || 20, 10) || 20;
  const page = parseInt(req.query.page || 1, 10) || 1;
  const paginated = paginate(filtered, page, pageSize);
  res.json({ products: paginated.items, page: paginated.page, pages: paginated.pages, total: paginated.total });
});

router.get("/products/new-arrivals", (req, res, next) => {
  if (!isLocalMode()) return next();
  const store = getLocalStore();
  const products = [...store.products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map(responseProduct);
  res.json(products);
});

router.get("/products/best-seller", (req, res, next) => {
  if (!isLocalMode()) return next();
  const store = getLocalStore();
  const product = [...store.products].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0];
  if (!product) {
    return res.status(404).json({ message: "No products found" });
  }
  res.json(responseProduct(product));
});

router.get("/products/best-sellers", (req, res, next) => {
  if (!isLocalMode()) return next();
  req.url = "/products/best-seller";
  next();
});

router.get("/products/similar/:id", (req, res, next) => {
  if (!isLocalMode()) return next();
  const store = getLocalStore();
  const product = store.products.find((item) => item._id === req.params.id.trim());
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  const similar = rankSimilarProductsByName(store.products, product, 4).map(responseProduct);
  res.json(similar);
});

router.get("/products/:id", (req, res, next) => {
  if (!isLocalMode()) return next();
  const store = getLocalStore();
  const product = store.products.find((item) => item._id === req.params.id.trim());
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(responseProduct(product));
});

router.post(
  "/users/register",
  express.json(),
  [
    nameValidator(),
    emailValidator(),
    passwordValidator(),
    roleValidator(),
    validate,
  ],
  (req, res, next) => {
    if (!isLocalMode()) return next();
    const { name, email, password, role } = req.body;

    const existing = withStore((store) => findUserByEmail(store, email));
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const created = withStore((store) => {
      const user = {
        _id: generateId(),
        name,
        email: String(email).trim().toLowerCase(),
        password: bcrypt.hashSync(password, 10),
        role: role || "customer",
        createdAt: now(),
        updatedAt: now(),
      };
      store.users.push(user);
      return user;
    });

    const token = jwt.sign(
      { user: { id: created._id, role: created.role } },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "40h" }
    );
    res.status(201).json({ user: responseUser(created), token });
  }
);

router.post(
  "/users/login",
  express.json(),
  [emailValidator(), validate],
  async (req, res, next) => {
    if (!isLocalMode()) return next();
    const { email, password } = req.body;
    const store = getLocalStore();
    const user = findUserByEmail(store, email);
    if (!user || !bcrypt.compareSync(password || "", user.password)) {
      // Generic message — don't leak which emails exist.
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { user: { id: user._id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "40h" }
    );
    res.json({ user: responseUser(user), token });
  }
);

router.get("/users/profile", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  res.json(user);
});

router.put("/users/profile", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;

  const updated = withStore((store) => {
    const storedUser = findUserById(store, user._id);
    if (!storedUser) return null;
    if (req.body.name) storedUser.name = req.body.name;
    if (req.body.email) storedUser.email = String(req.body.email).trim().toLowerCase();
    if (req.body.password) storedUser.password = bcrypt.hashSync(req.body.password, 10);
    // Address fields
    if (req.body.phone) storedUser.phone = req.body.phone;
    if (Array.isArray(req.body.addresses)) storedUser.addresses = req.body.addresses;
    storedUser.updatedAt = now();
    return storedUser;
  });

  if (!updated) return res.status(404).json({ message: "User not found" });
  const token = jwt.sign({ user: { id: updated._id, role: updated.role } }, process.env.JWT_SECRET, { expiresIn: "40h" });
  res.json({ user: responseUser(updated), token });
});

router.get("/cart", (req, res, next) => {
  if (!isLocalMode()) return next();
  const { userId, guestId } = req.query;
  const store = getLocalStore();
  const cart = findCartByIdentity(store, userId, guestId);
  if (!cart) return res.json({ products: [], totalPrice: 0 });
  res.json(responseCart(cart));
});


router.post("/cart", express.json(), (req, res, next) => {
  if (!isLocalMode()) return next();
  const { productId, quantity, size, color, guestId, userId } = req.body;
  const numericQuantity = Number(quantity) || 0;
  const result = withStore((storeState) => {
    const product = storeState.products.find((item) => item._id === productId);
    if (!product) return "product-not-found";

    const cart = ensureCart(storeState, userId || null, guestId || null);
    if (!cart) return "missing-identity";

    const index = cart.products.findIndex(
      (item) => item.product === productId && item.size === size && item.color === color,
    );

    if (index >= 0) {
      if (numericQuantity <= 0) cart.products.splice(index, 1);
      else cart.products[index].quantity = numericQuantity;
    } else if (numericQuantity > 0) {
      cart.products.push({
        product: productId,
        name: product.name,
        image: product.images?.[0]?.url,
        price: product.price,
        size,
        color,
        quantity: numericQuantity,
      });
    }

    recalcCart(cart);
    return responseCart(cart);
  });

  if (result === "product-not-found") return res.status(404).json({ message: "Product not found" });
  if (result === "missing-identity") return res.status(400).json({ message: "guestId or userId is required" });
  return res.status(201).json(result);
});

router.put("/cart", express.json(), (req, res, next) => {
  if (!isLocalMode()) return next();
  const { productId, quantity, size, color, guestId, userId } = req.body;
  const numericQuantity = Number(quantity) || 0;
  const result = withStore((storeState) => {
    const cart = findCartByIdentity(storeState, userId, guestId);
    if (!cart) return "cart-not-found";

    const index = cart.products.findIndex(
      (item) => item.product === productId && item.size === size && item.color === color,
    );
    if (index < 0) return "product-not-found";


    if (numericQuantity <= 0) cart.products.splice(index, 1);
    else cart.products[index].quantity = numericQuantity;

    recalcCart(cart);
    return responseCart(cart);
  });

  if (result === "cart-not-found") return res.status(404).json({ message: "Cart not found" });
  if (result === "product-not-found") return res.status(404).json({ message: "Product not found in cart" });
  return res.json(result);
});

router.delete("/cart", express.json(), (req, res, next) => {
  if (!isLocalMode()) return next();
  const { userId, guestId, productId } = req.body;
  const result = withStore((storeState) => {
    const cart = findCartByIdentity(storeState, userId, guestId);
    if (!cart) return "cart-not-found";

    const index = cart.products.findIndex(
      (item) => item.product === productId && item.size === size && item.color === color
    );
    if (index < 0) return "product-not-found";


    cart.products.splice(index, 1);
    recalcCart(cart);
    return responseCart(cart);
  });

  if (result === "cart-not-found" || result === "product-not-found") {
    return res.status(404).json({ message: "Cart or product not found" });
  }
  return res.json(result);
});

router.post("/cart/merge", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const authUser = await requireLocalUser(req, res);
  if (!authUser) return;
  const { guestId } = req.body;
  const result = withStore((store) => {
    const guestCart = store.carts.find((entry) => entry.guestId === guestId);
    const userCart = store.carts.find((entry) => entry.user === authUser._id);
    if (!guestCart) return userCart || null;
    if (!userCart) {
      guestCart.user = authUser._id;
      guestCart.guestId = undefined;
      guestCart.key = `user:${authUser._id}`;
      guestCart.updatedAt = now();
      return guestCart;
    }
    for (const guestItem of guestCart.products) {
      const index = userCart.products.findIndex((item) => item.product === guestItem.product && item.size === guestItem.size && item.color === guestItem.color);
      if (index >= 0) userCart.products[index].quantity += guestItem.quantity;
      else userCart.products.push(guestItem);
    }
    recalcCart(userCart);
    store.carts = store.carts.filter((entry) => entry.guestId !== guestId);
    return userCart;
  });
  if (!result) return res.status(404).json({ message: "Guest cart not found" });
  res.json(responseCart(result));
});

router.post("/checkout", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  const { checkoutItems, shippingAddress, paymentMethod, totalPrice } = req.body;
  if (!checkoutItems?.length) return res.status(400).json({ message: "No items in checkout" });
  if (!paymentMethod) return res.status(400).json({ message: "Payment method is required" });
  if (totalPrice === undefined || totalPrice === null) return res.status(400).json({ message: "Total price is required" });

  const checkout = withStore((store) => {
    const entry = {
      _id: generateId(),
      userId: user._id,
      checkoutItems: checkoutItems.map((item) => ({
        productId: item.productId || item.prodcutId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid: false,
      paidAt: null,
      paymentStatus: "pending",
      paymentDetails: null,
      isFinalized: false,
      finalizedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    store.checkouts.push(entry);
    return entry;
  });
  res.status(201).json(checkout);
});

router.put("/checkout/:id/pay", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  const { paymentStatus, paymentDetails } = req.body;
  const checkout = withStore((store) => {
    const entry = ensureCheckout(store, req.params.id);
    if (!entry) return null;
    if (entry.userId !== user._id && user.role !== "admin") return "forbidden";
    if (paymentStatus !== "paid") return "invalid";
    entry.isPaid = true;
    entry.paymentStatus = paymentStatus;
    entry.paymentDetails = paymentDetails;
    entry.paidAt = now();
    entry.updatedAt = now();
    return entry;
  });
  if (!checkout) return res.status(404).json({ message: "Checkout not found" });
  if (checkout === "forbidden") return res.status(403).json({ message: "Not authorized to access this checkout" });
  if (checkout === "invalid") return res.status(400).json({ message: "Invalid payment status" });
  res.json(checkout);
});

router.post("/checkout/:id/finalize", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  const result = withStore((store) => {
    const checkout = ensureCheckout(store, req.params.id);
    if (!checkout) return null;
    if (checkout.userId !== user._id && user.role !== "admin") return "forbidden";
    if (checkout.isFinalized) return "finalized";

    // For Cash on Delivery, the order is created immediately with a Pending
    // payment status (an admin marks it Paid on delivery). Non-COD orders must
    // have been paid before finalizing.
    const isCOD = /cash on delivery|cod/i.test(checkout.paymentMethod || "");
    if (!isCOD && !checkout.isPaid) return "unpaid";

    const order = {
      _id: generateId(),
      userId: checkout.userId,
      orderItems: checkout.checkoutItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      totalPrice: checkout.totalPrice,
      isPaid: !isCOD,
      paidAt: !isCOD ? checkout.paidAt : null,
      isDelivered: false,
      deliveredAt: null,
      paymentStatus: !isCOD ? "paid" : "Pending",
      status: "processing",
      createdAt: now(),
      updatedAt: now(),
    };
    store.orders.push(order);
    checkout.isFinalized = true;
    checkout.finalizedAt = now();
    checkout.updatedAt = now();
    store.carts = store.carts.filter((cart) => cart.user !== checkout.userId);
    return order;
  });
  if (!result) return res.status(404).json({ message: "Checkout not found" });
  if (result === "forbidden") return res.status(403).json({ message: "Not authorized to access this checkout" });
  if (result === "finalized") return res.status(400).json({ message: "Checkout already finalized" });
  if (result === "unpaid") return res.status(400).json({ message: "Checkout is not paid yet" });
  res.status(201).json(responseOrder(result, getLocalStore()));
});

router.get("/orders/my-orders", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  const store = getLocalStore();
  const orders = store.orders.filter((order) => order.userId === user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => responseOrder(order, store));
  res.json(orders);
});

router.get("/orders/:id", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalUser(req, res);
  if (!user) return;
  const store = getLocalStore();
  const order = ensureOrder(store, req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.userId !== user._id && user.role !== "admin") return res.status(403).json({ message: "Not authorized to view this order" });
  res.json(responseOrder(order, store));
});

router.get("/admin/users", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const store = getLocalStore();
  const search = normalizeText(req.query.search);
  const filtered = store.users.filter((item) => !search || normalizeText(item.name).includes(search) || normalizeText(item.email).includes(search)).map(toPlainUser);
  const page = parseInt(req.query.page || 1, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || 20, 10) || 20;
  const paginated = paginate(filtered, page, pageSize);
  res.json({ users: paginated.items, page: paginated.page, pages: paginated.pages, total: paginated.total });
});

router.post("/admin/users", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
  const existing = withStore((store) => findUserByEmail(store, email));
  if (existing) return res.status(400).json({ message: "User already exists" });
  const created = withStore((store) => {
    const entry = { _id: generateId(), name, email: String(email).trim().toLowerCase(), password: bcrypt.hashSync(password, 10), role: role || "customer", createdAt: now(), updatedAt: now() };
    store.users.push(entry);
    return entry;
  });
  res.status(201).json({ message: "User created successfully", user: responseUser(created) });
});

router.put("/admin/users/:id", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const updated = withStore((store) => {
    const entry = findUserById(store, req.params.id);
    if (!entry) return null;
    if (req.body.name) entry.name = req.body.name;
    if (req.body.email) entry.email = String(req.body.email).trim().toLowerCase();
    if (req.body.role) entry.role = req.body.role;
    if (req.body.password) entry.password = bcrypt.hashSync(req.body.password, 10);
    entry.updatedAt = now();
    return entry;
  });
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User updated successfully", user: responseUser(updated) });
});

router.delete("/admin/users/:id", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const result = withStore((store) => {
    const index = store.users.findIndex((entry) => entry._id === req.params.id);
    if (index < 0) return null;
    if (store.users[index]._id === user._id) return "self";
    store.users.splice(index, 1);
    return true;
  });
  if (result === null) return res.status(404).json({ message: "User not found" });
  if (result === "self") return res.status(400).json({ message: "You cannot delete your own account" });
  res.json({ message: "User deleted successfully" });
});

router.get("/admin/products", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const store = getLocalStore();
  const search = normalizeText(req.query.search);
  const filtered = store.products.filter((item) => !search || normalizeText(item.name).includes(search) || normalizeText(item.sku).includes(search)).map(responseProduct);
  const page = parseInt(req.query.page || 1, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || 20, 10) || 20;
  const paginated = paginate(filtered, page, pageSize);
  res.json({ products: paginated.items, page: paginated.page, pages: paginated.pages, total: paginated.total });
});

router.post("/admin/products", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const product = withStore((store) => {
    const entry = {
      _id: generateId(),
      ...clone(req.body),
      user: user._id,
      createdAt: now(),
      updatedAt: now(),
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true,
      isFeatured: Boolean(req.body.isFeatured),
    };
    store.products.push(entry);
    return entry;
  });
  res.status(201).json(responseProduct(product));
});

router.put("/admin/products/:id", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const updated = withStore((store) => {
    const entry = store.products.find((item) => item._id === req.params.id);
    if (!entry) return null;
    Object.assign(entry, clone(req.body), { updatedAt: now() });
    return entry;
  });
  if (!updated) return res.status(404).json({ message: "Product not found" });
  res.json(responseProduct(updated));
});

router.delete("/admin/products/:id", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const removed = withStore((store) => {
    const index = store.products.findIndex((item) => item._id === req.params.id);
    if (index < 0) return null;
    store.products.splice(index, 1);
    return true;
  });
  if (!removed) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted successfully" });
});

router.get("/admin/orders", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const store = getLocalStore();
  const status = normalizeText(req.query.status);
  const filtered = store.orders.filter((order) => !status || normalizeText(order.status) === status).map((order) => responseOrder(order, store));
  const page = parseInt(req.query.page || 1, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || 20, 10) || 20;
  const paginated = paginate(filtered, page, pageSize);
  res.json({ orders: paginated.items, page: paginated.page, pages: paginated.pages, total: paginated.total });
});

router.get("/admin/orders/:id", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const store = getLocalStore();
  const order = ensureOrder(store, req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(responseOrder(order, store));
});

router.put("/admin/orders/:id", express.json(), async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const updated = withStore((store) => {
    const order = ensureOrder(store, req.params.id);
    if (!order) return null;
    
    // Handle order status - accept both orderStatus (canonical) and status
    const newStatus = req.body.orderStatus || req.body.status;
    if (newStatus) {
      order.status = String(newStatus).toLowerCase();
    }
    
    if (req.body.isPaid !== undefined) {
      order.isPaid = Boolean(req.body.isPaid);
      order.paymentStatus = order.isPaid ? "paid" : "pending";
      order.paidAt = order.isPaid ? now() : null;
    }
    if (req.body.isDelivered !== undefined) {
      order.isDelivered = Boolean(req.body.isDelivered);
      order.deliveredAt = order.isDelivered ? now() : null;
      if (order.isDelivered) order.status = "delivered";
    }
    order.updatedAt = now();
    return order;
  });
  if (!updated) return res.status(404).json({ message: "Order not found" });
  res.json(responseOrder(updated, getLocalStore()));
});

router.delete("/admin/orders/:id", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const removed = withStore((store) => {
    const index = store.orders.findIndex((order) => order._id === req.params.id);
    if (index < 0) return null;
    store.orders.splice(index, 1);
    return true;
  });
  if (!removed) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order removed" });
});

router.get("/admin/stats", async (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = await requireLocalAdmin(req, res);
  if (!user) return;
  const store = getLocalStore();
  const revenue = store.orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const totalOrders = store.orders.length;
  const totalProducts = store.products.length;
  const totalUsers = store.users.length;
  const totalCustomers = store.users.filter((entry) => entry.role === "customer").length;
  const totalAdmins = store.users.filter((entry) => entry.role === "admin").length;
  const orderStatus = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const order of store.orders) {
    if (orderStatus[order.status] !== undefined) orderStatus[order.status] += 1;
  }
  const recentOrders = [...store.orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((order) => responseOrder(order, store));
  res.json({ revenue, totalOrders, totalProducts, totalUsers, totalCustomers, totalAdmins, orderStatus, recentOrders });
});

router.post("/subscribers", express.json(), (req, res, next) => {
  if (!isLocalMode()) return next();
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required" });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format" });
  const exists = withStore((store) => store.subscribers.some((entry) => entry.email === email));
  if (exists) return res.status(400).json({ message: "Email is already subscribed" });
  withStore((store) => store.subscribers.push({ _id: generateId(), email, subscribedAt: now() }));
  res.status(201).json({ message: "Successfully subscribed to the newsletter" });
});

router.post("/admin/products/upload", (req, res, next) => {
  if (!isLocalMode()) return next();
  const user = requireLocalAdmin(req, res);
  if (!user) return;
  localUpload.array("images", 10)(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Image upload failed" });
    }
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }
    try {
      const images = [];
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer);
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
      res.status(201).json({ images });
    } catch (uploadError) {
      return next(uploadError);
    }
  });
});

router.post("/upload", (req, res, next) => {
  if (!isLocalMode()) return next();
  localUpload.single("image")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Image upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      const extension = allowedMimeTypes.get(req.file.mimetype) || "";
      const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
      const destination = path.join(uploadsDir, filename);
      await fs.promises.writeFile(destination, req.file.buffer);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.status(201).json({
        imageUrl: `${baseUrl}/uploads/${filename}`,
        publicId: filename,
      });
    } catch (uploadError) {
      return next(uploadError);
    }
  });
});

export default router;