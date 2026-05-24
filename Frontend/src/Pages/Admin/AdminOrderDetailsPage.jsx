/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const AdminOrderDetailsPage = () => {
  const { id } = useParams();
  const initialOrder = useMemo(
    () => ({
      _id: id,
      createdAt: new Date(),
      isPaid: false,
      isDelivered: false,
      paymentMethod: "Cash on Delivery",
      shippingAddress: { city: "New York", country: "USA" },
      user: { name: "John Doe" },
      orderItems: [
        {
          productId: "1",
          name: "Stylish Jacket",
          price: 29.99,
          quantity: 1,
          image: "https://picsum.photos/500/500?random=1",
        },
        {
          productId: "2",
          name: "Shirt",
          price: 20.99,
          quantity: 2,
          image: "https://picsum.photos/500/500?random=2",
        },
      ],
      totalPrice: 71.97,
    }),
    [id],
  );

  const [order, setOrder] = useState(initialOrder);

  const markAsPaid = () => {
    setOrder((prevOrder) => ({ ...prevOrder, isPaid: true }));
  };

  const markAsDelivered = () => {
    setOrder((prevOrder) => ({ ...prevOrder, isDelivered: true }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Order Details (Admin)
      </h2>
      <div className="p-4 sm:p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row justify-between mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-semibold">
              Order ID: #{order._id}
            </h3>
            <p className="text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0">
            <span
              className={`${order.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} px-3 py-1 rounded-full text-sm font-medium mb-2`}
            >
              {order.isPaid ? "Paid" : "Not Paid"}
            </span>
            <span
              className={`${order.isDelivered ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} px-3 py-1 rounded-full text-sm font-medium`}
            >
              {order.isDelivered ? "Delivered" : "Not Delivered"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div>
            <h4 className="text-lg font-semibold mb-2">Customer</h4>
            <p>{order.user.name}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Payment Info</h4>
            <p>Method: {order.paymentMethod}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Shipping Info</h4>
            <p>
              Address:{" "}
              {`${order.shippingAddress.city}, ${order.shippingAddress.country}`}
            </p>
          </div>
        </div>
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
              {order.orderItems.map((item) => (
                <tr key={item.productId} className="border-b">
                  <td className="px-4 py-2 flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg mr-4"
                    />
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-blue-500 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">${item.price}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end space-x-4">
          {!order.isPaid && (
            <button
              onClick={markAsPaid}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Mark as Paid
            </button>
          )}
          {!order.isDelivered && (
            <button
              onClick={markAsDelivered}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Mark as Delivered
            </button>
          )}
        </div>
        <Link
          to="/admin/orders"
          className="text-blue-500 hover:underline mt-4 block"
        >
          Back to All Orders
        </Link>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
