/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { Link } from "react-router-dom";
const AdminHomePage = () => {
  const orders = [
    {
      _id: 123123,
      user: {
        name: "John Doe",
      },
      totalPrice: 99.99,
      status: "Processing",
    },

    {
      _id: 123231,
      user: {
        name: "David",
      },
      totalPrice: 9.99,
      status: "Processing",
    },
    {
      _id: 123432,
      user: {
        name: "Zaam",
      },
      totalPrice: 65.99,
      status: "Done",
    },
    {
      _id: 123322,
      user: {
        name: "John ",
      },
      totalPrice: 44.99,
      status: "Done",
    },
    {
      _id: 1232321,
      user: {
        name: "Jan",
      },
      totalPrice: 34.99,
      status: "Processing",
    },
  ];
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className=" p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Revenue</h2>
          <p className="text-2xl ">$1000</p>
        </div>

        <div className=" p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-2xl ">200</p>
          <Link to="/admin/order" className="text-blue-500 hover:underline">
            Manage Orders
          </Link>
        </div>
        <div className=" p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Total Products</h2>
          <p className="text-2xl ">100</p>
          <Link to="/admin/product" className="text-blue-500 hover:underline">
            Manage Products
          </Link>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4">{order._id}</td>
                    <td className="px-4">{order.user.name}</td>
                    <td className="px-4">${order.totalPrice}</td>
                    <td className="px-4">{order.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No recent order found.
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
