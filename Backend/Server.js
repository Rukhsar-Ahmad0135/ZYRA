/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import orderRoutes from "./routes/orderRoute.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subscribeRoutes from "./routes/subscribeRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import productAdminRoutes from "./routes/productAdminRoutes.js";
import productAdminUploadRoutes from "./routes/productAdminUploadRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
import localFallbackRoutes from "./routes/localFallbackRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import seedInitialData from "./config/seedInitialData.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// NOTE: `useLocalData` must be evaluated AFTER connectDB() so a runtime
// Mongo failure correctly switches us into the local-store path.
// Keep a getter so every caller reads the up-to-date env value.
const isLocalMode = () => process.env.USE_LOCAL_DATA === "true";

/* ------------------------------------------------------------------ */
/*  Security & parsing middleware                                      */
/* ------------------------------------------------------------------ */
// Secure HTTP headers
app.use(helmet());

// Cookie parser (for httpOnly JWT cookies)
app.use(cookieParser());

// Request logging (skip in test env)
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: () => process.env.NODE_ENV === "test",
  })
);

// Parse JSON / URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Prevent MongoDB query injection (sanitize $, ., etc.)
app.use((req, res, next) => {
  if (process.env.USE_LOCAL_DATA === "true") {
    return next();
  }
  return mongoSanitize()(req, res, next);
});

// CORS — restrict to allowed origins from env (CLIENT_URL, comma-separated)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('CORS allowedOrigins:', allowedOrigins);
console.log('CLIENT_URL from env:', process.env.CLIENT_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, server-to-server, curl)
      console.log('CORS check - origin:', origin, 'allowed:', allowedOrigins.includes(origin));
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Global API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register attempts, please try again later." },
});
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */
/**
 * Mount the right set of routers based on whether MongoDB is connected.
 * In local-data mode we mount ONLY the local fallback router (which
 * implements every /api/* path against the on-disk JSON store) — this
 * prevents mongoose-backed routers from hanging on buffering timeouts.
 * In real-DB mode we mount the mongoose-backed routers and let the
 * local fallback route pass through (each local fallback handler
 * early-returns with `next()` when not in local mode).
 */
const mountRouters = () => {
  if (isLocalMode()) {
    console.log("USE_LOCAL_DATA=true: mounting local fallback routes only.");
    app.use("/api", localFallbackRoutes);
    return;
  }

  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/checkout", checkoutRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/subscribers", subscribeRoutes);

  // Admin
  app.use("/api/admin/users", adminRoutes);
  app.use("/api/admin/products", productAdminRoutes);
  // Dedicated multipart upload endpoint for the admin product create/edit
  // flow. Mounted before the static /uploads so /api/admin/products/upload
  // isn't shadowed.
  app.use("/api/admin/products/upload", productAdminUploadRoutes);
  app.use("/api/admin/orders", adminOrderRoutes);
  app.use("/api/admin/stats", adminStatsRoutes);

  // Local fallback routes — early-return in real-DB mode so they're a
  // no-op when mongoose is connected.
  app.use("/api", localFallbackRoutes);
};

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("Welcome to the ZYRA API!");
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Mode: ${isLocalMode() ? "LOCAL FALLBACK (no MongoDB)" : "MONGOOSE"}`);
  });
};

if (isLocalMode()) {
  console.warn("USE_LOCAL_DATA=true - starting without MongoDB and using local fallback storage.");
  mountRouters();
  /* ------------------------------------------------------------------ */
  /*  404 + Error handling                                               */
  /* ------------------------------------------------------------------ */
  app.use(notFound);
  app.use(errorHandler);
  startServer();
} else {
  // Connect to MongoDB first, then mount routers and start the server.
  connectDB()
    .then(() => seedInitialData())
    .then(() => {
      mountRouters();
      /* ------------------------------------------------------------------ */
      /*  404 + Error handling                                               */
      /* ------------------------------------------------------------------ */
      app.use(notFound);
      app.use(errorHandler);
      startServer();
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}
