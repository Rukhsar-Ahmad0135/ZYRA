import { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContext";
import { getOrCreateGuestId } from "../../utils/guestId";

const STORAGE_KEY = "zyra_cart_v1";

const normalizeCartItem = (item) => {
  if (!item) return null;
  return {
    productId: item.productId,
    name: item.name,
    price: Number(item.price) || 0,
    size: item.size || "",
    color: item.color || "",
    quantity: Number(item.quantity ?? item.quanity ?? 1) || 1,
    image: item.image || "",
    brand: item.brand,
    material: item.material,
  };
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeCartItem).filter(Boolean);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

// cartCount = number of unique items (not total quantity)
  const cartCount = useMemo(
    () => items.length,
    [items],
  );

  const addToCart = async ({ product, size, color, quantity = 1 }) => {
    const qty = Number(quantity) || 1;

    // Identify user (if logged in) vs guest.
    // This project currently doesn’t wire auth token into CartContext,
    // so we treat everything as guest unless caller provides userId/token.
    const userId = undefined;
    const token = undefined;
    // Generate / persist guestId for guest carts
    const guestId = (() => {
      try {
        return getOrCreateGuestId();
      } catch {
        return undefined;
      }
    })();

    // 1) Write to backend cart
    try {
      const { addItemToServerCart } = await import("../../utils/cartApi.js");
      await addItemToServerCart({
        productId: product._id || product.id,
        size,
        color,
        quantity: qty,
        guestId,
        userId,
        token,
      });
    } catch {
      // backend might be unavailable; still keep local cart UX
    }

    // 2) Update local cart state (for immediate UI)
    const cartProduct = {
      productId: product._id || product.id,
      name: product.name,
      price: product.price,
      size,
      color,
      quantity: qty,
      image: product.images?.[0]?.url || "",
      brand: product.brand,
      material: product.material,
    };

    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.productId === cartProduct.productId &&
          p.size === cartProduct.size &&
          p.color === cartProduct.color,
      );
      if (idx === -1) return [...prev, cartProduct];

      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: (Number(next[idx].quantity) || 0) + qty,
      };
      return next;
    });
  };

  const removeItem = ({ productId, size, color }) => {
    setItems((prev) =>
      prev.filter(
        (p) =>
          !(p.productId === productId && p.size === size && p.color === color),
      ),
    );
  };

  const updateQuantity = ({ productId, size, color, quantity }) => {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) {
      removeItem({ productId, size, color });
      return;
    }

    setItems((prev) =>
      prev.map((p) =>
        p.productId === productId && p.size === size && p.color === color
          ? { ...p, quantity: q }
          : p,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = {
    items,
    cartCount,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice: items.reduce((sum, it) => sum + it.price * it.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
