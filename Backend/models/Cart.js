import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: String,
        image: String,
        price: Number,
        size: String,
        color: String,
        quantity: {
            type: Number,
            default: 1,
            min: [1, "Quantity must be at least 1"],
        },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        guestId: {
            type: String,
        },
        products: [cartItemSchema],
        totalPrice: {
            type: Number,
            default: 0,
            required: true,
        },
    },
    { timestamps: true }
);

// Sparse-unique guestId prevents two concurrent guest carts sharing the same
// id. user is also unique-sparse to keep one cart per user.
cartSchema.index({ guestId: 1 }, { unique: true, sparse: true });
cartSchema.index({ user: 1 }, { unique: true, sparse: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;

