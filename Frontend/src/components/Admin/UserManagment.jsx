/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, addUser, updateUser, deleteUser } from "../../redux/slices/adminSlice";
import { toast } from "sonner";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, error, page, pages, total } = useSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers({ page: currentPage, pageSize: 10, search }));
  }, [dispatch, currentPage, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser._id, name: formData.name, email: formData.email, role: formData.role })).unwrap();
        toast.success("User updated successfully");
      } else {
        await dispatch(addUser(formData)).unwrap();
        toast.success("User created successfully");
      }
      resetForm();
      dispatch(fetchUsers({ page: currentPage, pageSize: 10, search }));
    } catch (err) {
      toast.error(err?.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "customer" });
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success("User deleted successfully");
      dispatch(fetchUsers({ page: currentPage, pageSize: 10, search }));
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(updateUser({ id: userId, role: newRole })).unwrap();
      toast.success("Role updated");
      dispatch(fetchUsers({ page: currentPage, pageSize: 10, search }));
    } catch (err) {
      toast.error(err?.message || "Failed to update role");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Add/Edit User Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
        <h3 className="text-xl font-semibold mb-4">
          {editingUser ? "Edit User" : "Add New User"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                className="w-full p-2 border rounded"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                className="w-full p-2 border rounded"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Password {editingUser && "(leave blank to keep)"}</label>
              <input
                className="w-full p-2 border rounded"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? "Saving..." : editingUser ? "Update User" : "Add User"}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading users...</div>
      ) : (
        <>
          {/* User Table */}
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                        {user.name}
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="w-full p-1 border rounded"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          onClick={() => handleDelete(user._id)}
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

          {/* Pagination */}
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

export default UserManagement;
