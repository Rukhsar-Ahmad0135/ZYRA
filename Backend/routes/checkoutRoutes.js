/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import express from "express";
import Checkout from "../models/checkout.js";
import Cart from "../models/Cart.js";
import Order from "../models/order.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validate,
  validateObjectId,
  shippingAddressValidator,
  checkoutItemsValidator,
  paymentMethodValidator,
  totalPriceValidator,
} from "../middleware/validate.js";

const router = express.Router();

// @route   POST /api/checkout
// @desc    Create a new checkout session
// @access  Private
router.post(
  "/",
  protect,
  shippingAddressValidator(),
  checkoutItemsValidator(),
  paymentMethodValidator(),
  totalPriceValidator(),
  validate,
  async (req, res, next) => {
    try {
      const {
        checkoutItems,
        shippingAddress,
        paymentMethod,
        totalPrice,
        // Optional guest-cart merge support: when the caller is a guest
        // (or a freshly-logged-in user with a still-resident guest cart),
        // pass `guestId` so we can pull in those items before checkout.
        guestId,
      } = req.body;

      // If a guestId is provided, merge any guest cart into the user's cart
      // before creating the checkout. Best-effort: failure here must NOT
      // block the checkout (the user might be checking out as a pure guest).
      if (guestId && typeof guestId === "string") {
        try {
          const guestCart = await Cart.findOne({ guestId });
          if (guestCart && Array.isArray(guestCart.products) && guestCart.products.length > 0) {
            let userCart = await Cart.findOne({ user: req.user._id });
            if (userCart) {
              guestCart.products.forEach((guestItem) => {
                const idx = userCart.products.findIndex(
                  (item) =>
                    item.product.toString() === guestItem.product.toString() &&
                    item.size === guestItem.size &&
                    item.color === guestItem.color,
                );
                if (idx > -1) {
                  userCart.products[idx].quantity += guestItem.quantity;
                } else {
                  userCart.products.push(guestItem);
                }
              });
              userCart.totalPrice = userCart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0,
              );
              await userCart.save();
              await Cart.findOneAndDelete({ guestId });
            } else {
              guestCart.user = req.user._id;
              guestCart.guestId = undefined;
              await guestCart.save();
            }
          }
        } catch (mergeError) {
          console.warn(
            "[checkout] guest cart merge failed; continuing:",
            mergeError?.message || mergeError,
          );
        }
      }

      // Note: checkoutItems, paymentMethod and totalPrice are already
      // validated by express-validator chains above (see middleware imports).
      // Any failures short-circuit with a 400 before reaching this code.

      const checkout = await Checkout.create({
        user: req.user._id,
        checkoutItems: checkoutItems.map((item) => ({
          productId: item.productId || item.prodcutId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        totalPrice,
        paymentStatus: "pending",
        isPaid: false,
      });

      res.status(201).json(checkout);
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/checkout/:id/pay
// @desc    Mark a checkout as paid (kept for compatibility; COD stays pending)
// @access  Private (owner)
router.put(
  "/:id/pay",
  protect,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    const { paymentStatus, paymentDetails } = req.body;
    try {
      const checkout = await Checkout.findById(req.params.id);
      if (!checkout) {
        res.status(404);
        throw new Error("Checkout not found");
      }
      // Ownership validation
      if (checkout.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to access this checkout");
      }

      if (paymentStatus === "paid") {
        checkout.isPaid = true;
        checkout.paymentStatus = "paid";
        checkout.paymentDetails = paymentDetails;
        checkout.paidAt = Date.now();
      } else {
        checkout.paymentDetails = paymentDetails;
      }
      await checkout.save();
      res.status(200).json(checkout);
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/checkout/:id/finalize
// @desc    Finalize checkout and convert to an order
// @access  Private (owner)
router.post(
  "/:id/finalize",
  protect,
  validateObjectId("id"),
  validate,
  async (req, res, next) => {
    try {
      const checkout = await Checkout.findById(req.params.id);
      if (!checkout) {
        res.status(404);
        throw new Error("Checkout not found");
      }
      // Ownership validation
      if (checkout.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to access this checkout");
      }

      if (checkout.isFinalized) {
        res.status(400);
        throw new Error("Checkout already finalized");
      }

      // For Cash on Delivery, the order is created immediately with a
      // Pending payment status. Admin marks it Paid on delivery.
      const isCOD = /cash on delivery|cod/i.test(checkout.paymentMethod || "");
      const paid = checkout.isPaid && !isCOD;

      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        isPaid: paid,
        paidAt: paid ? checkout.paidAt || Date.now() : undefined,
        isDelivered: false,
        paymentStatus: paid ? "Paid" : "Pending",
        orderStatus: "Pending",
        status: "processing",
      });

      checkout.isFinalized = true;
      checkout.finalizedAt = Date.now();
      await checkout.save();

      await Cart.findOneAndDelete({ user: checkout.user });
      res.status(201).json(finalOrder);
    } catch (error) {
      next(error);
    }
  }
);


export default router;

