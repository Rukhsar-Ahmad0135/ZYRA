/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders } from "../../redux/slices/adminOrderSlice";

const AdminOrderListPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error, page, pages, total } = useSelector(
    (state) => state.adminOrders
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAdminOrders({ page: currentPage, pageSize: 10 }));
  }, [dispatch, currentPage]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">All Orders</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-600">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Paid</th>
                  <th className="px-4 py-2">Delivered</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">#{order._id}</td>
                      <td className="px-4 py-2">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {order.user?.name || order.user?.email || "N/A"}
                      </td>
                      <td className="px-4 py-2">${order.totalPrice?.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`${order.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {order.isPaid ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`${order.isDelivered ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {order.isDelivered ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/admin/order/${order._id}`}
                          className="text-blue-500 hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pages} ({total} total)
              </span>
              <button
                disabled={currentPage >= pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrderListPage;
