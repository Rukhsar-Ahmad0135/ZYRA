import mongoose from "mongoose";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reject obviously insecure / placeholder JWT secrets at boot time.
// Production deployments MUST set a 32+ character random JWT_SECRET.
const INSECURE_JWT_SECRETS = new Set([
    "zyra_super_secret_jwt_key_2024",
    "secret",
    "changeme",
    "your-secret-key",
    "supersecret",
]);
const assertJwtSecretSecurity = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        const msg = "FATAL: JWT_SECRET must be set to a strong value of at least 32 characters.";
        console.error(msg);
        throw new Error(msg);
    }
    if (INSECURE_JWT_SECRETS.has(secret)) {
        const msg = "FATAL: JWT_SECRET is set to a known-insecure default. Update .env with a strong random value.";
        console.error(msg);
        throw new Error(msg);
    }
};

// Tracks whether the live MongoDB connection is currently established and
// ready to serve queries. Routes should consult this before issuing queries
// so we never silently hang on Mongoose buffering timeouts.
export const isMongoConnected = () => mongoose.connection?.readyState === 1;

const connectDB = async () => {
    // Always enforce secret strength before attempting connection —
    // a weak secret makes every signed token trivially forgeable.
    if (process.env.NODE_ENV === "production") {
        assertJwtSecretSecurity();
    }

    if (!process.env.MONGO_URI) {
        console.warn("MONGO_URI is not defined in environment variables — switching to local data mode.");
        process.env.USE_LOCAL_DATA = "true";
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        console.log("MongoDB connected successfully");
        process.env.USE_LOCAL_DATA = "false";
    } catch (error) {
        process.env.USE_LOCAL_DATA = "true";
        console.warn("MongoDB is unavailable. Falling back to local data mode.");
        await delay(50);
    }
};

export default connectDB;

