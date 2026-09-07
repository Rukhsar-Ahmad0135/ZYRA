/*
 * Copyright (c) - All Rights Reserved.
 *
 * This file loads environment variables FIRST before any other module imports.
 * Must be imported at the very top of the application entry point.
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from Backend ROOT directory (parent of config)
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export default dotenv;
