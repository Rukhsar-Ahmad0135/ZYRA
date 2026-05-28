/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const mongoose =require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const User = require("./models/Users");
const products = require("./data/products");

dotenv.config();
//connect to mongeDB
mongoose, connect(process.env.MONGO_URI);

//function to see

const seedData = async () => {
    try{
        //clear existing data
        await Product.deleteMany();
        await User.deleteMany();
        // create a default admin user
        const createdUser = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "123456",
            role: "admin"
        })
        // assign the default  user id to each product
        const userID = createdUser._id;
        const sampleProducts = products.map((product) => {
            return{ ...product, userID}
        });
        // inset the products into the database
        await Product.insertMany(sampleProducts);
        console.log("Product data seeded successfully!:");
        process.exit();
    }
    catch (error) {
        console.error("Error seeding the data:", error);
        process.exit();
    }
};

seedData();