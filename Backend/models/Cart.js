// /*
//  * Copyright (c) - All Rights Reserved.
//  * 
//  * See the LICENSE file for more information.
//  */

// const mongoose = require("mongoose");

// const cartItemSchema = new mongoose.Schema({
//     product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//         required: true,
//     },
//         name: String,
//         image: String,
//         price: String,
//         size: String,
//         color: String,
//         quantity: {
//             type: Number,
//             default: 1,
//     },       
// },
//     { _id: false }
// );

// const cartSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//     },
//     guestId: {
//         type: String,
//         index: true,
//         sparse: true,
//     },
//     products: [cartItemSchema],
//     totalPrice: {
//         type: Number,
//         default: 0,
//         required: true,
//     },
// },
//     { timestamps: true }
// );
// module.exports = mongoose.model("Cart", cartSchema);
/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
        name: String,
        image: String,
        price: String,
        size: String,
        color: String,
        quantity: {
            type: Number,
            default: 1,
    },       
},
    { _id: false }
);

const cartSchema = new mongoose.Schema({
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
module.exports = mongoose.model("Cart", cartSchema);