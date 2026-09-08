/*
 * Copyright (c) - All Rights Reserved.
 *
 * Safepay Payment Success Page
 * Handles successful payment redirects from Safepay
 * 
 * SECURITY: Payment is ALWAYS verified server-side before marking as PAID
 * The browser redirect alone is NOT trusted
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "../redux/slices/cartSlice";
import apiClient from "../api/client.js";
import { toast } from "sonner";
import { formatPrice } from "../utils/priceUtils";

const SafepaySuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const userId = user?._id || user?.id;
        if (!userId) {
          setError("User not found");
          setStatus("error");
          return;
        }

        console.log("[Safepay Success] Starting server-side payment verification");

        // Find the pending checkout with safepay tracker
        const pendingCheckoutRes = await apiClient.get("/api/checkout", {
          params: { userId },
        });

        const pendingCheckouts = pendingCheckoutRes.data?.checkouts || [];
        const safepayCheckout = pendingCheckouts.find(c => c.safepayTracker && !c.isFinalized);

        if (safepayCheckout) {
          console.log("[Safepay Success] Found pending checkout:", safepayCheckout._id);
          console.log("[Safepay Success] Tracker:", safepayCheckout.safepayTracker);

          try {
            // CRITICAL: Use server-side verification endpoint that verifies with Safepay
            // This is NOT trusting the browser redirect - it verifies with Safepay server
            const verifyRes = await apiClient.post("/api/safepay/verify-session", {
              checkoutId: safepayCheckout._id,
              tracker: safepayCheckout.safepayTracker,
            });

            console.log("[Safepay Success] Server verification result:", verifyRes.data);

            if (verifyRes.data?.success) {
              setOrder(verifyRes.data.order);
              await dispatch(fetchCart({ userId, guestId: null }));
              setStatus("success");
              toast.success("Payment verified! Order placed.");
              
              setTimeout(() => {
                navigate("/confirmation", { state: { order: verifyRes.data.order } });
              }, 2000);
              return;
            } else {
              console.log("[Safepay Success] Payment not yet completed:", verifyRes.data?.message);
              setError(verifyRes.data?.message || "Payment not completed");
              setStatus("pending");
              return;
            }
          } catch (verifyErr) {
            console.error("[Safepay Success] Verification error:", verifyErr);
            // Don't finalize here - the webhook should handle it
            setError("Could not verify payment with Safepay");
            setStatus("error");
            return;
          }
        }

        // No pending checkout - check if order was already created via webhook
        console.log("[Safepay Success] No pending checkout found, checking for existing orders...");
        
        const ordersRes = await apiClient.get("/api/orders/my-orders");
        const recentOrders = ordersRes.data || [];
        const latestOrder = recentOrders[0];

        if (latestOrder && latestOrder.safepayTracker) {
          console.log("[Safepay Success] Found existing Safepay order:", latestOrder._id);
          setOrder(latestOrder);
          await dispatch(fetchCart({ userId, guestId: null }));
          setStatus("success");
          toast.success("Payment verified! Order retrieved.");
          
          setTimeout(() => {
            navigate("/confirmation", { state: { order: latestOrder } });
          }, 2000);
        } else {
          console.log("[Safepay Success] No order found");
          setStatus("no-order");
          toast.warning("Payment may not have completed. Contact support if charged.");
        }
      } catch (err) {
        console.error("[Safepay Success] Error:", err);
        setError(err?.response?.data?.message || err.message || "Verification failed");
        setStatus("error");
        toast.error("Payment verification failed");
      }
    };

    if (user) {
      processPayment();
    }
  }, [user, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">
              Please wait while we verify your payment with Safepay servers.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Do not close this window.
            </p>
          </>
        )}

        {status === "success" && order && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been placed successfully.
            </p>
            <div className="bg-stone-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Order Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(order.totalPrice)}
              </p>
            </div>
            <p className="text-sm text-gray-500">Redirecting to confirmation...</p>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">
              {error || "Your payment is being processed. Please wait."}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              If payment was completed, it will be reflected shortly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              Refresh
            </button>
          </>
        )}

        {status === "no-order" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment May Not Have Completed</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find a completed order. If you were charged, please contact support.
            </p>
            <button
              onClick={() => navigate("/my-orders")}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              View My Orders
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">
              {error || "We couldn't verify your payment. Please contact support."}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/checkout")}
                className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/my-orders")}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                My Orders
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafepaySuccess;
