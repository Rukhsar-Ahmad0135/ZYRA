/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useCart } from "./useCart";
import {
  createCheckoutSession,
  finalizeCheckout,
} from "../../redux/slices/checkoutSlice";
import { fetchCart } from "../../redux/slices/cartSlice";

import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, totalPrice, clearCart } = useCart();
  const { user, guestId } = useSelector((state) => state.auth);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        name: item.name,
        color: item.color,
        size: item.size,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image,
      })),
    [items],
  );

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Check if user is logged in (not guest)
  const isLoggedIn = !!user;

  // Show admin warning when admin tries to checkout
  useEffect(() => {
    if (isAdmin) {
      setShowAdminWarning(true);
    }
  }, [isAdmin]);

  const handleAdminLogout = () => {
    // Dispatch logout to clear user state
    dispatch({ type: "auth/logout" });
    // Redirect to admin login page
    navigate("/admin");
  };

  const handleCloseAdminWarning = () => {
    setShowAdminWarning(false);
    // Redirect to home page
    navigate("/");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Prevent admin from placing order
    if (isAdmin) {
      setShowAdminWarning(true);
      return;
    }

    // Redirect guest users to login
    if (!isLoggedIn) {
      toast.error("Please login or register to checkout");
      navigate("/login?redirect=/checkout");
      return;
    }

    if (!items.length) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      const shippingPayload = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      };

      // 1) Create the checkout session on the backend
      const checkoutResult = await dispatch(
        createCheckoutSession({
          checkoutItems: orderItems,
          shippingAddress: shippingPayload,
          paymentMethod: "Cash on Delivery",
          totalPrice,
          userId: user?._id || user?.id,
          guestId,
        }),
      ).unwrap();

      // 2) Finalize checkout -> creates the order.
      // For Cash on Delivery, the order stays paymentStatus = "Pending"
      // until an admin marks it Paid on delivery (see Step 12).

      const finalOrder = await dispatch(
        finalizeCheckout(checkoutResult._id),
      ).unwrap();

      // 3) Refresh the local cart from the server. The backend may have
      // just merged a guest cart into the user cart during checkout
      // creation, so we re-pull to stay in sync.
      try {
        await dispatch(
          fetchCart({
            userId: user?._id || user?.id,
            guestId,
          }),
        ).unwrap();
      } catch {
        // best-effort
      }

      // 4) Clear local cart
      clearCart();
      navigate("/confirmation", { state: { order: finalOrder } });
      toast.success("Order placed successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const isCartEmpty = items.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Admin Warning Modal */}
      {showAdminWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Admin Checkout Not Allowed</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You are currently logged in as an admin. Please logout as admin and login/register as a customer to place an order.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAdminLogout}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
              >
                Logout as Admin
              </button>
              <button
                onClick={handleCloseAdminWarning}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* left section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Checkout</h2>
        <form onSubmit={handlePlaceOrder} className="">
          <h3 className="text-lg mb-4">Delivery</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Postal Code</label>
              <input
                type="text"
                value={shippingAddress.postalCode}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    postalCode: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Country</label>
            <input
              type="text"
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  country: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone No</label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Payment Method
            </h3>
            <p className="mt-2 text-sm text-amber-900">
              Cash on Delivery only. Pay when your order arrives at your door.
            </p>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={isPlacingOrder || isCartEmpty || isAdmin || !isLoggedIn}
              className="w-full bg-black text-white py-3 rounded disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingOrder
                ? "Placing Order..."
                : isCartEmpty
                ? "Cart is Empty"
                : isAdmin
                ? "Logout as Admin First"
                : !isLoggedIn
                ? "Login to Checkout"
                : "Place Cash on Delivery Order"}
            </button>
          </div>
        </form>
      </div>
      {/* Right section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg  mb-4">Order Summary</h3>
        <div className="space-y-4">
          {orderItems.map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b"
            >
              <div className="flex items-center gap-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-24 object-cover rounded"
                />
                <div>
                  <h3 className="text-md font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm">Size: {product.size}</p>
                  <p className="text-gray-500 text-sm">
                    Color: {product.color}
                  </p>
                </div>
              </div>
              <p className="text-xl font-semibold">
                ${(product.price * product.quantity).toLocaleString()}
              </p>
            </div>
          ))}
          {isCartEmpty && (
            <p className="text-sm text-gray-500">Your cart is empty.</p>
          )}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Subtotal</p>
          <p>${totalPrice.toLocaleString()}</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Shipping</p>
          <p>Free</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
          <p>Total</p>
          <p>${totalPrice.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
