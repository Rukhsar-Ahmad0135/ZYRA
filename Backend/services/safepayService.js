/*
 * Copyright (c) - All Rights Reserved.
 *
 * Safepay Payment Gateway Service
 * Handles all Safepay API interactions server-side
 * 
 * SANDBOX/TEST MODE configuration
 */

import Safepay from "@sfpy/node-core";

const isSandbox = process.env.SAFEPAY_ENVIRONMENT !== "production";
const host = isSandbox
  ? "https://sandbox.api.getsafepay.com"
  : "https://api.getsafepay.com";

console.log("[Safepay] Initializing with:");
console.log("[Safepay] - Environment:", isSandbox ? "SANDBOX" : "PRODUCTION");
console.log("[Safepay] - Host:", host);
console.log("[Safepay] - API Key:", process.env.SAFEPAY_API_KEY ? `${process.env.SAFEPAY_API_KEY.substring(0, 15)}...` : "NOT SET");

const safepayClient = Safepay(process.env.SAFEPAY_SECRET_KEY, {
  authType: "secret",
  host,
});

export { isSandbox };

export const getSafepayConfig = () => ({
  environment: isSandbox ? "sandbox" : "production",
  intent: process.env.SAFEPAY_INTENT || "CYBERSOURCE",
  apiKey: process.env.SAFEPAY_API_KEY,
});

export const getSafepayApiKey = () => process.env.SAFEPAY_API_KEY;

export const createPaymentSession = async ({
  amount,
  orderId,
  email,
  metadata = {},
}) => {
  const apiKey = process.env.SAFEPAY_API_KEY;

  if (!apiKey || apiKey === "your_safepay_api_key_here") {
    throw new Error("Safepay API key not configured. Please set SAFEPAY_API_KEY in .env");
  }

  try {
    console.log("[Safepay] Creating payment session:");
    console.log("[Safepay] - Amount:", amount, "USD");
    console.log("[Safepay] - Order ID:", orderId);

    const response = await safepayClient.payments.session.setup({
      merchant_api_key: apiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "raw",  // Use raw entry mode for card payments
      currency: "USD",
      amount: Math.round(amount * 100),  // Amount in cents
      metadata: {
        order_id: orderId,
        source: "zyra_store",
        ...metadata,
      },
      return_url: `${process.env.SAFEPAY_CLIENT_URL || "http://localhost:5173"}/safepay/callback`,
      include_fees: false,
    });

    console.log("[Safepay] Payment session created successfully");
    console.log("[Safepay] - Tracker Token:", response.data?.tracker?.token);
    console.log("[Safepay] - Client ID:", response.data?.tracker?.client);
    console.log("[Safepay] - Tracker State:", response.data?.tracker?.state);

    return response;
  } catch (error) {
    console.error("[Safepay] createPaymentSession error:", error.message);
    throw error;
  }
};

export const generateCheckoutUrl = ({ trackerToken, environment = "sandbox", redirectUrl, cancelUrl }) => {
  // Use components URL format - more stable than embedded for some integrations
  // SDK's createCheckoutUrl returns embedded URL, but we can construct components URL directly
  const baseUrl = environment === "sandbox"
    ? "https://sandbox.api.getsafepay.com/components"
    : "https://getsafepay.com/components";

  const checkoutUrl = `${baseUrl}?environment=${environment}&tracker=${trackerToken}&redirect_url=${encodeURIComponent(redirectUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;

  console.log("[Safepay] Generated Checkout URL:", checkoutUrl);
  console.log("[Safepay] - Environment:", environment);
  console.log("[Safepay] - Tracker:", trackerToken);

  return checkoutUrl;
};

export const verifyPayment = async (trackerToken) => {
  try {
    console.log("[Safepay] Verifying payment for tracker:", trackerToken);
    
    const response = await safepayClient.reporter.payments.fetch(trackerToken);
    
    // Response structure: data contains tracker info directly
    const state = response?.data?.state;
    const isSuccess = state === "TRACKER_ENDED";
    
    console.log("[Safepay] Payment verification result:");
    console.log("[Safepay] - Tracker State:", state);
    console.log("[Safepay] - Payment Successful:", isSuccess);

    return response;
  } catch (error) {
    console.error("[Safepay] verifyPayment error:", error.message);
    throw error;
  }
};

export const isPaymentSuccessful = (trackerData) => {
  // Handle both nested and flat response structures
  return trackerData?.data?.state === "TRACKER_ENDED" || trackerData?.tracker?.state === "TRACKER_ENDED";
};

export const extractPaymentInfo = (trackerData) => {
  if (!trackerData) return null;

  // Handle both nested and flat response structures
  const data = trackerData?.data || trackerData;

  return {
    state: data?.state || data?.tracker?.state,
    paymentMethod: data?.action?.payment_method?.card_type || null,
    cardLastFour: data?.action?.payment_method?.last_four || null,
    transactionId: data?.action?.token || null,
    amount: data?.purchase_totals?.quote_amount?.amount || data?.tracker?.purchase_totals?.quote_amount?.amount || null,
    currency: data?.purchase_totals?.quote_amount?.currency || data?.tracker?.purchase_totals?.quote_amount?.currency || "USD",
  };
};

export default {
  getSafepayConfig,
  createPaymentSession,
  generateCheckoutUrl,
  verifyPayment,
  isPaymentSuccessful,
  extractPaymentInfo,
  isSandbox,
  getSafepayApiKey,
};
