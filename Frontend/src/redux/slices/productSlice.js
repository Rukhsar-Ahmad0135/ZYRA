/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";
import { requestWithRetry } from "../../utils/requestWithRetry.js";

// Fetch products by collection / filters
export const fetchProductsByCollection = createAsyncThunk(
  "products/fetchByFilters",
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, value);
        }
      });
      const response = await requestWithRetry(
        () => apiClient.get(`/api/products${query.toString() ? `?${query.toString()}` : ""}`),
        { retries: 1, delayMs: 500 }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Fetch product details by ID
export const fetchProductById = createAsyncThunk(
  "products/fetchProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await requestWithRetry(
        () => apiClient.get(`/api/products/${id}`),
        { retries: 1, delayMs: 500 }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Fetch similar products
export const fetchSimilarProducts = createAsyncThunk(
  "products/fetchSimilarProducts",
  async (id, { rejectWithValue }) => {
    try {
      const response = await requestWithRetry(
        () => apiClient.get(`/api/products/similar/${id}`),
        { retries: 1, delayMs: 500 }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    total: 0,
    pages: 1,
    page: 1,
    selectedProduct: null,
    similarProducts: [],
    loading: false,
    error: null,
    filters: {
      category: "",
      size: "",
      color: "",
      gender: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "",
      search: "",
      material: "",
      collection: "",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        size: "",
        color: "",
        gender: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "",
        search: "",
        material: "",
        collection: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCollection.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        // Handle both paginated { products } and legacy array responses
        if (Array.isArray(data)) {
          state.products = data;
          state.total = data.length;
          state.pages = 1;
          state.page = 1;
        } else {
          state.products = data.products || [];
          state.total = data.total || 0;
          state.pages = data.pages || 1;
          state.page = data.page || 1;
        }
      })
      .addCase(fetchProductsByCollection.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          (action.error?.message === "Network Error"
            ? "Unable to load products right now. Please try again."
            : action.error?.message);
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          (action.error?.message === "Network Error"
            ? "Unable to load product details right now. Please try again."
            : action.error?.message);
      })
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.similarProducts = action.payload;
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          (action.error?.message === "Network Error"
            ? "Unable to load similar products right now. Please try again."
            : action.error?.message);
      });
  },
});

export const { setFilters, clearFilters } = productSlice.actions;
export default productSlice.reducer;


