/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client.js";

// Fetch all orders (admin only) with pagination
export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchOrders",
  async ({ page = 1, pageSize = 20, status = "" } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/api/admin/orders", {
        params: { page, pageSize, status },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Fetch a single order (admin only)
export const fetchAdminOrderById = createAsyncThunk(
  "adminOrders/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/admin/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Update order status / mark paid / mark delivered
// Canonical order-status taxonomy (Step 12).
const CANONICAL_ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const updateOrderStatus = createAsyncThunk(
  "adminOrders/updateOrderStatus",
  async (
    { id, status, orderStatus, paymentStatus, isPaid, isDelivered },
    { rejectWithValue }
  ) => {
    try {
      // If a canonical status was passed via `status`, route it to `orderStatus`.
      const canonical =
        orderStatus ||
        CANONICAL_ORDER_STATUSES.find(
          (s) => s.toLowerCase() === String(status || "").toLowerCase()
        );

      const payload = {};
      if (canonical) payload.orderStatus = canonical;
      else if (status) payload.status = status;
      if (paymentStatus !== undefined) payload.paymentStatus = paymentStatus;
      if (isPaid !== undefined) payload.isPaid = isPaid;
      if (isDelivered !== undefined) payload.isDelivered = isDelivered;

      const response = await apiClient.put(`/api/admin/orders/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);


// Delete an order
export const deleteOrder = createAsyncThunk(
  "adminOrders/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/admin/orders/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const adminOrderSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    orderDetails: null,
    page: 1,
    pages: 1,
    total: 0,
    totalSales: 0,
    loading: false,
    error: null,
  },
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        if (Array.isArray(data)) {
          state.orders = data;
          state.total = data.length;
          state.pages = 1;
        } else {
          state.orders = data.orders || [];
          state.total = data.total || 0;
          state.pages = data.pages || 1;
          state.page = data.page || 1;
        }
        // Calculate total sales (sum of all loaded orders)
        state.totalSales = state.orders.reduce(
          (acc, order) => acc + (order.totalPrice || 0),
          0
        );
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(fetchAdminOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDetails = action.payload;
      })
      .addCase(fetchAdminOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.orders.findIndex((o) => o._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.orderDetails && state.orderDetails._id === updatedOrder._id) {
          state.orderDetails = updatedOrder;
        }
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { resetOrderDetails } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;

