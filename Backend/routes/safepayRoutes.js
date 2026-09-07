/*
 * Copyright (c) - All Rights Reserved.
 *
 * Safepay Payment Gateway Routes
 * Handles payment session creation, verification, and webhooks
 * 
 * SECURITY: Payment is verified server-side via webhook AND direct API check
 */

import express from "express";
import crypto from "crypto";
import Checkout from "../models/checkout.js";
import Order from "../models/order.js";
import Cart from "../models/Cart.js";
import Users from "../models/Users.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPaymentSession,
  generateCheckoutUrl,
  verifyPayment,
  isPaymentSuccessful,
  extractPaymentInfo,
  getSafepayConfig,
  isSandbox,
} from "../services/safepayService.js";

const router = express.Router();

const getClientUrl = () => {
  return process.env.SAFEPAY_CLIENT_URL || "http://localhost:5173";
};

const verifyWebhookSignature = (payload, signature) => {
  if (!process.env.SAFEPAY_WEBHOOK_SECRET) {
    console.warn("[Safepay Webhook] No WEBHOOK_SECRET configured, skipping verification");
    return true;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SAFEPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature || ""),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
};

// @route   POST /api/safepay/create-session
// @desc    Create a Safepay payment session and return checkout URL
// @access  Private
router.post("/create-session", protect, async (req, res, next) => {
  try {
    const { checkoutId } = req.body;

    console.log("\n[Safepay] ===== CREATE SESSION REQUEST =====");
    console.log("[Safepay] Checkout ID:", checkoutId);
    console.log("[Safepay] User ID:", req.user._id);

    if (!checkoutId) {
      return res.status(400).json({ message: "Checkout ID is required" });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      console.log("[Safepay] Checkout not found:", checkoutId);
      return res.status(404).json({ message: "Checkout session not found" });
    }

    if (checkout.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      console.log("[Safepay] Unauthorized access attempt");
      return res.status(403).json({ message: "Not authorized to access this checkout" });
    }

    if (checkout.isPaid) {
      console.log("[Safepay] Checkout already paid:", checkoutId);
      return res.status(400).json({ message: "Checkout already paid" });
    }

    const orderId = `ZYRA-${checkout._id.toString()}-${Date.now()}`;

    const user = await Users.findById(req.user._id);
    const customerEmail = user?.email || req.user.email || "customer@example.com";

    console.log("[Safepay] Creating payment session for order:", orderId);
    console.log("[Safepay] Amount:", checkout.totalPrice, "USD");
    console.log("[Safepay] Email:", customerEmail);

    const sessionResponse = await createPaymentSession({
      amount: checkout.totalPrice,
      orderId,
      email: customerEmail,
      metadata: {
        order_id: orderId,
      },
    });

    if (!sessionResponse?.data?.tracker?.token) {
      console.error("[Safepay] Failed to create payment session:", sessionResponse);
      return res.status(500).json({ message: "Failed to create payment session" });
    }

    const trackerToken = sessionResponse.data.tracker.token;
    const clientId = sessionResponse.data.tracker.client;

    console.log("[Safepay] Payment session created successfully");
    console.log("[Safepay] Tracker Token:", trackerToken);
    console.log("[Safepay] Client ID:", clientId);

    checkout.safepayTracker = trackerToken;
    await checkout.save();

    const config = getSafepayConfig();
    
    console.log("[Safepay] Config Environment:", config.environment);
    
    const checkoutUrl = generateCheckoutUrl({
      trackerToken,
      environment: config.environment,
      redirectUrl: `${getClientUrl()}/safepay/success`,
      cancelUrl: `${getClientUrl()}/safepay/cancel`,
    });

    console.log("[Safepay] Final Checkout URL:", checkoutUrl);
    console.log("[Safepay] ===== END CREATE SESSION =====\n");

    res.json({
      checkoutUrl,
      tracker: trackerToken,
    });
  } catch (error) {
    console.error("[Safepay] Error creating session:", error);
    next(error);
  }
});

// @route   GET /api/safepay/verify/:tracker
// @desc    Verify payment status by tracker token (server-side verification)
// @access  Private
router.get("/verify/:tracker", protect, async (req, res, next) => {
  try {
    const { tracker } = req.params;

    console.log("\n[Safepay] ===== VERIFY PAYMENT REQUEST =====");
    console.log("[Safepay] Tracker:", tracker);
    console.log("[Safepay] User ID:", req.user._id);

    if (!tracker) {
      return res.status(400).json({ message: "Tracker token is required" });
    }

    const trackerData = await verifyPayment(tracker);
    const paymentInfo = extractPaymentInfo(trackerData);
    const isSuccessful = isPaymentSuccessful(trackerData);

    console.log("[Safepay] Tracker State:", trackerData?.tracker?.state);
    console.log("[Safepay] Payment Successful:", isSuccessful);
    console.log("[Safepay] Payment Info:", JSON.stringify(paymentInfo));
    console.log("[Safepay] ===== END VERIFY =====\n");

    res.json({
      tracker,
      state: trackerData?.tracker?.state,
      paymentInfo,
      isSuccessful,
    });
  } catch (error) {
    console.error("[Safepay] Error verifying payment:", error);
    next(error);
  }
});

