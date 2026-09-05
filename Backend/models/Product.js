import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        discountPrice: {
            type: Number,
            min: [0, "Discount price cannot be negative"],
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock cannot be negative"],
        },
        sku: {
            type: String,
            unique: true,
            required: [true, "SKU is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
        },
        brand: {
            type: String,
        },
        sizes: {
            type: [String],
            required: true,
        },
        colors: {
            type: [String],
            required: true,
        },
        collections: {
            type: String,
            required: [true, "Collection is required"],
        },
        material: {
            type: String,
        },
        gender: {
            type: String,
            enum: ["male", "female", "unisex", "Unisex", "Men", "Women", "men", "women"],
        },
        images: [
            {
                url: {
                    type: String,
                    required: [true, "Image url is required"],
                },
                publicId: {
                    // Cloudinary public_id (or any external storage id).
                    // Optional for legacy/external-URL products; required for
                    // any image uploaded via the admin upload endpoint so the
                    // image can be deleted/replaced later.
                    type: String,
                    trim: true,
                },
                altText: {
                    type: String,
                },
            },
        ],
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        tags: [String],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        metaTitle: {
            type: String,
        },
        metaDescription: {
            type: String,
        },
        metaKeywords: {
            type: String,
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
        },
        weight: Number,
    },
    {
        timestamps: true,
    }
);

// Indexes for common query patterns
productSchema.index({ name: "text", description: "text" });
productSchema.index({ collections: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isPublished: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;

