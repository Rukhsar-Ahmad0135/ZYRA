/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import express from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate, quantityValidator } from "../middleware/validate.js";

const router = express.Router();

// Helper function to get a cart by user id or guest id
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

// Helper to recalculate cart total
const recalcTotal = (cart) => {
  cart.totalPrice = cart.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  return cart;
};

// @route POST /api/cart
// @desc Add a product to the cart for a guest or logged in user
// @access Public
router.post(
  "/",
  [quantityValidator("quantity"), validate],
  async (req, res, next) => {
    let { productId, quantity, size, color, guestId, userId } = req.body;

    const numericQuantity = parseInt(quantity, 10);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Invalid product id");
    }

    // Ensure guest cart has a guestId
    if (!userId && (guestId === undefined || guestId === null || guestId === "")) {
      guestId = `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

      let cart = await getCart(userId, guestId);

      if (cart) {
        if (userId) {
          cart.user = userId;
          cart.guestId = undefined;
        }

        const productIndex = cart.products.findIndex(
          (p) =>
            p && p.product && p.product.toString() === productId && p.size === size && p.color === color
        );

        // Cap by available stock so users can't over-order.
        const stock = Number(product.countInStock) || 0;
        const cappedQuantity = Math.min(numericQuantity, stock);

        if (productIndex > -1) {
          if (numericQuantity === 0) {
            cart.products.splice(productIndex, 1);
          } else {
            cart.products[productIndex].quantity = cappedQuantity;
          }
        } else if (cappedQuantity > 0) {
          cart.products.push({
            product: productId,
            name: product.name,
            image: product.images[0]?.url,
            price: product.price,
            size,
            color,
            quantity: cappedQuantity,
          });
        }

        recalcTotal(cart);
        if (!userId) {
          cart.guestId = guestId;
        }

        await cart.save();
        return res.status(200).json(cart);
      } else {
        const stock = Number(product.countInStock) || 0;
        const cappedQuantity = Math.min(numericQuantity, stock);
        const newCart = new Cart({
          user: userId,
          guestId: userId ? undefined : guestId,
          products: [
            {
              product: productId,
              name: product.name,
              image: product.images[0]?.url,
              price: product.price,
              size,
              color,
              quantity: cappedQuantity,
            },
          ],
          totalPrice: product.price * cappedQuantity,
        });
        const savedCart = await newCart.save();
        return res.status(201).json(savedCart);
      }
    } catch (error) {
      next(error);
    }
  }
);

// @route PUT /api/cart
// @desc Update quantity of an item in the cart
// @access Public
router.put(
  "/",
  [quantityValidator("quantity"), validate],
  async (req, res, next) => {
    let { productId, quantity, size, color, guestId, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Invalid product id");
    }

    const numericQuantity = parseInt(quantity, 10);

    try {
      const cart = await getCart(userId, guestId);
      if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
      }

      const productIndex = cart.products.findIndex(
        (p) => p.product.toString() === productId && p.size === size && p.color === color
      );

      if (productIndex === -1) {
        res.status(404);
        throw new Error("Product not found in cart");
      }

      if (numericQuantity <= 0) {
        cart.products.splice(productIndex, 1);
      } else {
        // Cap by available stock; look up product if not already on the line.
        let stock = Number(cart.products[productIndex].countInStock) || 0;
        if (!stock) {
          const product = await Product.findById(productId).select(
            "countInStock",
          );
          stock = Number(product?.countInStock) || 0;
        }
        cart.products[productIndex].quantity = Math.min(numericQuantity, stock);
      }

      recalcTotal(cart);
      await cart.save();
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }
);

// @route DELETE /api/cart
// @desc Remove a product from the cart
// @access Public
router.delete("/", async (req, res, next) => {
  const { userId, guestId, productId } = req.body;

  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) => p.product.toString() === productId
      );

      if (productIndex > -1) {
        cart.products.splice(productIndex, 1);
        recalcTotal(cart);
        const updatedCart = await cart.save();
        return res.status(200).json(updatedCart);
      }
    }

    res.status(404);
    throw new Error("Cart or product not found");
  } catch (error) {
    next(error);
  }
});

// @route GET /api/cart
// @desc Get logged in users or guest users cart
// @access Public
router.get("/", async (req, res, next) => {
  const { userId, guestId } = req.query;
  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      res.json(cart);
    } else {
      res.status(404);
      throw new Error("Cart not found");
    }
  } catch (error) {
    next(error);
  }
});

// @route POST /api/cart/merge
// @desc Merge guest cart into user cart on login
// @access Private
router.post("/merge", protect, async (req, res, next) => {
  const { guestId } = req.body;
  if (!guestId) {
    res.status(400);
    throw new Error("guestId is required to merge");
  }

  try {
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });
    if (guestCart) {
      if (guestCart.products.length === 0) {
        res.status(400);
        throw new Error("Guest cart is empty");
      }

      if (userCart) {
        guestCart.products.forEach((guestItem) => {
          const productIndex = userCart.products.findIndex(
            (item) =>
              item.product.toString() === guestItem.product.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          );
          if (productIndex > -1) {
            userCart.products[productIndex].quantity += guestItem.quantity;
          } else {
            userCart.products.push(guestItem);
          }
        });

        recalcTotal(userCart);
        await userCart.save();
        await Cart.findOneAndDelete({ guestId });
        return res.status(200).json(userCart);
      } else {
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        await guestCart.save();
        return res.status(200).json(guestCart);
      }
    } else {
      if (userCart) {
        return res.status(200).json(userCart);
      }
      res.status(404);
      throw new Error("Guest cart not found");
    }
  } catch (error) {
    next(error);
  }
});

export default router;
