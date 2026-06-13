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
    let { productId, quantity, size, color, guestId, userId } = req.body;

    const numericQuantity = parseInt(quantity, 10);

    // Ensure guest cart has a guestId
    // If request is missing guestId (manual client test), generate one on the backend.
    if (!userId && (guestId === undefined || guestId === null || guestId === "")) {
        guestId = `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }


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
            // Ensure guestId is returned for guest carts
            if (!userId) {
                cart.guestId = guestId;
            }

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


//@ route get /api/cart
//@desc get logged in users or  guest users cart
//@access Public
router.get("/", async (req, res) => { 
    const { userId, guestId } = req.query;
    try {
        const cart = await getCart(userId, guestId);
        if (cart) {
            res.json(cart);
        }
        else {
            res.status(404).json({ message: "Cart not found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
//@route Post /api/cart/merge
//desc Merge guest cart into user cart on loign
//@access private
router.post("/merge", protect, async (req, res) => {
    // guestId required to merge
    const { guestId } = req.body;
    if (!guestId) {
        return res.status(400).json({ message: "guestId is required to merge" });
    }

    try {
        //find the guest cart and user cart
        const guestCart = await Cart.findOne({ guestId });
        const userCart = await Cart.findOne({ user: req.user._id });
        if (guestCart) {
            if (guestCart.products.length === 0) {
                return res.status(400).json({ message: "Guest cart is empty" });
            }
            if (userCart){
                //Merge guest cart into user cart
                guestCart.products.forEach((guestItem) => {
                    const productIndex = userCart.products.findIndex(
                        (item) =>
                            item.product.toString() === guestItem.productId.toString() &&
                            item.size === guestItem.size &&
                            item.color === guestItem.color
                    );
                    if (productIndex > -1){
                        // if the items exists in the user cart , update the quantity
                        userCart.products[productIndex].quantity += guestItem.quantity;
                    }
                    else {
                        //otherwise , add the gues item to the cart
                        userCart.products.push(guestItem);
                    }
                });
                userCart.totalPrice = userCart.products.reduce(
                    (acc, item) => acc + item.price * item.quantity,
                    0
                );
                await userCart.save();
                // Remove the guest cart after merging
                try {
                    await Cart.findOneAndDelete({ guestId });
                }
                catch (error) {
                    console.error("Error deleting guest cart:",error);
                }
                res.status(200).json(userCart);
            }
            else {
                //if the user has no existing cart , assign the guest cart to the user
                guestCart.user = req.user._id;
                guestCart.guestId = undefined;
                await guestCart.save();
                res.status(200).json(guestCart);
            }
        }
        else{
            if (userCart)
            {
                //guest cart has already been merged, return user cart
                return res.status(200).json(userCart);
            }
            res.status(404).json({ message: "Guest cart not found" });
        }
    }
    catch (error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
 });
module.exports = router;