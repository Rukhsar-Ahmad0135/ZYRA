/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const order = useMemo(() => {
    if (location.state?.order) {
      return location.state.order;
    }
    return null;
  }, [location.state]);

  const calculatEstimatedDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString();
  };

  const paymentLabel = order?.paymentMethod || "Cash on Delivery";

  // Support both checkoutItems (checkout session) and orderItems (final order)
  const items = order?.orderItems || order?.checkoutItems || [];

  if (!order) {
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
        Thank You for Your Order
      </h1>
      <div className="p-6 rounded-lg border">
        <div className="flex justify-between mb-20">
          <div>
            <h2 className="text-xl font-semibold">
              Order ID: {order._id}
            </h2>
            <p className="text-gray-500">
              Order date: {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-emerald-700 text-sm">
              Estimated delivery:{" "}
              {calculatEstimatedDelivery(order.createdAt)}
            </p>
          </div>
        </div>
        {/* order items */}
        <div className="mb-20">
          {items.map((item, idx) => (
            <div key={item.productId || idx} className="flex items-center mb-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-md mr-4"
              />
              <div>
                <h4 className="text-md font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-500">
                  {item.color || ""} {item.color && item.size ? "|" : ""} {item.size || ""}
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
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment</h4>
            <p className="text-gray-600">{paymentLabel}</p>
            <p className="text-sm text-gray-500 mt-1">
              Pay the rider on delivery.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Delivery</h4>
            {order.shippingAddress && (
              <>
                <p className="text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.country}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
