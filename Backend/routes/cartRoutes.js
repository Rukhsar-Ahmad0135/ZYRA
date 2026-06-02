// /*
//  * Copyright (c) - All Rights Reserved.
//  *
//  * See the LICENSE file for more information.
//  */
// const express = require("express");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");
// const { protect } = require("../middleware/authMiddleware");

// const router = express.Router();


// // helper finction to ge ta cart by user id or gues id
// const getCart = async (userId, guestId) => {
//     if (userId) {
//         return await Cart.findOne({ user: userId });
//     } else if (guestId) {
//         return await Cart.findOne({guestId });
//     }
//     return null;
// };

// // @route POST /api/cart
// // @desc Add a product to the cart for a guest or logged in user
// //@access public

// router.post("/", async (req, res) => {
//     const { productId, quantity, size, color, guestId, userId } = req.body;
//     const numericQuantity = parseInt(quantity, 10);

//     if (isNaN(numericQuantity) || numericQuantity <= 0) {
//         return res.status(400).json({ message: "Invalid quantity" });
//     }

//     try {
//         const product = await Product.findById(productId);
//         if (!product)
//             return res.status(404).json({ message: "Product not found" });
//         // determine if the user is logged in or a guest
//         let cart = await getCart(userId, guestId);
//         // if the cart exists, uppdate it
//         if (cart) {
//             const productIndex = cart.products.findIndex(
//                 (p) =>
//                     p && p.product && p.product.toString() === productId
//             );
//             if (productIndex > -1) {
//                 // if the prouct already exists , update the quantity
//                 cart.products[productIndex].quantity += numericQuantity;
//             }
//             else {
//                 //add new product
//                 cart.products.push({
//                     product: productId,
//                     name: product.name,
//                     image: product.images[0].url,
//                     price: product.price,
//                     size,
//                     color,
//                     quantity: numericQuantity,
//                 });
//             }
//             // recalculate the total price
//             cart.totalPrice = cart.products.reduce(
//                 (acc, item) => acc + item.price * item.quantity,
//                 0
//             );
//             const updatedCart = await cart.save();
//             return res.status(200).json(updatedCart);
//         }
//         else {
//             // if no cart, create one
//             const newCart = new Cart({
//                 user: userId,
//                 guestId: userId ? null : guestId,
//                 products: [
//                     {
//                         product: productId,
//                         name: product.name,
//                         image: product.images[0].url,
//                         price: product.price,
//                         size,
//                         color,
//                         quantity: numericQuantity,
//                     },
//                 ],
//                 totalPrice: product.price * numericQuantity,
//             });
//             const savedCart = await newCart.save();
//             return res.status(201).json(savedCart);
//         }

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// module.exports = router;
/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */
const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// helper finction to ge ta cart by user id or gues id
const getCart = async (userId, guestId) => {
    if (userId) {
        return await Cart.findOne({ user: userId });
    } else if (guestId) {
        return await Cart.findOne({guestId });
    }
    return null;
};

// @route POST /api/cart
// @desc Add a product to the cart for a guest or logged in user
//@access public

router.post("/", async (req, res) => {
    const { productId, quantity, size, color, guestId, userId } = req.body;
    const numericQuantity = parseInt(quantity, 10);

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
    }

    try {
        const product = await Product.findById(productId);
        if (!product)
            return res.status(404).json({ message: "Product not found" });
        // determine if the user is logged in or a guest
        let cart = await getCart(userId, guestId);
        // if the cart exists, uppdate it
        if (cart) {
            const productIndex = cart.products.findIndex(
                (p) =>
                    p && p.product && p.product.toString() === productId
            );
            if (productIndex > -1) {
                // if the prouct already exists , update the quantity
                cart.products[productIndex].quantity += numericQuantity;
            }
            else {
                //add new product
                cart.products.push({
                    product: productId,
                    name: product.name,
                    image: product.images[0].url,
                    price: product.price,
                    size,
                    color,
                    quantity: numericQuantity,
                });
            }
            // recalculate the total price
            cart.totalPrice = cart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
            );
            await cart.save();
            return res.status(200).json(cart);
        }
        else {
            // create a new cart for the guest or user
            const newCart = await Cart.create({
                userId: userId ? userId : undefined,
                guestId: guestId ? guestId : "guest_" + new Date().getTime(),
                products: [
                    {
                        product: productId,
                        name: product.name,
                        image: product.images[0].url,
                        price: product.price,
                        size,
                        color,
                        quantity: numericQuantity,
                    },
                ],
                totalPrice: product.price * numericQuantity,
            });
            return res.status(201).json(newCart);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;