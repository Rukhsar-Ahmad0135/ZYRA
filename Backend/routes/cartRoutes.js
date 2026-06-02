// /*
//  * Copyright (c) - All Rights Reserved.
//  *
//  * See the LICENSE file for more information.
//  */
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
        return await Cart.findOne({ guestId });
    }
    return null;
};

// @route POST /api/cart
// @desc Add a product to the cart for a guest or logged in user
//@access public
router.post("/", async (req, res) => {
    const { productId, quantity, size, color, guestId, userId } = req.body;
    const numericQuantity = parseInt(quantity, 10);

    if (isNaN(numericQuantity) || numericQuantity < 0) {
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
            // If a userId is provided, ensure it's associated with the cart
            if (userId) {
                cart.user = userId;
                cart.guestId = null;
            }

            const productIndex = cart.products.findIndex(
                (p) =>
                    p && p.product && p.product.toString() === productId
            );
            if (productIndex > -1) {
                if (numericQuantity === 0) {
                    // Remove the product from the cart if quantity is 0
                    cart.products.splice(productIndex, 1);
                } else {
                    // if the prouct already exists , update the quantity
                    cart.products[productIndex].quantity = numericQuantity;
                }
            }
            else if (numericQuantity > 0) {
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
            // if no cart, create one
            const newCart = new Cart({
                user: userId,
                guestId: userId ? null : guestId,
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
            const savedCart = await newCart.save();
            return res.status(201).json(savedCart);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   DELETE /api/cart
// @desc    Remove a product from the cart
// @access  Public
router.delete("/", async (req, res) => {
    const { userId, guestId, productId } = req.body;

    try {
        let cart = await getCart(userId, guestId);

        if (cart) {
            const productIndex = cart.products.findIndex(
                (p) => p.product.toString() === productId
            );

            if (productIndex > -1) {
                cart.products.splice(productIndex, 1);
                cart.totalPrice = cart.products.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                );
                const updatedCart = await cart.save();
                return res.status(200).json(updatedCart);
            }
        }

        return res.status(404).json({ message: "Cart or product not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;