// @route   POST /api/safepay/webhook
// @desc    Handle Safepay webhook notifications
// @access  Public (verified by HMAC signature)
router.post("/webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-safepay-signature"] || req.headers["x-webhook-signature"];
    const rawPayload = req.body;

    // Safepay sends payload either as { root: {...} } or { data: {...} }
    const payload = rawPayload.root || rawPayload.data || rawPayload;
    const eventType = rawPayload.type || rawPayload.resource || "unknown";
    const tracker = payload.tracker;

    console.log("\n[Safepay Webhook] ===== WEBHOOK RECEIVED =====");
    console.log("[Safepay Webhook] Event Type:", eventType);
    console.log("[Safepay Webhook] Tracker:", tracker);
    console.log("[Safepay Webhook] State:", payload.state);
    console.log("[Safepay Webhook] Amount:", payload.amount);

    if (!tracker) {
      console.warn("[Safepay Webhook] Invalid payload - no tracker found");
      console.log("[Safepay Webhook] Raw payload:", JSON.stringify(rawPayload).substring(0, 500));
      return res.status(400).json({ message: "Invalid payload" });
    }

    const isValidSignature = verifyWebhookSignature(rawPayload, signature);
    console.log("[Safepay Webhook] Signature Valid:", isValidSignature);

    if (signature && !isValidSignature) {
      console.error("[Safepay Webhook] Invalid signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { state, amount, currency, metadata } = payload;

    console.log(`[Safepay Webhook] Processing event: ${eventType}`);

    // Handle refund events - acknowledge but don't process as payment
    if (eventType === "refund" || payload.state?.includes("REFUNDED")) {
      console.log(`[Safepay Webhook] Refund event acknowledged for tracker: ${tracker}`);
      return res.status(200).json({ message: "Refund acknowledged" });
    }

    const checkout = await Checkout.findOne({ safepayTracker: tracker });
    if (!checkout) {
      console.warn(`[Safepay Webhook] Checkout not found for tracker: ${tracker}`);
      return res.status(200).json({ message: "Checkout not found, acknowledged" });
    }

    console.log("[Safepay Webhook] Checkout found:", checkout._id);
    console.log("[Safepay Webhook] Checkout already paid:", checkout.isPaid);

    // Handle payment success states
    if (state === "PAID" || state === "TRACKER_ENDED" || eventType === "payment") {
      if (checkout.isPaid) {
        console.log(`[Safepay Webhook] Duplicate payment webhook for tracker: ${tracker}`);
        return res.status(200).json({ message: "Already processed" });
      }

      console.log("[Safepay Webhook] Processing successful payment...");

      checkout.isPaid = true;
      checkout.paymentStatus = "paid";
      checkout.paidAt = new Date();
      checkout.paymentDetails = {
        safepayState: state,
        amount,
        currency,
        eventType,
        processedAt: new Date().toISOString(),
      };
      await checkout.save();
      console.log("[Safepay Webhook] Checkout marked as paid");

      // Create the order
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: "Safepay",
        totalPrice: checkout.totalPrice,
        isPaid: true,
        paidAt: new Date(),
        isDelivered: false,
        paymentStatus: "Paid",
        orderStatus: "Pending",
        status: "processing",
        safepayTracker: tracker,
        safepayPaymentMethod: payload.payment_method?.card_type || payload.card_type || "Card",
        safepayCardLastFour: payload.payment_method?.last_four || payload.last_four || null,
        safepayTransactionId: payload.token || null,
        safepayPaidAt: new Date(),
      });

      console.log("[Safepay Webhook] Order created:", finalOrder._id);

      // Clear the cart
      await Cart.findOneAndDelete({ user: checkout.user });
      console.log("[Safepay Webhook] Cart cleared");

      console.log(`[Safepay Webhook] Payment successful for tracker: ${tracker}`);
    } else if (state === "FAILED" || state === "payment.failed") {
      console.log(`[Safepay Webhook] Payment failed for tracker: ${tracker}`);
      console.log(`[Safepay Webhook] Reason: ${payload.message}`);

      checkout.paymentStatus = "failed";
      checkout.paymentDetails = {
        safepayState: state,
        eventType,
        errorMessage: payload.message,
        errorCategory: payload.category,
        processedAt: new Date().toISOString(),
      };
      await checkout.save();
    }

    console.log("[Safepay Webhook] ===== WEBHOOK PROCESSED =====\n");

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("[Safepay Webhook] Error processing webhook:", error);
    next(error);
  }
});

