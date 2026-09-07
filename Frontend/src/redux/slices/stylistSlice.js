/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const processRecommendation = createAsyncThunk(
  "stylist/processRecommendation",
  async ({ prompt, sessionId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/stylist/rag/recommend", {
        prompt,
        sessionId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const lockProduct = createAsyncThunk(
  "stylist/lockProduct",
  async ({ sessionId, productId, category }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/api/stylist/rag/lock/${productId}`, {
        sessionId,
        category
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const unlockProduct = createAsyncThunk(
  "stylist/unlockProduct",
  async ({ sessionId, productId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/api/stylist/rag/unlock/${productId}`, {
        sessionId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchOutfit = createAsyncThunk(
  "stylist/fetchOutfit",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/stylist/rag/outfit/${sessionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const clearOutfitSession = createAsyncThunk(
  "stylist/clearOutfitSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/api/stylist/rag/outfit/${sessionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const stylistChat = createAsyncThunk(
  "stylist/stylistChat",
  async ({ prompt, sessionId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/stylist/rag/chat", {
        prompt,
        sessionId
      });
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
  sessionId: null,
  prompt: "",
  outfitName: "",
  summary: "",
  products: [],
  productIds: [],
  source: "idle",
  aiConfigured: false,
  aiError: null,
  loading: false,
  adding: false,
  error: null,
  addedMessage: null,
  lockedItems: [],
  outfitState: null,
  context: {
    gender: null,
    occasion: null,
    style: null,
    budget: null
  },
  chatMessages: [],
  ragConfigured: false,
  provider: null
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
      state.productIds = [];
      state.source = "idle";
      state.error = null;
      state.aiError = null;
      state.addedMessage = null;
    },
    clearStylistAddedMessage(state) {
      state.addedMessage = null;
    },
    clearSession(state) {
      state.sessionId = null;
      state.outfitState = null;
      state.products = [];
      state.productIds = [];
      state.outfitName = "";
      state.summary = "";
      state.lockedItems = [];
      state.chatMessages = [];
      state.context = { gender: null, occasion: null, style: null, budget: null };
      state.source = "idle";
    },
    addChatMessage(state, action) {
      state.chatMessages.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processRecommendation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.addedMessage = null;
      })
      .addCase(processRecommendation.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload?.sessionId || state.sessionId;
        state.outfitName = action.payload?.outfitName || "Your Outfit";
        state.summary = action.payload?.message || "";
        state.products = action.payload?.products || [];
        state.productIds = action.payload?.productIds || [];
        state.outfitState = action.payload?.outfitState || null;
        state.lockedItems = action.payload?.lockedItems || [];
        state.context = action.payload?.context || state.context;
        state.source = action.payload?.source || "ai";
        state.ragConfigured = Boolean(action.payload?.ragConfigured);
        state.provider = action.payload?.provider || null;
      })
      .addCase(processRecommendation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || "Failed to get recommendation";
      })
      .addCase(lockProduct.fulfilled, (state, action) => {
        state.lockedItems = action.payload?.lockedItems || [];
      })
      .addCase(lockProduct.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to lock item";
      })
      .addCase(unlockProduct.fulfilled, (state, action) => {
        state.lockedItems = action.payload?.lockedItems || [];
      })
      .addCase(unlockProduct.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to unlock item";
      })
      .addCase(fetchOutfit.fulfilled, (state, action) => {
        state.products = action.payload?.products || [];
        state.outfitState = action.payload?.outfitState || null;
        state.lockedItems = action.payload?.lockedItems || [];
        state.context = action.payload?.context || state.context;
      })
      .addCase(clearOutfitSession.fulfilled, (state) => {
        state.sessionId = null;
        state.outfitState = null;
        state.products = [];
        state.productIds = [];
        state.outfitName = "";
        state.summary = "";
        state.lockedItems = [];
        state.chatMessages = [];
        state.context = { gender: null, occasion: null, style: null, budget: null };
      })
      .addCase(stylistChat.pending, (state) => {
        state.loading = true;
      })
      .addCase(stylistChat.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload?.sessionId || state.sessionId;
        state.outfitState = action.payload?.outfitState || state.outfitState;
        state.lockedItems = action.payload?.lockedItems || state.lockedItems;
        state.context = action.payload?.context || state.context;
        if (action.payload?.message) {
          state.summary = action.payload.message;
        }
        state.chatMessages.push(
          { role: "user", message: action.payload.prompt },
          { role: "assistant", message: action.payload.message }
        );
      })
      .addCase(stylistChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Chat failed";
      })
      .addCase(addOutfitToCart.pending, (state) => {
        state.adding = true;
        state.addedMessage = null;
      })
      .addCase(addOutfitToCart.fulfilled, (state, action) => {
        state.adding = false;
        state.addedMessage = action.payload?.message || "Outfit added to cart";
      })
      .addCase(addOutfitToCart.rejected, (state, action) => {
        state.adding = false;
        state.error = action.payload?.message || action.error?.message || "Failed to add to cart";
      });
  },
});

export const {
  setStylistPrompt,
  clearStylistResult,
  clearStylistAddedMessage,
  clearSession,
  addChatMessage
} = stylistSlice.actions;

export default stylistSlice.reducer;
