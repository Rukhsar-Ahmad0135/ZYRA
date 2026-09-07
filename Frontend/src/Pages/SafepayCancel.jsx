/*
 * Copyright (c) - All Rights Reserved.
 *
 * Safepay Payment Cancel Page
 * Handles cancelled payment redirects from Safepay
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "../redux/slices/cartSlice";
import apiClient from "../api/client.js";
import { toast } from "sonner";

const SafepayCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [checkoutCleared, setCheckoutCleared] = useState(false);

  useEffect(() => {
    const clearPendingCheckout = async () => {
      if (!user || checkoutCleared) return;

      try {
        const userId = user?._id || user?.id;
        const pendingCheckoutRes = await apiClient.get("/api/checkout", {
          params: { userId },
        });

        const pendingCheckouts = pendingCheckoutRes.data?.checkouts || [];
        const safepayCheckout = pendingCheckouts.find(c => c.safepayTracker && !c.isFinalized && !c.isPaid);

        if (safepayCheckout) {
          await apiClient.delete(`/api/checkout/${safepayCheckout._id}`);
        }

        await dispatch(fetchCart({ userId, guestId: null }));
        setCheckoutCleared(true);
        toast.info("Payment cancelled. Your cart is still available.");
      } catch (err) {
        console.error("Error clearing checkout:", err);
      }
    };

    clearPendingCheckout();
  }, [user, dispatch, checkoutCleared]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made to your card.
        </p>

        <div className="bg-stone-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-500 mb-2">What would you like to do?</p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              Try again with the same card
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              Use a different payment method
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              Continue shopping
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/checkout")}
            className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafepayCancel;
