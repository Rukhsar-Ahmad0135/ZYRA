/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import jwt from "jsonwebtoken";
import { verifyToken } from "@clerk/backend";
import User from "../models/Users.js";

const buildFallbackPassword = (clerkId) => {
  const suffix = clerkId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "Clerk123";
  return `Clerk${suffix}Aa1!`;
};

/**
 * Comma-separated list of emails that should be granted the `admin` role when
 * they sign in with Clerk. Emails are case-insensitive and trimmed.
 */
const getAdminEmails = () =>
  (process.env.CLERK_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const getClerkProfile = (claims) => {
  const clerkId = claims?.sub;
  if (!clerkId) {
    return null;
  }

  const email =
    claims.email_address ||
    claims.email ||
    claims.email_addresses?.[0]?.email_address ||
    claims.emailAddresses?.[0]?.email_address ||
    null;
  const name =
    [claims.first_name, claims.last_name].filter(Boolean).join(" ") ||
    claims.username ||
    (email ? email.split("@")[0] : `clerk-${clerkId.slice(-6)}`);

  return { clerkId, email, name };
};

const syncClerkUser = async (claims) => {
  const profile = getClerkProfile(claims);
  if (!profile) {
    return null;
  }

  const { clerkId, email, name } = profile;
  const query = email ? { $or: [{ clerkId }, { email }] } : { clerkId };
  let user = await User.findOne(query);

  // Auto-promote emails listed in CLERK_ADMIN_EMAILS to the admin role.
  const adminEmails = getAdminEmails();
  const isAdminEmail = Boolean(email && adminEmails.includes(email.toLowerCase()));
  const role = isAdminEmail ? "admin" : "customer";

  if (!user) {
    const createdEmail = email || `clerk-${clerkId}@clerk.local`;
    user = await User.create({
      clerkId,
      name,
      email: createdEmail,
      password: buildFallbackPassword(clerkId),
      role,
    });
  } else {
    let needsSave = false;
    if (!user.clerkId) {
      user.clerkId = clerkId;
      needsSave = true;
    }
    if (email && user.email !== email) {
      user.email = email;
      needsSave = true;
    }
    if (!user.name && name) {
      user.name = name;
      needsSave = true;
    }
    if (isAdminEmail && user.role !== "admin") {
      user.role = "admin";
      needsSave = true;
    }
    if (needsSave) {
      user = await user.save();
    }
  }

  return User.findById(user._id).select("-password");
};

/**
 * Attempt to verify a token as a Clerk session token.
 * Returns the synced user if successful, null otherwise.
 */
const tryVerifyClerkToken = async (token) => {
  if (!process.env.CLERK_SECRET_KEY || !token) {
    return null;
  }

  try {
    const clerkClaims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    if (clerkClaims?.sub) {
      return await syncClerkUser(clerkClaims);
    }
  } catch {
    // Not a valid Clerk token
  }
  return null;
};

/**
 * Attempt to verify a token as a legacy JWT (custom auth).
 * Returns the user if successful, null otherwise.
 */
const tryVerifyLegacyJWT = async (token) => {
  if (!process.env.JWT_SECRET || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.user?.id) {
      return await User.findById(decoded.user.id).select("-password");
    }
  } catch {
    // Not a valid legacy JWT
  }
  return null;
};

/**
 * Middleware to protect routes — verifies JWT from:
 *  1. httpOnly cookie (named by JWT_COOKIE_NAME env)
 *  2. Authorization header (Bearer <token>)
 *
 * Supports both Clerk session tokens and legacy JWT tokens.
 * Clerk tokens are tried first (regardless of source), then legacy JWT.
 */
export const protect = async (req, res, next) => {
  let token = null;
  const authorizationHeader = req.headers.authorization || "";

  const getBearerToken = (headerValue) => {
    if (!headerValue) return null;
    // Match "Bearer" / "bearer" / "BEARER" with optional spaces.
    const match = /^Bearer\s+(\S.*)$/i.exec(headerValue);
    return match ? match[1].trim() : null;
  };

  // 1) Try cookie first
  const cookieName = process.env.JWT_COOKIE_NAME || "zyra_token";
  if (req.cookies && typeof req.cookies[cookieName] === "string" && req.cookies[cookieName]) {
    token = req.cookies[cookieName];
  }

  // 2) Fallback to Authorization header
  if (!token) {
    token = getBearerToken(authorizationHeader);
  }

  if (!token) {
    res.status(401);
    const err = new Error("Not authorized, no token");
    return next(err);
  }

  try {
    // Try Clerk token FIRST (works for both cookie and header tokens)
    const clerkUser = await tryVerifyClerkToken(token);
    if (clerkUser) {
      req.user = clerkUser;
      return next();
    }

    // Fallback to legacy JWT
    const legacyUser = await tryVerifyLegacyJWT(token);
    if (legacyUser) {
      req.user = legacyUser;
      return next();
    }

    // Neither worked
    res.status(401);
    const err = new Error("Not authorized, token failed");
    return next(err);
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to admin users only.
 * Must be used AFTER the `protect` middleware.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403);
  return next(new Error("Forbidden - admin only"));
};
