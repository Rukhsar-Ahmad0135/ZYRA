/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchStylistRecommendation = createAsyncThunk(
  "stylist/fetchRecommendation",
  async (prompt, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/stylist/recommend", { prompt });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const addOutfitToCart = createAsyncThunk(
  "stylist/addOutfitToCart",
  async ({ products, guestId, userId }, { rejectWithValue }) => {
    try {
      const items = (products || []).map((product) => ({
        productId: product._id,
        size: (product.sizes && product.sizes[0]) || "M",
        color: (product.colors && product.colors[0]) || "",
        quantity: 1,
      }));
      const response = await apiClient.post("/api/cart/batch", {
        guestId,
        userId,
        items,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState = {
  prompt: "",
  outfitName: "",
  summary: "",
  products: [],
  source: "idle",
  aiConfigured: false,
  aiError: null,
  loading: false,
  adding: false,
  error: null,
  addedMessage: null,
};

const stylistSlice = createSlice({
  name: "stylist",
  initialState,
  reducers: {
    setStylistPrompt(state, action) {
      state.prompt = action.payload;
    },
    clearStylistResult(state) {
      state.outfitName = "";
      state.summary = "";
      state.products = [];
      state.source = "idle";
      state.error = null;
      state.aiError = null;
      state.addedMessage = null;
    },
    clearStylistAddedMessage(state) {
      state.addedMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStylistRecommendation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.addedMessage = null;
      })
      .addCase(fetchStylistRecommendation.fulfilled, (state, action) => {
        state.loading = false;
        state.outfitName = action.payload?.outfitName || "AI Stylist Pick";
        state.summary = action.payload?.summary || "";
        state.products = action.payload?.products || [];
        state.source = action.payload?.source || "fallback";
        state.aiConfigured = Boolean(action.payload?.aiConfigured);
        state.aiError = action.payload?.aiError || null;
      })
      .addCase(fetchStylistRecommendation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to get a stylist recommendation";
      })
      .addCase(addOutfitToCart.pending, (state) => {
        state.adding = true;
        state.addedMessage = null;
      })
      .addCase(addOutfitToCart.fulfilled, (state, action) => {
        state.adding = false;
        state.addedMessage =
          action.payload?.message || "Outfit added to cart";
      })
      .addCase(addOutfitToCart.rejected, (state, action) => {
        state.adding = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to add outfit to cart";
      });
  },
});

export const { setStylistPrompt, clearStylistResult, clearStylistAddedMessage } =
  stylistSlice.actions;
export default stylistSlice.reducer;
