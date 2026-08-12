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

// Helper to get legacy token from localStorage
const getLegacyToken = () => {
  try {
    return localStorage.getItem("legacyToken");
  } catch {
    return null;
  }
};

// Request interceptor — attach auth token
// Priority: 1. Clerk token (production), 2. Legacy JWT token (local mode)
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

    // Try Clerk token first (production mode)
    const clerkToken = await getAuthToken();
    if (clerkToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${clerkToken}`;
      return config;
    }

    // Fallback to legacy token for local mode
    const legacyToken = getLegacyToken();
    if (legacyToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${legacyToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors and handle 401 (session expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Request failed";

    if (status === 401) {
      // Token invalid/expired — clear any leftover legacy auth state.
      // Do not force a hard reload here: Clerk owns session state, and a
      // full-page navigation can fight Clerk's own routing. Components that
      // need a fresh session should re-read `useAuth()`.
      localStorage.removeItem("userInfo");
      localStorage.removeItem("legacyToken");
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

export default apiClient;


