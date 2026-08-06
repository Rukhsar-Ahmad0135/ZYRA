/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";

// NOTE: Clerk is the single source of auth. The token is fetched on-demand
// via getAuthToken() in api/client.js — we never persist it in localStorage.
const USER_KEY = "userInfo";
const GUEST_KEY = "guestId";

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getGuestId = () => {
  const existing = localStorage.getItem(GUEST_KEY);
  if (existing) return existing;
  const id = `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(GUEST_KEY, id);
  return id;
};

const initialState = {
  user: getUserFromStorage(),
  guestId: getGuestId(),
  loading: false,
  error: null,
};

const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Async thunk for legacy /api/users/login — kept as a fallback for the
// local-data mode. Real auth in production is handled by Clerk.
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/users/login", userData);
      const { user } = response.data;
      saveUser(user);
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk for legacy /api/users/register — kept as a fallback for the
// local-data mode. Real auth in production is handled by Clerk.
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/users/register", userData);
      const { user } = response.data;
      saveUser(user);
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk to fetch the logged-in user profile
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/api/users/profile");
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Async thunk to update the logged-in user profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.put("/api/users/profile", userData);
      const { user } = response.data;
      saveUser(user);
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${Date.now()}`;
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(GUEST_KEY, state.guestId);
    },
    generateGuestId: (state) => {
      state.guestId = `guest_${Date.now()}`;
      localStorage.setItem(GUEST_KEY, state.guestId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      });
  },
});

export const { logout, generateGuestId } = authSlice.actions;
export default authSlice.reducer;


