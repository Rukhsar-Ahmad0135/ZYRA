import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
    {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [80, "Name must be at most 80 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                "Please fill a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
            validate: {
                validator: (value) => {
                    return /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
                },
                message: "Password must contain at least one lowercase letter, one uppercase letter, and one number",
            },
        },
        role: {
            type: String,
            enum: {
                values: ["customer", "admin"],
                message: "Role must be either 'customer' or 'admin'",
            },
            default: "customer",
        },
        addresses: [addressSchema],
        phone: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// (Email index is declared inline on the schema field above.)

// password hashing middleware
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;