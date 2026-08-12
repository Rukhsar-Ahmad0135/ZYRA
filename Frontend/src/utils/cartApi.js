const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function addItemToServerCart({ productId, size, color, quantity, guestId, userId, token }) {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productId, size, color, quantity, guestId, userId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || "Failed to add to cart";
    throw new Error(message);
  }

  return data;
}

export async function updateServerCartItem({ productId, size, color, quantity, guestId, userId, token }) {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productId, size, color, quantity, guestId, userId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update cart item");
  }

  return data;
}

export async function removeItemFromServerCart({ productId, size, color, guestId, userId, token }) {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productId, size, color, guestId, userId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to remove cart item");
  }

  return data;
}

