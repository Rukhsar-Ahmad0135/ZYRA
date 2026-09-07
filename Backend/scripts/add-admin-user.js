/**
 * Add admin user to MongoDB
 * Run: node Backend/scripts/add-admin-user.js
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

// Define User schema inline to avoid import issues
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
  isAdminApproved: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// Check if user exists
const existingUser = await User.findOne({ email: "rukhsar11@example.com" });
if (existingUser) {
  console.log("User already exists:", existingUser.email, "- Role:", existingUser.role);
  
  // Update role to admin if not already
  if (existingUser.role !== "admin") {
    existingUser.role = "admin";
    existingUser.isAdminApproved = true;
    await existingUser.save();
    console.log("Updated role to admin");
  }
  
  // Reset password
  const newPassword = "rukhsar@123111";
  existingUser.password = bcrypt.hashSync(newPassword, 10);
  await existingUser.save();
  console.log("Password reset to:", newPassword);
} else {
  // Create new admin user
  const hashedPassword = bcrypt.hashSync("rukhsar@123111", 10);
  const adminUser = new User({
    name: "Rukhsar Ahmad",
    email: "rukhsar11@example.com",
    password: hashedPassword,
    role: "admin",
    isAdminApproved: true
  });
  
  await adminUser.save();
  console.log("Created admin user:");
  console.log("  Email: rukhsar11@example.com");
  console.log("  Password: rukhsar@123111");
  console.log("  Role: admin");
}

await mongoose.disconnect();
console.log("\nDone!");
