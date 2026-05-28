/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js"; 
import cors from "cors";
import ProductRoutes from "./routes/ProductRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// All routes
app.use("/api/users", userRoutes);
app.use("/api/products", ProductRoutes);


const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
res.send("Welcome to the ZYRA API!");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
 });