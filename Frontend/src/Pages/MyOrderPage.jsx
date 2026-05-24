/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const MyOrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Fetch orders data
    const timer = setTimeout(() => {
      const mockOrders = [
        {
          id: 12345,
          createdAt: new Date(),
          shippingAddress: { city: "New York", country: "USA" },
          ordersItems: [
            {
              name: "Product 1",
              image: "https://picsum.photos/500/500?random=1",
            },
          ],
          totalPrice: 99.99,
          isPaid: true,
        },
        {
          id: 45678,
          createdAt: new Date(),
          shippingAddress: { city: "New York", country: "USA" },
          ordersItems: [
            {
              name: "Product 2",
              image: "https://picsum.photos/500/500?random=2",
            },
          ],
          totalPrice: 99.99,
          isPaid: true,
        },
      ];
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };
  const formatDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">My Orders</h2>
      <div className="relative shadow-md sm:rounded-lg overflow-hidden">
        <table className="min-w-full text-left text-gray-500">
          <thead>
            <tr>
              <th className="py-2 px-4 sm:py-3">Image</th>
              <th className="py-2 px-4 sm:py-3">Order ID</th>
              <th className="py-2 px-4 sm:py-3">Created</th>
              <th className="py-2 px-4 sm:py-3">Shipping Adress</th>
              <th className="py-2 px-4 sm:py-3">Items</th>
              <th className="py-2 px-4 sm:py-3">Price</th>
              <th className="py-2 px-4 sm:py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 px-4 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const firstItem = order.ordersItems?.[0];

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order._id)}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2 px-2 sm:py-4 sm:px-4">
                      {firstItem ? (
                        <img
                          src={firstItem.image}
                          alt={firstItem.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                    <td className="py-3 px-4">
                      {order.shippingAddress?.city || "-"},{" "}
                      {order.shippingAddress?.country || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {order.ordersItems?.length ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      ${Number(order.totalPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {order.isPaid ? (
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-sm font-medium">
                          Paid
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 py-1 px-2 rounded-full text-sm font-medium">
                          Not Paid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                  You have no orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrderPage;
