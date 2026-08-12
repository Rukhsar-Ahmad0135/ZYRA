/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import User from "./models/Users.js";
import Cart from "./models/Cart.js";
import products from "./data/products.js";

dotenv.config();

// Connect to MongoDB
await connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();

    // Create a default admin user
    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin1234",
      role: "admin",
    });

// Assign the default user id to each product
    // Also ensure isPublished is explicitly true (insertMany does NOT apply defaults)
    const userId = createdUser._id;
    const sampleProducts = products.map((product) => ({
      ...product,
      user: userId,
      isPublished: true,
      isFeatured: product.isFeatured || false,
    }));

    // Insert the products into the database
    await Product.insertMany(sampleProducts);
    console.log("Product data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding the data:", error);
    process.exit(1);
  }
};

seedData();


