/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";

const AdminHomePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/api/admin/stats");
        setStats(response.data);
      } catch (err) {
        const status = err?.status || err?.response?.status;
        if (status === 403 || status === 401) {
          // Token invalid/expired - redirect to local login with redirect back to admin
          navigate("/local-login?redirect=/admin", { replace: true });
          return;
        }
        setError(err?.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Failed to load dashboard stats"}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Revenue", value: `$${stats.revenue?.toFixed(2) || "0.00"}` },
    { label: "Total Orders", value: stats.totalOrders || 0 },
    { label: "Total Products", value: stats.totalProducts || 0 },
    { label: "Total Users", value: stats.totalUsers || 0 },
    { label: "Customers", value: stats.totalCustomers || 0 },
    { label: "Admins", value: stats.totalAdmins || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="p-4 rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-semibold">{card.label}</h2>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats.orderStatus || {}).map(([status, count]) => (
          <div key={status} className="p-4 rounded-lg shadow-md bg-gray-50">
            <h3 className="text-sm font-medium text-gray-600 capitalize">{status}</h3>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-sm uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Total Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 font-mono text-xs">{order._id}</td>
                    <td className="px-4">{order.user?.name || order.user?.email || "N/A"}</td>
                    <td className="px-4">${order.totalPrice?.toFixed(2)}</td>
                    <td className="px-4 capitalize">{order.status}</td>
                    <td className="px-4">
                      <Link
                        to={`/admin/order/${order._id}`}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
