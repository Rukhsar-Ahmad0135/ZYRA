const STORAGE_KEY = "zyra_guest_id_v1";

export const getOrCreateGuestId = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // ignore
  }

  // Generate a reasonably unique id (no external deps)
  const id = `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }

  return id;
};

