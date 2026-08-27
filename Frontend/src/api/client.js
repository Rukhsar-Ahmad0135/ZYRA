/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import axios from "axios";
import { getAuthToken } from "../utils/clerkToken.js";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Single axios instance used across the app
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send httpOnly cookies
});

// Helper to get legacy token from localStorage (synchronous)
const getLegacyToken = () => {
  try {
    return localStorage.getItem("legacyToken");
  } catch {
    return null;
  }
};

// Request interceptor — attach auth token
// Priority in local mode: 1. localStorage legacyToken (immediate), 2. Clerk token (async)
// Priority in production: 1. Clerk token
apiClient.interceptors.request.use(
  async (config) => {
    // For FormData uploads, let the browser set the multipart boundary in
    // Content-Type. Setting it manually here breaks multer and other
    // multipart parsers.
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

    // In local mode: check localStorage FIRST (synchronous, no race condition)
    if (isLocalMode) {
      const legacyToken = getLegacyToken();
      if (legacyToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${legacyToken}`;
        return config;
      }
    }

    // Try Clerk token (production mode, or local mode if no legacy token yet)
    const clerkToken = await getAuthToken();
    if (clerkToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${clerkToken}`;
      return config;
    }

    // Final fallback for local mode (if Clerk token getter not ready yet)
    if (isLocalMode) {
      const legacyToken = getLegacyToken();
      if (legacyToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${legacyToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors and handle 401/403 (session expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Request failed";

    if (status === 401) {
      const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

      if (!isLocalMode) {
        // Production mode: clear any leftover legacy auth state.
        localStorage.removeItem("userInfo");
        localStorage.removeItem("legacyToken");
      }
      // In local mode, keep the legacy auth state — the 401 might be
      // transient (e.g., token expired but user can re-login).
    }

    // Don't auto-clear on 403 - let components handle it (e.g., redirect to login)
    // 403 on admin routes might mean token expired but user still logged in

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

export default apiClient;


