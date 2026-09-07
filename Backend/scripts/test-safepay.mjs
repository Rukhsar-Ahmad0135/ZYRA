/*
 * Safepay API Test Script
 * Run with: node --experimental-vm-modules scripts/test-safepay.mjs
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const API_KEY = process.env.SAFEPAY_API_KEY;
const SECRET_KEY = process.env.SAFEPAY_SECRET_KEY;
const WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET;
const ENVIRONMENT = process.env.SAFEPAY_ENVIRONMENT || "sandbox";

const baseUrl = ENVIRONMENT === "production"
  ? "https://api.getsafepay.com"
  : "https://sandbox.api.getsafepay.com";

console.log("Testing Safepay API Configuration:");
console.log("================================");
console.log(`Environment: ${ENVIRONMENT}`);
console.log(`Base URL: ${baseUrl}`);
console.log(`API Key set: ${API_KEY ? "YES (" + API_KEY.substring(0, 10) + "...)" : "NO"}`);
console.log(`Secret Key set: ${SECRET_KEY ? "YES (" + SECRET_KEY.substring(0, 10) + "...)" : "NO"}`);
console.log(`Webhook Secret set: ${WEBHOOK_SECRET ? "YES" : "NO"}`);
console.log("");

async function testPassportEndpoint() {
  console.log("Testing Passport Token Endpoint...");
  try {
    const response = await fetch(`${baseUrl}/client/passport/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-sfpy-merchant-secret": WEBHOOK_SECRET || SECRET_KEY,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Passport token created successfully!");
      return data.data;
    } else {
      console.log("❌ Passport token failed:", data);
      return null;
    }
  } catch (error) {
    console.log("❌ Passport token error:", error.message);
    return null;
  }
}

async function testPaymentSession(token) {
  console.log("\nTesting Payment Session Endpoint...");
  try {
    const response = await fetch(`${baseUrl}/order/payments/v3/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-sfpy-merchant-secret": SECRET_KEY,
        "Authorization": token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify({
        merchant_api_key: API_KEY,
        intent: "CYBERSOURCE",
        mode: "payment",
        entry_mode: "raw",
        currency: "USD",
        amount: 1000, // USD 10.00 (in cents)
        metadata: {
          order_id: `ZYRA-TEST-${Date.now()}`,
          source: "zyra_test",
        },
        include_fees: false,
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Payment session created successfully!");
      return data.data;
    } else {
      console.log("❌ Payment session failed:", data);
      return null;
    }
  } catch (error) {
    console.log("❌ Payment session error:", error.message);
    return null;
  }
}

async function runTests() {
  console.log("Starting Safepay API Tests...\n");

  // Test 1: Passport Token
  const token = await testPassportEndpoint();

  // Test 2: Payment Session
  if (token) {
    await testPaymentSession(token);
  } else {
    console.log("\nSkipping payment session test (no passport token)");
    await testPaymentSession(null);
  }

  console.log("\nTest Complete.");
}

runTests();