// @route   GET /api/safepay/status/:checkoutId
// @desc    Get payment status for a checkout (server-side verification)
// @access  Private
router.get("/status/:checkoutId", protect, async (req, res, next) => {
  try {
    const { checkoutId } = req.params;

    console.log("\n[Safepay] ===== STATUS CHECK =====");
    console.log("[Safepay] Checkout ID:", checkoutId);
    console.log("[Safepay] User ID:", req.user._id);

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      console.log("[Safepay] Checkout not found");
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      console.log("[Safepay] Unauthorized");
      return res.status(403).json({ message: "Not authorized" });
    }

    let paymentStatus = {
      isPaid: checkout.isPaid,
      paymentStatus: checkout.paymentStatus,
      safepayTracker: checkout.safepayTracker,
    };

    // If we have a tracker and not paid, verify with Safepay server
    if (checkout.safepayTracker && !checkout.isPaid) {
      try {
        console.log("[Safepay] Verifying tracker:", checkout.safepayTracker);
        const trackerData = await verifyPayment(checkout.safepayTracker);
        const isSuccessful = isPaymentSuccessful(trackerData);

        console.log("[Safepay] Tracker state:", trackerData?.tracker?.state);
        console.log("[Safepay] Server-side verification successful:", isSuccessful);

        if (isSuccessful && !checkout.isPaid) {
          checkout.isPaid = true;
          checkout.paymentStatus = "paid";
          checkout.paidAt = new Date();
          await checkout.save();

          paymentStatus.isPaid = true;
          paymentStatus.paymentStatus = "paid";

          console.log("[Safepay] Checkout updated to paid via server verification");
        }

        paymentStatus.trackerState = trackerData?.tracker?.state;
      } catch (verifyError) {
        console.warn("[Safepay] Could not verify tracker:", verifyError.message);
      }
    }

    console.log("[Safepay] Final Status:", JSON.stringify(paymentStatus));
    console.log("[Safepay] ===== END STATUS CHECK =====\n");

    res.json(paymentStatus);
  } catch (error) {
    console.error("[Safepay] Error checking status:", error);
    next(error);
  }
});

// @route   POST /api/safepay/verify-session
// @desc    Verify and finalize payment from success page (server-side only)
// @access  Private
router.post("/verify-session", protect, async (req, res, next) => {
  try {
    const { checkoutId, tracker } = req.body;

    console.log("\n[Safepay] ===== VERIFY SESSION REQUEST =====");
    console.log("[Safepay] Checkout ID:", checkoutId);
    console.log("[Safepay] Tracker:", tracker);
    console.log("[Safepay] User ID:", req.user._id);

    if (!checkoutId || !tracker) {
      return res.status(400).json({ message: "Checkout ID and tracker required" });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Verify with Safepay server
    console.log("[Safepay] Verifying payment with Safepay server...");
    const trackerData = await verifyPayment(tracker);
    const isSuccessful = isPaymentSuccessful(trackerData);
    const paymentInfo = extractPaymentInfo(trackerData);

    console.log("[Safepay] Verification result:");
    console.log("[Safepay] - State:", trackerData?.tracker?.state);
    console.log("[Safepay] - Payment successful:", isSuccessful);

    if (!isSuccessful) {
      console.log("[Safepay] Payment not yet completed or failed");
      return res.json({
        success: false,
        state: trackerData?.tracker?.state,
        message: "Payment not completed"
      });
    }

    // Payment successful - update checkout
    if (!checkout.isPaid) {
      checkout.isPaid = true;
      checkout.paymentStatus = "paid";
      checkout.paidAt = new Date();
      checkout.paymentDetails = {
        safepayState: trackerData?.tracker?.state,
        ...paymentInfo,
        verifiedAt: new Date().toISOString(),
      };
      await checkout.save();

      // Create order
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: "Safepay",
        totalPrice: checkout.totalPrice,
        isPaid: true,
        paidAt: new Date(),
        isDelivered: false,
        paymentStatus: "Paid",
        orderStatus: "Pending",
        status: "processing",
        safepayTracker: tracker,
        safepayPaymentMethod: paymentInfo.paymentMethod || "Card",
        safepayCardLastFour: paymentInfo.cardLastFour,
        safepayTransactionId: paymentInfo.transactionId,
        safepayPaidAt: new Date(),
      });

      // Clear cart
      await Cart.findOneAndDelete({ user: checkout.user });

      console.log("[Safepay] Order created:", finalOrder._id);
      console.log("[Safepay] Cart cleared");

      console.log("[Safepay] ===== VERIFY SESSION COMPLETE =====\n");

      return res.json({
        success: true,
        order: finalOrder,
        paymentInfo
      });
    }

    // Already paid
    const existingOrder = await Order.findOne({ safepayTracker: tracker });
    
    console.log("[Safepay] ===== VERIFY SESSION COMPLETE =====\n");

    return res.json({
      success: true,
      order: existingOrder,
      paymentInfo,
      alreadyProcessed: true
    });

  } catch (error) {
    console.error("[Safepay] Error verifying session:", error);
    next(error);
  }
});

export default router;
