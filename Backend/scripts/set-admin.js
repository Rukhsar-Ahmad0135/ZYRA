/**
 * ZYRA — Promote a user to admin (or set customer) by email.
 *
 * Works with both storage modes:
 *   - MongoDB mode (default): updates the User document where email matches.
 *   - Local-data mode (USE_LOCAL_DATA=true): updates data/local-store.json.
 *
 * Usage:
 *   node Backend/scripts/set-admin.js <email> [admin|customer]
 *
 * Examples:
 *   node Backend/scripts/set-admin.js admin@example.com admin
 *   node Backend/scripts/set-admin.js some@user.com customer
 *   USE_LOCAL_DATA=true node Backend/scripts/set-admin.js admin@example.com admin
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const emailArg = process.argv[2];
const roleArg = (process.argv[3] || "admin").toLowerCase();

if (!emailArg) {
  console.error("Usage: node Backend/scripts/set-admin.js <email> [admin|customer]");
  process.exit(1);
}

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const email = normalizeEmail(emailArg);

if (!["admin", "customer"].includes(roleArg)) {
  console.error('Role must be "admin" or "customer".');
