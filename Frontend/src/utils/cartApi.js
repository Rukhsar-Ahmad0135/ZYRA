const API_BASE = "http://localhost:9000";

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

