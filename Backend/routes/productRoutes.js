/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const express = require("express");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
//@route Post /api/products
// @deccreate a new proudct
//@access private/admin

router.post("/", protect, async (req, res) => {
    try {
        const { name, description, price, discountPrice, countInStock, category, brand, sizes, colors, collections, material, gender, images, isFeatured, isPublished, tags, dimensions, weight, sku, } = req.body;
        const product = new Product({
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
            user:req.user._id,//Reference to the admin user owho crated it
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    }
    catch (error) {
       console.error(error); // Log the actual error to the console
       res.status(500).json({ message: "Server Error" });
    }
});


// @route put /api/products/:id
// @desc update an existing product ID
// @access private/admin 
router.put("/:id", protect, async (req, res) => {
    try {
        const { name, description, price, discountPrice, countInStock, category, brand, sizes, colors, collections, material, gender, images, isFeatured, isPublished, tags, dimensions, weight, sku, } = req.body;
        //update product by id
        const productId = req.params.id.trim();
        const product = await Product.findById(productId);
        if (product) {
            //update product fields
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.discountPrice = discountPrice || product.discountPrice;
            product.countInStock = countInStock || product.countInStock;
            product.category = category || product.category;
            product.brand = brand || product.brand;
            product.sizes = sizes || product.sizes;
            product.colors = colors || product.colors;
            product.collections = collections || product.collections;
            product.material = material || product.material;
            product.gender = gender || product.gender;
            product.images = images || product.images;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
            product.isPublished = isPublished !== undefined ? isPublished : product.isPublished;
            product.tags = tags || product.tags;
            product.dimensions = dimensions || product.dimensions;
            product.weight = weight || product.weight;
            product.sku = sku || product.sku;
            //save the update product

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error(error); // Log the actual error to the console
        res.status(500).send("Server error");
        
    }

});

    //@route DELETE /api/products/:id
    // @desc delete prodct by id
    // @access pricate admin
    router.delete("/:id", protect, async (req, res) => { 
        try {
            //find the product by id
            const productId = req.params.id.trim();
            const product = await Product.findById(productId);
            if (product) {
                //remove the product from the database
                await Product.deleteOne();
                res.json({ message: "Product deleted successfully" });
            } else {
                res.status(404).json({ message: "Product not found" });
            }
        }
        catch (error) {
            console.error(error); // Log the actual error to the console
            res.status(500).send("Server error");
        }
    });
router.get("/",async (req,res)=>{
        try {
            const { collection, size, color, gender, minPrice, maxPrice, sortBy, search, category, material, brand, limit } = req.query;
            let query = {};
            //filter logic
            if (collection && collection.toLocaleLowerCase() !== "all") {
                query.collections = collection;
            }
            if (category && category.toLocaleLowerCase() !== "all") {
                query.category = { $regex: category, $options: "i" };
            }
            if (material) {
                query.material = { $in: material.split(",") };
            }
            
            if (brand){
                query.brand = { $in: brand.split(",") };
            }
            if (size){
                query.sizes = { $in: size.split(",") };
            }
            if (color){
                query.colors = { $in: [color]};
            }
            if (gender){
                query.gender = gender;
            }
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) {
                    query.price.$gte = Number(minPrice);
                }
                if (maxPrice) {
                    query.price.$lte = Number(maxPrice);
                }
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ];
            }
            //sort logic
            let sort = {};
            if(sortBy){
                switch (sortBy){
                    case "priceAsc":
                        sort = { price: 1 };
                        break;
                    case "priceDesc":
                sort = {price: -1};
                        break;
                    case "newest":
                        sort = { rating: -1 };
                        break;
                    default:
                        break;   
                }
            }
            //fetch products and apply sorting and limit
            let products = await Product.find(query)
                .sort(sort)
                .limit(Number(limit) || 0);
            res.json(products);
        }catch (error) {
            console.error(error);
            res.status(500).send("Server error");
        }
    } );

// @route GET /api/products/similar/:id
    // @dec retrieve similar produts based on the current product gender and category
// @access public
router.get("/similar/:id", async (req, res) => {
    const id = req.params.id.trim();
    try {
        const product = await Product.findById(id);
        if(!product){
            return res.status(404).json({ message: "Product not found" });
        }  
        const similarProducts = await Product.find({
            _id: { $ne: id }, // Exclude the current product id
            category: product.category,
            gender: product.gender,
        }).limit(4); // Limit the number of similar products returned
        res.json(similarProducts);
    }
    catch (error) { 
        console.error(error);
        res.status(500).send("Server error");
    }
    
});

// @route GET /api/products/best-seller
//@desc retrieve the  products with highest rating
//@access public
router.get("/best-seller", async (req, res) => {
    try {
        const bestSellers = await Product.findOne().sort({ rating: -1 });
        if (bestSellers) {
            res.json(bestSellers);
        }
        else {
            res.status(404).json({ message: "No products found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

    //@route GET /api/products/:id
    //@desc Get a single product by ID
    //@access Public
    router.get("/:id", async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (product) {
                res.json(product);
            }
            else{
                res.status(404).json({ message: "Product not found" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Server error");
        }
    });


    //@route GET /api/products/best-seller
    //@desc retrieve the  products with highest rating
//@access public
router.get("/best-seller", async (req, res) => {
    try {
            res.send("This should not work");
        }
    catch (error) {
            // console.error(error);
            // res.status(500).send("Server error");
        }
});
     //@route GET /api/products/:id
    //@desc get a single product by id
//@access public
// router.get("/:id", async (req, res) => {
//     try {
//             const product= await Product.findById(req.params.id);
//             if (product) {
//                 res.json(product);
//             } else {
//                 res.status(404).json({ message: "Product not found" });
//             }
//         }
//     catch (error) {
//             console.error(error);
//             res.status(500).send("Server error");
//         }
// });

module.exports = router;