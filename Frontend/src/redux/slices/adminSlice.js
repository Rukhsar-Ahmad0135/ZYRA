/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";

// Fetch all users (admin only) with search + pagination
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async ({ page = 1, pageSize = 20, search = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/api/admin/users", {
        params: { page, pageSize, search },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Add a new user
export const addUser = createAsyncThunk(
  "admin/addUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/admin/users", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Update user info
export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, name, email, role }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${id}`, {
        name,
        email,
        role,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Delete a user
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/admin/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    page: 1,
    pages: 1,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        if (Array.isArray(data)) {
          state.users = data;
          state.total = data.length;
          state.pages = 1;
        } else {
          state.users = data.users || [];
          state.total = data.total || 0;
          state.pages = data.pages || 1;
          state.page = data.page || 1;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.user);
        state.total += 1;
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload.user;
        const index = state.users.findIndex((u) => u._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updatedUser };
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default adminSlice.reducer;

