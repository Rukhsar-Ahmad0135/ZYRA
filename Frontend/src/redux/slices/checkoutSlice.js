/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";

// Create a checkout session
export const createCheckoutSession = createAsyncThunk(
  "checkout/createSession",
  async (checkoutData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/api/checkout", checkoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Mark a checkout as paid
export const markCheckoutPaid = createAsyncThunk(
  "checkout/markPaid",
  async ({ id, paymentStatus, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/checkout/${id}/pay`, {
        paymentStatus,
        paymentDetails,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Finalize a checkout into an order
export const finalizeCheckout = createAsyncThunk(
  "checkout/finalize",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/api/checkout/${id}/finalize`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState: {
    checkout: null,
    order: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetCheckout: (state) => {
      state.checkout = null;
      state.order = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to create checkout";
      })
      .addCase(markCheckoutPaid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markCheckoutPaid.fulfilled, (state, action) => {
        state.loading = false;
        state.checkout = action.payload;
      })
      .addCase(markCheckoutPaid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to mark checkout as paid";
      })
      .addCase(finalizeCheckout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizeCheckout.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(finalizeCheckout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to finalize checkout";
      });
  },
});

export const { resetCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;

