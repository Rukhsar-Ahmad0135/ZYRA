/**
 * Create initial super admin user
 * Works with both MongoDB and local fallback mode
 * Run: node Backend/scripts/createSuperAdmin.js
 */
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/Users.js";
import connectDB from "../config/db.js";
import { isLocalMode, getLocalStore, withStore, generateId, now, findUserByEmail } from "../services/localStore.js";

const createSuperAdmin = async () => {
  try {
    // Force local mode if MongoDB is not configured
    if (!process.env.MONGO_URI) {
      process.env.USE_LOCAL_DATA = "true";
    }

    await connectDB();
    
    const email = process.env.SUPERADMIN_EMAIL || "superadmin@zyra.com";
    const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123!";
    const name = process.env.SUPERADMIN_NAME || "Super Admin";

    console.log(`Mode: ${process.env.USE_LOCAL_DATA === "true" ? "LOCAL FALLBACK" : "MONGODB"}`);
    console.log(`Creating super admin: ${email}`);

    if (process.env.USE_LOCAL_DATA === "true") {
      // Use local JSON store
      return createSuperAdminLocal(email, password, name);
    } else {
      // Use MongoDB
      return await createSuperAdminMongo(email, password, name);
    }
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
};

const createSuperAdminLocal = (email, password, name) => {
  try {
    const existing = withStore((store) => findUserByEmail(store, email));
    
    if (existing) {
      if (existing.role === "superadmin") {
        console.log("Super admin already exists:", email);
        process.exit(0);
      } else {
        console.log("User exists but is not superadmin. Upgrading...");
        withStore((store) => {
          const user = store.users.find((u) => normalizeEmail(u.email) === normalizeEmail(email));
          if (user) {
            user.role = "superadmin";
            user.isAdminApproved = true;
            user.updatedAt = now();
          }
        });
        console.log("Upgraded to superadmin:", email);
        process.exit(0);
      }
    }

    // Create super admin in local store
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = {
      _id: generateId(),
      name,
      email: normalizeEmail(email),
      password: hashedPassword,
      role: "superadmin",
      isAdminApproved: true,
      createdAt: now(),
      updatedAt: now(),
    };

    withStore((store) => {
      store.users.push(user);
    });

    console.log("Super admin created successfully (local mode):");
    console.log("  Email:", email);
    console.log("  Name:", name);
    console.log("  Role:", "superadmin");
    console.log("  Approved:", true);
    console.log("");
    console.log("Login with these credentials at /login");
    process.exit(0);
  } catch (error) {
    console.error("Error in local mode:", error);
    process.exit(1);
  }
};

const createSuperAdminMongo = async (email, password, name) => {
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      if (existing.role === "superadmin") {
        console.log("Super admin already exists:", email);
        process.exit(0);
      } else {
        console.log("User exists but is not superadmin. Upgrading...");
        existing.role = "superadmin";
        existing.isAdminApproved = true;
        await existing.save();
        console.log("Upgraded to superadmin:", email);
        process.exit(0);
      }
    }

    const superAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "superadmin",
      isAdminApproved: true,
    });

    console.log("Super admin created successfully (MongoDB):");
    console.log("  Email:", superAdmin.email);
    console.log("  Name:", superAdmin.name);
    console.log("  Role:", superAdmin.role);
    console.log("  Approved:", superAdmin.isAdminApproved);
    console.log("");
    console.log("Login with these credentials at /login");
    process.exit(0);
  } catch (error) {
    console.error("Error in MongoDB mode:", error);
    process.exit(1);
  }
};

const normalizeEmail = (email) => String(email).trim().toLowerCase();

createSuperAdmin();