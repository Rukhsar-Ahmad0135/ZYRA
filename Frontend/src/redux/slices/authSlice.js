/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";
import { mergeCart as mergeCartThunk } from "./cartSlice.js";

// NOTE: Clerk is the single source of auth. The token is fetched on-demand
// via getAuthToken() in api/client.js — we never persist it in localStorage.
// For local mode (USE_LOCAL_DATA=true), we store the legacy JWT token.
const USER_KEY = "userInfo";
const GUEST_KEY = "guestId";
const LEGACY_TOKEN_KEY = "legacyToken";

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

const getLegacyToken = () => {
  try {
    return localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
};

const saveLegacyToken = (token) => {
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
};

const removeLegacyToken = () => {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
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
  async (userData, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/users/login", userData);
      const { user, token } = response.data;
      saveUser(user);
      if (token) {
        saveLegacyToken(token);
      }
      // Merge any pre-login guest cart into the user cart, then refresh
      // the local cart state with the merged result.
      const guestId = getState().auth?.guestId;
      if (guestId) {
        try {
          await dispatch(mergeCartThunk({ guestId })).unwrap();
        } catch {
          // Cart merge is best-effort — don't fail the login.
        }
      }
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
  async (userData, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/users/register", userData);
      const { user, token } = response.data;
      saveUser(user);
      if (token) {
        saveLegacyToken(token);
      }
      // Merge any pre-signup guest cart into the new user cart, then refresh
      // the local cart state with the merged result.
      const guestId = getState().auth?.guestId;
      if (guestId) {
        try {
          await dispatch(mergeCartThunk({ guestId })).unwrap();
        } catch {
          // Cart merge is best-effort — don't fail the registration.
        }
      }
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
      removeLegacyToken();
    },
    generateGuestId: (state) => {
      state.guestId = `guest_${Date.now()}`;
      localStorage.setItem(GUEST_KEY, state.guestId);
    },
    // Clear only the signed-in user (used on Clerk sign-out). Unlike `logout`,
    // this does NOT regenerate the guestId so a returning guest keeps continuity.
    clearUser: (state) => {
      state.user = null;
      localStorage.removeItem(USER_KEY);
      // Note: We don't remove legacy token here as it might be needed for local mode
    },
    // Directly set user data without an API call. Used when we already have
    // updated data from the server and need to persist it locally.
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
    },
    // Update specific fields on the user object without an API call.
    updateUserFields: (state, action) => {
      const updated = { ...state.user, ...action.payload };
      state.user = updated;
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
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

export const { logout, generateGuestId, clearUser, setUser, updateUserFields } = authSlice.actions;
export default authSlice.reducer;


