import express from "express";
import Cart from "../models/Cart.js";

const router = express.Router();

router.post("/batch", express.json(), async (req, res, next) => {
  try {
    const { userId, guestId, items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items must be a non-empty array" });
    }
    if (!userId && !guestId) {
      return res.status(400).json({ message: "guestId or userId is required" });
    }

    const Product = (await import("../models/Product.js")).default;
    const ids = items.map((i) => i?.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const skipped = [];
    const validItems = [];
    for (const raw of items) {
      const product = productMap.get(String(raw?.productId || ""));
      if (!product) {
        skipped.push({ productId: raw?.productId, reason: "not found" });
        continue;
      }
      validItems.push({
        productId: String(product._id),
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url,
        size: raw.size || (product.sizes && product.sizes[0]) || "M",
        color: raw.color || (product.colors && product.colors[0]) || "",
        quantity: Math.max(1, Number(raw.quantity) || 1),
      });
    }
    if (validItems.length === 0) {
      return res.status(404).json({ message: "no valid products found in batch", skipped });
    }

    const query = userId ? { user: userId } : { guestId };
    let cart = await Cart.findOne(query);
    if (!cart) {
      cart = new Cart({ ...(userId ? { user: userId } : { guestId }), products: [], totalPrice: 0 });
    }
    for (const item of validItems) {
      const existing = cart.products.find(
        (line) => String(line.productId) === item.productId && line.size === item.size && line.color === item.color,
      );
      if (existing) existing.quantity += item.quantity;
      else cart.products.push(item);
    }
    cart.totalPrice = cart.products.reduce((sum, line) => sum + Number(line.price || 0) * Number(line.quantity || 0), 0);
    await cart.save();

    res.status(201).json({
      message: `${validItems.length} item(s) added to cart`,
      addedCount: validItems.length,
      skipped,
      cart: { products: cart.products, totalPrice: cart.totalPrice },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
