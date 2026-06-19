/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
//Retrieve user info and toke from localstorage if available

const userFromStorage = JSON.parse(localStorage.getItem("userInfo")) || null;


// Check for an existing guest ID is the laocal Storage or generate a new one 
const initialGuestId = localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

//Initial state
const initialState = {
    user: userFromStorage,
    guestId: initialGuestId,
    loading: false,
    error: null,
};

// Async thunk for user login
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`,userData);
            localStorage.setItem("userInfo", JSON.stringify(response.data.user));
            localStorage.setItem("usertoken", response.data.token);
            return response.data.user; //return the user object from the response
        } catch (error) {
            const payload = error?.response?.data ?? {
                message: error?.message ?? "Request failed",
                status: error?.response?.status,
            };
            console.error("login error payload:", payload);
            return rejectWithValue(payload);
        }
    }
);


// Async thunk for user Registration
export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`, userData);
            localStorage.setItem("userInfo", JSON.stringify(response.data.user));
            localStorage.setItem("usertoken", response.data.token);
            return response.data.user; //return the user object from the response
        } catch (error) {
            const payload = error?.response?.data ?? {
                message: error?.message ?? "Request failed",
                status: error?.response?.status,
            };
            console.error("register error payload:", payload);
            return rejectWithValue(payload);
        }
    }
);


//Slice
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.guestId = `guest_${new Date().getTime()}`; // Reset guest Id on  logout
            localStorage.removeItem("userInfo");
            localStorage.removeItem("usertoken");
            localStorage.setItem("guestId", state.guestId); // set new guest id in local storage
        },
        generateGuestId: (state) => {
            state.guestId = `guest_${new Date().getTime()}`;
            localStorage.setItem("guestId", state.guestId);
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
            state.error = action.payload.message;
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
            state.error = action.payload.message;
        })
    }
});

export const { logout, generateGuestId } = authSlice.actions;
export default authSlice.reducer;


