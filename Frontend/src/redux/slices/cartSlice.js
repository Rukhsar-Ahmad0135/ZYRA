/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

//Helper funcion to load cart from local storage
const loadCartFromLocalStorage = () => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : { products: []};
};

//Helper function to save cart to local storage
const saveCartToStorage = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
};
//Feth cart for a user or gust
export const fetchCart = createAsyncThunk("cart/fetchCart", async ({ userId, guestId }, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
            params: { userId, guestId }
        }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response.data);
    }
});

// Add an item ot the cart for a user or guest
export const addToCart = createAsyncThunk("cart/addToCart", async ({productId, quantity,size,color,guestId,userId }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
            userId,
            guestId,
            productId,
            quantity,
            size,
            color,
        });
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response.data);
    }
});

// Update the quantity of an item in the cart 
export const updateCartItemQuantity = createAsyncThunk("cart/updateCartItemQuantity", async ({ productId, quantity, guestId, userId,size, color }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
            productId,
            quantity,
            guestId,
            userId,
            size,
            color
        });
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response.data);
    }
});


// Remove an item from the cart
export const removeFromCart = createAsyncThunk("cart/removeFromCart", async ({ productId, guestId, userId,size, color }, { rejectWithValue }) => {
    try {
        const response = await axios({
            method:"Delete",
            url:`${import.meta.env.VITE_BACKEND_URL}/api/cart`,
            data: {productId, guestId, userId, size, color}
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response.data);
    }
});

// Merge guest cart with user cart 

export const mergeCart = createAsyncThunk("cart/mergeCart", async ({ guestId, user }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`, {
            guestId, user
        },
    {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`
        }
    }    
        );
        return response.data;
    } catch (error) {
        console.error(error);
        return rejectWithValue(error.response.data);
    }
});


const cartSlice = createSlice({
    name: "cart",
    initialState: {
    cart : loadCartFromLocalStorage(),
        loading: false,
        error: null,
    },
    reducers: {
        clearCart:(state)=>{
            state.cart = { products: [] };
            localStorage.removeItem("cart");
        },
    },
    extraReducers: (builder) => {
        // Handle async thunk reducers here if needed
        builder
            .addCase(fetchCart.pending, (state) => {
            state.loading = true;
            state.error = null;
            })
        .addCase(fetchCart.fulfilled, (state, action) => {
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);

        })
        .addCase(fetchCart.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Failed to fetch cart";
        })
        .addCase(addToCart.pending, (state) => {
            state.loading = true;
            state.error = null;
            })
        .addCase(addToCart.fulfilled, (state, action) => {
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);

        })
        .addCase(addToCart.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Failed to add item to cart";
        })
        .addCase(updateCartItemQuantity.pending, (state) => {
            state.loading = true;
            state.error = null;
            })
        .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);

        })
        .addCase(updateCartItemQuantity.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || "Failed to update cart item quantity";
        })
        .addCase(removeFromCart.pending, (state) => {
            state.loading = true;
            state.error = null;
            })
        .addCase(removeFromCart.fulfilled, (state, action) => {
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);

        })
        .addCase(removeFromCart.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || "Failed to remove item from cart";
        })
        .addCase(mergeCart.pending, (state) => {
            state.loading = true;
            state.error = null;
            })
        .addCase(mergeCart.fulfilled, (state, action) => {
            state.loading = false;
            state.cart = action.payload;
            saveCartToStorage(action.payload);

        })
        .addCase(mergeCart.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || "Failed to merge cart";
        })
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;