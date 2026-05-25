/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState } from "react";
const UserManagment = () => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const users = [
    { _id: 123123, name: "John Doe", email: "john@example.com", role: "Admin" },
    {
      _id: 123124,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
    },
    {
      _id: 123125,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "User",
    },
  ];
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
  });
  const handlesubmit = (e) => {
    e.preventDefault();
    console.log(formData);

    //reset the form after submission
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Customer",
    });
  };
  const handleRoleChange = (userId, newRole) => {
    console.log({ id: userId, role: newRole });
  };
  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      console.log("delete user with id:", userId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      {/* add new user form */}
      <div className="p-6 rounded-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">Add New User</h3>
        <form onSubmit={handlesubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              className=" w-full p-2 border rounded"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              className=" w-full p-2 border rounded"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              className=" w-full p-2 border rounded"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Customer">Customer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Add User
          </button>
        </form>
      </div>
      {/* user list management */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                  {user.name}
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="w-full p-2 border"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  {/* <button className="text-blue-500 hover:text-blue-700">
                    Edit
                  </button> */}
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagment;
