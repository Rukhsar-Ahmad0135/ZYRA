/**
 * Promote existing user to superadmin
 * Run after user has signed in once (so they exist in local DB)
 * Usage: node Backend/scripts/promoteToSuperAdmin.js zawiyaransari5@gmail.com
 */
import dotenv from "dotenv";
dotenv.config();

import { getLocalStore, withStore, findUserByEmail, now, isLocalMode } from "../services/localStore.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node promoteToSuperAdmin.js <email>");
  console.error("Example: node promoteToSuperAdmin.js zawiyaransari5@gmail.com");
  process.exit(1);
}

console.log(`Mode: ${isLocalMode() ? "LOCAL FALLBACK" : "MONGODB"}`);
console.log(`Promoting ${email} to superadmin...`);

if (isLocalMode()) {
  const result = withStore((store) => {
    const user = findUserByEmail(store, email);
    if (!user) return 'NOT_FOUND';
    user.role = "superadmin";
    user.isAdminApproved = true;
    user.updatedAt = now();
    return user;
  });
  
  if (result === 'NOT_FOUND') {
    console.error("❌ User not found in local database.");
    console.error("   → Have them sign in first at /admin/login");
    console.error("   → Then run this script again");
    process.exit(1);
  }
  
  console.log("✅ Promoted to superadmin:");
  console.log("   Email:", result.email);
  console.log("   Role:", result.role);
  console.log("   Approved:", result.isAdminApproved);
  process.exit(0);
} else {
  // MongoDB mode - would need User model
  console.error("MongoDB mode not implemented in this script");
  process.exit(1);
}