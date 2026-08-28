/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the license file for more information.
 */
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, setUser } from "../redux/slices/authSlice";
import { updateProfile } from "../redux/slices/authSlice";
import MyOrderPage from "./MyOrderPage";
import { useClerk, useUser } from "@clerk/react";
import RequireAuth from "../components/auth/RequireAuth";
import apiClient from "../api/client.js";

const ProfileContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded } = useUser();
  const { user } = useSelector((state) => state.auth);

  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      setClerkTimedOut(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const handleLogout = async () => {
    dispatch(logout());
    await signOut();
    navigate("/");
  };

  // In local mode, bypass the Clerk loading gate entirely.
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  if (!isLoaded && !isLocalMode && !clerkTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zyra-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayName = clerkUser?.fullName || user?.name || "Customer";
  const displayEmail = clerkUser?.primaryEmailAddress?.emailAddress || user?.email || "";
  const displayPhone = clerkUser?.primaryPhoneNumber?.phoneNumber || "Not set";
  const displayRole = user?.role || "customer";
  const joinedDate = clerkUser?.createdAt
    ? new Date(clerkUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "—";

  // Profile image - use Clerk imageUrl if available, otherwise fall back to initials
  const profileImageUrl = clerkUser?.imageUrl || null;
  const hasProfileImage = !!profileImageUrl;

  // Addresses state
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });

  // Settings form state
  const [settingsFormData, setSettingsFormData] = useState({
    fullName: displayName,
    email: displayEmail,
    phoneNumber: displayPhone !== "Not set" ? displayPhone : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  // Fetch addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiClient.get("/api/users/profile");
        if (response.data.addresses) {
          setAddresses(response.data.addresses);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
    };

    if (!isLocalMode && clerkUser?.id) {
      fetchAddresses();
    } else if (isLocalMode && user?.addresses) {
      // In local mode, use addresses from Redux store (already loaded from local-store.json)
      setAddresses(user.addresses);
    }
  }, [isLocalMode, clerkUser?.id, user?.addresses]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Form handlers
  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSettingsInputChange = (e) => {
    const { name, value } = e.target;
    setSettingsFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Address handlers
  const handleAddAddress = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setFormData(address);
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await apiClient.put("/api/users/profile", {
        addresses: addresses.filter((addr) => addr._id !== addressId),
      });
      // Update Redux state and localStorage so deletion persists after refresh
      const updatedUser = { ...user, addresses: response.data.addresses || [] };
      dispatch(setUser(updatedUser));
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error("Failed to delete address:", error);
      alert("Failed to delete address. Please try again.");
    }
  };

  const handleSaveAddress = async () => {
    // Validate form
    const requiredFields = ["firstName", "lastName", "address", "city", "postalCode", "country"];
    const missingFields = requiredFields.filter((field) => !formData[field].trim());

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Generate a temporary ID for new addresses
    const addressToSave = {
      ...formData,
      _id: editingAddress?._id || `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      const updatedAddresses = editingAddress
        ? addresses.map((addr) => (addr._id === editingAddress._id ? addressToSave : addr))
        : [...addresses, addressToSave];

      const response = await apiClient.put("/api/users/profile", {
        addresses: updatedAddresses,
      });

      // Update localStorage and Redux state so data persists after refresh
      const updatedUser = { ...user, addresses: updatedAddresses };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      dispatch(setUser(updatedUser));

      setAddresses(updatedAddresses);
      setShowAddressForm(false);
      setEditingAddress(null);
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        isDefault: false,
      });
    } catch (error) {
      console.error("Failed to save address:", error);
      alert("Failed to save address. Please try again.");
    }
  };

  // Settings save handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage({ type: "", text: "" });

    try {
      const response = await apiClient.put("/api/users/profile", {
        name: settingsFormData.fullName,
        phone: settingsFormData.phoneNumber,
        addresses,
      });

      // Update local state with response data
      const updatedUser = {
        ...user,
        name: response.data.name || settingsFormData.fullName,
        phone: response.data.phone || settingsFormData.phoneNumber,
      };

      // Persist to localStorage and Redux so it survives refresh
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      dispatch(updateProfile(updatedUser));

      setSaveMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => {
        setSaveMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
              {hasProfileImage ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zyra-primary to-zyra-secondary flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(displayName)}
                </div>
              )}
            </div>
            <div>
              <p className="text-stone-500 text-sm">My Profile</p>
              <p className="text-2xl font-semibold">{displayName}</p>
            </div>
          </h1>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Profile Card */}
              <div className="p-6 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
                    {hasProfileImage ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zyra-primary to-zyra-secondary flex items-center justify-center text-white text-2xl font-bold">
                        {getInitials(displayName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-stone-900 truncate">{displayName}</h2>
                    <p className="text-stone-500 text-sm mt-1 truncate">{displayEmail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        displayRole === "admin" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"
                      }`}>
                        {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-4 space-y-1">
                {[
                  { id: "orders", label: "My Orders", icon: "📦" },
                  { id: "addresses", label: "Addresses", icon: "📍" },
                  { id: "settings", label: "Settings", icon: "⚙️" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-zyra-primary text-white shadow-lg"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Account Actions */}
              <div className="p-4 border-t border-stone-100 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <span>🏠</span>
                  <span>Back to Shop</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <span>📦</span>
                    My Orders
                  </h2>
                </div>
                <MyOrderPage />
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <span>📍</span>
                    Saved Addresses
                  </h2>
                  <button
                    onClick={handleAddAddress}
                    className="px-4 py-2 bg-zyra-primary text-white rounded-xl text-sm font-medium hover:bg-zyra-primary/90 transition-colors"
                  >
                    + Add New Address
                  </button>
                </div>

                {/* Address Form */}
                {showAddressForm && (
                  <div className="p-6 border-b border-stone-100 bg-stone-50">
                    <h3 className="text-lg font-semibold text-stone-900 mb-4">
                      {editingAddress ? "Edit Address" : "Add New Address"}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-2">Address *</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Postal Code *</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Country *</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleFormInputChange}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zyra-primary"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleFormInputChange}
                            className="w-4 h-4 text-zyra-primary border-stone-300 rounded focus:ring-zyra-primary"
                          />
                          <span className="text-sm text-stone-700">Set as default address</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSaveAddress}
                        className="px-6 py-2 bg-zyra-primary text-white rounded-lg font-medium hover:bg-zyra-primary/90 transition-colors"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Addresses List */}
                <div className="p-6">
                  {addresses.length > 0 ? (
                    <div className="grid gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-stone-900">
                                  {address.firstName} {address.lastName}
                                </h3>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-600 text-sm mb-1">{address.address}</p>
                              <p className="text-stone-600 text-sm mb-1">
                                {address.city}, {address.postalCode}
                              </p>
                              <p className="text-stone-600 text-sm mb-1">{address.country}</p>
                              {address.phone && (
                                <p className="text-stone-600 text-sm">📞 {address.phone}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="p-2 text-stone-600 hover:text-zyra-primary hover:bg-stone-50 rounded-lg transition-colors"
                                title="Edit address"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address._id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete address"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-stone-500 py-12">
                      <div className="text-4xl mb-3">📍</div>
                      <p className="text-stone-600">No saved addresses yet</p>
                      <p className="text-sm text-stone-400 mt-1">Add an address to speed up checkout</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm">
                <div className="p-6 border-b border-stone-100">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <span>⚙️</span>
                    Account Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Save Message */}
                  {saveMessage.text && (
                    <div
                      className={`p-4 rounded-lg mb-4 ${
                        saveMessage.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-red-50 border border-red-200 text-red-800"
                      }`}
                    >
                      {saveMessage.text}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={settingsFormData.fullName}
                        onChange={handleSettingsInputChange}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-zyra-primary focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={settingsFormData.email}
                        disabled
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-500 bg-stone-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-stone-400 mt-1">Email cannot be changed through this form</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={settingsFormData.phoneNumber}
                      onChange={handleSettingsInputChange}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-zyra-primary focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="px-6 py-3 bg-zyra-primary text-white rounded-xl font-medium hover:bg-zyra-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-6 border-t border-stone-100 bg-red-50 rounded-b-3xl">
                  <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span>⚠️</span>
                    Danger Zone
                  </h3>
                  <p className="text-red-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 hover:border-red-400 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const Profile = () => (
  <RequireAuth>
    <ProfileContent />
  </RequireAuth>
);

export default Profile;