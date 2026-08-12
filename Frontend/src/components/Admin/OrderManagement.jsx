/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminOrders, updateOrderStatus, deleteOrder } from "../../redux/slices/adminOrderSlice";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];


const OrderManagement = () => {
  const dispatch = useDispatch();
  const { orders, loading, error, page, pages, total, totalSales } = useSelector(
    (state) => state.adminOrders
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchAdminOrders({ page: currentPage, pageSize: 10, status: statusFilter }));
  }, [dispatch, currentPage, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ id, status: newStatus })).unwrap();
      toast.success("Order status updated");
      dispatch(fetchAdminOrders({ page: currentPage, pageSize: 10, status: statusFilter }));
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await dispatch(deleteOrder(id)).unwrap();
      toast.success("Order deleted");
      dispatch(fetchAdminOrders({ page: currentPage, pageSize: 10, status: statusFilter }));
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="text-sm text-gray-600">
          Total Orders: <span className="font-semibold">{total}</span> | Total Sales:{" "}
          <span className="font-semibold">${totalSales.toFixed(2)}</span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      ) : (
        <>
          <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="min-w-full text-left text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Actions</th>
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
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs">{order._id}</td>
                      <td className="p-4">{order.user?.name || order.user?.email || "N/A"}</td>
                      <td className="p-4">${order.totalPrice?.toFixed(2)}</td>
                      <td className="p-4">
                        <select
                          value={order.status || "processing"}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="p-1 border rounded"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">{order.isPaid ? "Yes" : "No"}</td>
                      <td className="p-4">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td className="p-4 flex gap-2">
                        <Link
                          to={`/admin/order/${order._id}`}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
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

export default OrderManagement;
