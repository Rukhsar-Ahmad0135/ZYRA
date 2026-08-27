import { useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContext";
import { getOrCreateGuestId } from "../../utils/guestId";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "../../redux/slices/cartSlice.js";

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
  const { user, guestId: authGuestId } = useSelector((state) => state.auth);
  const reduxCart = useSelector((state) => state.cart?.cart);
  const dispatch = useDispatch();
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

  // When the user signs in, pull the authoritative server cart and replace
  // local state with it. Avoids stale guest items and any divergence.
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const serverCart = await dispatch(fetchCart({ userId })).unwrap();
        if (cancelled) return;
        const serverItems = Array.isArray(serverCart?.products)
          ? serverCart.products.map((p) => ({
              productId: p.product?._id || p.product || p.productId,
              name: p.name,
              price: Number(p.price) || 0,
              size: p.size || "",
              color: p.color || "",
              quantity: Number(p.quantity) || 1,
              image: p.image || p.product?.images?.[0]?.url || "",
            }))
          : [];
        setItems(serverItems);
      } catch {
        // best-effort: keep local state
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally only re-run when the user identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  // Keep local UI in sync with the redux cartSlice when it changes (e.g. after
  // a successful server merge or fetchCart). This is the single source of
  // truth for server-side cart state.
  useEffect(() => {
    if (!reduxCart) return;
    const products = Array.isArray(reduxCart.products)
      ? reduxCart.products
      : [];
    if (products.length === 0 && items.length === 0) return;
    const mapped = products.map((p) => ({
      productId: p.product?._id || p.product || p.productId,
      name: p.name,
      price: Number(p.price) || 0,
      size: p.size || "",
      color: p.color || "",
      quantity: Number(p.quantity) || 1,
      image: p.image || p.product?.images?.[0]?.url || "",
    }));
    // Only adopt the server shape when it actually contains items; otherwise
    // keep whatever the user has in their local UI.
    if (mapped.length > 0) {
      setItems(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxCart?.products]);

  // cartCount = number of unique line items (not total quantity)
  const cartCount = useMemo(
    () => items.length,
    [items],
  );

  const addToCart = async ({ product, size, color, quantity = 1 }) => {
    const qty = Number(quantity) || 1;

    // Update local UI immediately. The actual server POST is performed by
    // the caller (ProductsDetails dispatches addToCart in cartSlice) so the
    // server cart is not written twice.
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
