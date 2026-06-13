/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

import express from "express";
import Checkout from "../models/checkout.js";
import Cart from "../models/Cart.js";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route POST /api/checkout
// @desc Create a new checkout session
// @access private
router.post("/", protect, async (req, res) => {

    try {
        // Implementation for creating a new checkout session
        const { checkoutItems, shippingAddress, paymentMethod, totalPrice } = req.body;
        
        if (!checkoutItems || checkoutItems.length === 0) { 
            return res.status(400).json({ message: "no items in checkout" });
        }
        try{
            // create a new checkout session
            const checkout = await Checkout.create({
                user: req.user._id,
                checkoutItems: checkoutItems.map((item) => ({
                    // Accept both `productId` and the frontend typo `prodcutId`
                    productId: item.productId || item.prodcutId,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    // Schema expects quantity as required
                    quantity: item.quantity,
                })),
                shippingAddress,
                paymentMethod,
                totalPrice,
                paymentStatus: "pending",
                isPaid: false,
            });
            console.log(`Checkout created for user: ${req.user._id}`);
            res.status(201).json(checkout);
        } catch (error) {
            console.error("Error creating checkout session:", error);
            res.status(500).json({ message: error.message });
        }
    } catch (error) {
            console.error("Error creating checkout session:", error);
        res.status(500).json({ message: error.message });
    }
});
//@route PUt /api/checkout/:ïd/pay
// @desc Update cehckout to mark as paid after successful payment
// @access Private
router.put("/:id/pay", protect, async (req, res) => {
    const { paymentStatus , paymentDetails } = req.body; // contains payment details from frontend
    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: "Checkout not found" });
        }
        if (paymentStatus === "paid") {
            checkout.isPaid = true;
            checkout.paymentStatus = paymentStatus;
            checkout.paymentDetails= paymentDetails;
            checkout.paidAt = Date.now();
            await checkout.save();

            res.status(200).json(checkout);
        }
        else {
            res.status(400).json({ message: "Invalid payment status" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route POST /api/checkout/:id/finalize
// @desc finalize checkout and convert to an order after payment confirmaiton
// @access Pricate
router.post("/:id/finalize", protect, async (req, res) => { 

    try {
        const checkout = await Checkout.findById(req.params.id);
        if (!checkout) {
            return res.status(404).json({ message: "Checkout not found" });
        }
        if (checkout.isPaid && !checkout.isFinalized) {
            // create order items from checkout items
            const finalOrder = await Order.create({
                user: checkout.user,
                orderItems: checkout.checkoutItems,    
                shippingAddress: checkout.shippingAddress,
                paymentMethod: checkout.paymentMethod,
                totalPrice: checkout.totalPrice,
                isPaid: true,
                paidAt: checkout.paidAt,
                isDelivered: false,
                paymentStatus: "paid",
                paymentDetails: checkout.paymentDetails,
            });
            // Mark the checkout as finalized
            checkout.isFinalized = true;
            checkout.finalizedAt = Date.now();
            await checkout.save();
            // delete the cart associated with the user
            await Cart.findOneAndDelete({ user: checkout.user });
            res.status(201).json(finalOrder);
        }
        else if(checkout.isFinalized) {
            res.status(400).json({ message: "Checkout already finalized" });
        }
        else {
            res.status(400).json({ message: "Checkout is  not paid yet" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
