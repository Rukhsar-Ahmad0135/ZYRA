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

// Request interceptor — attach Clerk Bearer token (the only auth source)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
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
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

export default apiClient;


