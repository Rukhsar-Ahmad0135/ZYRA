/**
 * Vercel Serverless Function wrapper for the Express app.
 *
 * Note: Vercel has a 10s timeout (Hobby plan) / 60s (Pro plan).
 * For production with MongoDB, use Vercel Pro or consider
 * Railway/Render for a persistent backend server.
 */

import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import connectDB from "../config/db.js";
import userRoutes from "../routes/userRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import cartRoutes from "../routes/cartRoutes.js";
import checkoutRoutes from "../routes/checkoutRoutes.js";
import orderRoutes from "../routes/orderRoute.js";
import uploadRoutes from "../routes/uploadRoutes.js";
import subscribeRoutes from "../routes/subscribeRoute.js";
import adminRoutes from "../routes/adminRoutes.js";
import productAdminRoutes from "../routes/productAdminRoutes.js";
import productAdminUploadRoutes from "../routes/productAdminUploadRoutes.js";
import adminOrderRoutes from "../routes/adminOrderRoutes.js";
import adminStatsRoutes from "../routes/adminStatsRoutes.js";
import localFallbackRoutes from "../routes/localFallbackRoutes.js";
import { notFound, errorHandler } from "../middleware/errorMiddleware.js";

let app = null;
let dbReady = false;

async function createApp() {
  if (app) return app;

  if (process.env.USE_LOCAL_DATA !== "true") {
    await connectDB();
    dbReady = true;
  } else {
    dbReady = false;
  }

  const expressApp = express();

  // Security & parsing middleware
  expressApp.use(helmet());
  expressApp.use(cookieParser());
  expressApp.use(
    morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
      skip: () => process.env.NODE_ENV === "test",
    })
  );
  expressApp.use(express.json({ limit: "10mb" }));
  expressApp.use(express.urlencoded({ extended: true, limit: "10mb" }));

  expressApp.use((req, res, next) => {
    if (process.env.USE_LOCAL_DATA === "true") {
      return next();
    }
    return mongoSanitize()(req, res, next);
  });

  const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  expressApp.use(
    cors({
      origin: (origin, callback) => {
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

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });
  expressApp.use("/api", apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login/register attempts, please try again later." },
  });
  expressApp.use("/api/users/login", authLimiter);
  expressApp.use("/api/users/register", authLimiter);

  // Mount routes
  if (process.env.USE_LOCAL_DATA === "true") {
    expressApp.use("/api", localFallbackRoutes);
  } else {
    expressApp.use("/api/users", userRoutes);
    expressApp.use("/api/products", productRoutes);
    expressApp.use("/api/cart", cartRoutes);
    expressApp.use("/api/checkout", checkoutRoutes);
    expressApp.use("/api/orders", orderRoutes);
    expressApp.use("/api/upload", uploadRoutes);
    expressApp.use("/api/subscribers", subscribeRoutes);
    expressApp.use("/api/admin/users", adminRoutes);
    expressApp.use("/api/admin/products", productAdminRoutes);
    expressApp.use("/api/admin/products/upload", productAdminUploadRoutes);
    expressApp.use("/api/admin/orders", adminOrderRoutes);
    expressApp.use("/api/admin/stats", adminStatsRoutes);
    expressApp.use("/api", localFallbackRoutes);
  }

  // Static files (uploads)
  expressApp.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  expressApp.get("/", (req, res) => {
    res.send("Welcome to the ZYRA API!");
  });

  expressApp.use(notFound);
  expressApp.use(errorHandler);

  app = expressApp;
  return expressApp;
}

export default async function handler(req, res) {
  const expressApp = await createApp();
  expressApp(req, res);
}