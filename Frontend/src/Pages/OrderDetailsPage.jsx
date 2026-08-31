/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetails, resetOrderDetails } from "../redux/slices/orderSlice";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
    return () => dispatch(resetOrderDetails());
  }, [dispatch, id]);

  if (loading && !orderDetails) {
    return <div className="max-w-7xl mx-auto p-4 sm:p-6 text-center py-16 text-gray-500">Loading order...</div>;
  }

  if (error && !orderDetails) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link to="/my-orders" className="text-blue-500 hover:underline mt-4 block">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!orderDetails) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Order Details</h2>
      <div className="p-4 sm:p-6 rounded-lg border">
        {/* order info */}
        <div className="flex flex-col sm:flex-row justify-between mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-semibold">
              Order ID: #{orderDetails._id}
            </h3>
            <p className="text-gray-600">
              {orderDetails.createdAt
                ? new Date(orderDetails.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0">
            <span
              className={`${orderDetails.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} px-3 py-1 rounded-full text-sm font-medium mb-2`}
            >
              {orderDetails.isPaid ? "Approved" : "Pending"}
            </span>
            <span
              className={`${orderDetails.isDelivered ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} px-3 py-1 rounded-full text-sm font-medium mb-2`}
            >
              {orderDetails.isDelivered ? "Delivered" : "Not Delivered"}
            </span>
          </div>
        </div>
        {/* customer, payment, shipping info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment Info</h4>
            <p>Payment Method: {orderDetails.paymentMethod}</p>
            <p>Status: {orderDetails.isPaid ? "Paid" : "Not Paid"}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Shipping Info</h4>
            {orderDetails.shippingAddress && (
              <p>
                Address: {orderDetails.shippingAddress.address},{" "}
                {orderDetails.shippingAddress.city},{" "}
                {orderDetails.shippingAddress.postalCode},{" "}
                {orderDetails.shippingAddress.country}
              </p>
            )}
          </div>
        </div>
        {/* product list */}
        <div className="overflow-x-auto">
          <h4 className="text-lg font-semibold mb-4">Products</h4>
          <table className="min-w-full text-gray-600 mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderDetails.orderItems?.map((item, idx) => (
                <tr key={item._id || idx} className="border-b">
                  <td className="px-4 py-2 flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg mr-4"
                    />
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-blue-500 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">${item.price}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">
                    ${item.price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Back to orders */}
        <Link to="/my-orders" className="text-blue-500 hover:underline">
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
