/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";

// Fetch admin products with search + pagination
export const fetchAdminProducts = createAsyncThunk(
  "adminProducts/fetchProducts",
  async ({ page = 1, pageSize = 20, search = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/api/admin/products", {
        params: { page, pageSize, search },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Create a new product
export const createProduct = createAsyncThunk(
  "adminProducts/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/admin/products", productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Update an existing product
export const updateProduct = createAsyncThunk(
  "adminProducts/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(
        `/api/admin/products/${id}`,
        productData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Delete a product
export const deleteProduct = createAsyncThunk(
  "adminProducts/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/admin/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Upload one or more images for an admin product. Returns the array of
// `{ url, publicId }` objects ready to be stored on `product.images`.
export const uploadProductImages = createAsyncThunk(
  "adminProducts/uploadImages",
  async (files, { rejectWithValue }) => {
    try {
      const fileList = Array.isArray(files) ? files : [files];
      if (fileList.length === 0) {
        return [];
      }
      const fd = new FormData();
      fileList.forEach((file) => {
        fd.append("images", file);
      });
      const response = await apiClient.post(
        "/api/admin/products/upload",
        fd
      );
      // Response shape: { images: [{ url, publicId }, ...] }
      return response.data?.images || [];
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const adminProductSlice = createSlice({
  name: "adminProducts",
  initialState: {
    products: [],
    page: 1,
    pages: 1,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        if (Array.isArray(data)) {
          state.products = data;
          state.total = data.length;
          state.pages = 1;
        } else {
          state.products = data.products || [];
          state.total = data.total || 0;
          state.pages = data.pages || 1;
          state.page = data.page || 1;
        }
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.products.findIndex((p) => p._id === updated._id);
        if (index !== -1) {
          state.products[index] = updated;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default adminProductSlice.reducer;

