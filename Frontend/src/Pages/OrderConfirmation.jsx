/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LAST_ORDER_KEY = "zyra_last_order_v1";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const checkout = useMemo(() => {
    if (location.state?.order) {
      return location.state.order;
    }

    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [location.state]);

  const calculatEstimatedDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };

  const paymentLabel = useMemo(
    () => checkout?.paymentMethod || "Cash on Delivery",
    [checkout],
  );

  if (!checkout) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center bg-white rounded-lg">
        <h1 className="text-3xl font-bold text-emerald-700 mb-4">
          No order found
        </h1>
        <p className="text-gray-600 mb-6">
          Please place your order from the checkout page.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Thanks You for Your Order
      </h1>
      {checkout && (
        <div className="p-6 rounded-lg border">
          <div className="flex justify-between mb-20">
            {/* order id and date */}
            <div>
              <h2 className="text-xl font-semibold">
                Order ID: {checkout._id}
              </h2>
              <p className="text-gray-500">
                Order date: {new Date(checkout.createdAt).toLocaleDateString()}
              </p>
            </div>
            {/* estimated delivery date */}
            <div>
              <p className="text-emerald-700 text-sm">
                Estimated delivery: {""}
                {calculatEstimatedDelivery(checkout.createdAt)}
              </p>
            </div>
          </div>
          {/* order items */}
          <div className="mb-20">
            {checkout.checkoutItems.map((item) => (
              <div key={item.productId} className="flex items-center mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="text-md font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.color} | {item.size}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-md">${item.price}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          {/* payment and delivery info */}
          <div className="grid grid-cols-2 gap-8">
            {/* payment info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Payment</h4>
              <p className="text-gray-600 ">{paymentLabel}</p>
              <p className="text-sm text-gray-500 mt-1">
                Pay the rider on delivery.
              </p>
            </div>
            {/* delivery info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Delivery </h4>
              <p className="text-gray-600 ">
                {checkout.shippingAddress.address}
              </p>
              <p className="text-gray-600 ">
                {checkout.shippingAddress.city},{" "}
                {checkout.shippingAddress.country}
              </p>
            </div>

            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmation;
