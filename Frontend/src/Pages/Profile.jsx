/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the license file for more information.
 */
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import MyOrderPage from "./MyOrderPage";
import { useClerk, useUser, UserProfile } from "@clerk/react";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded } = useUser();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    dispatch(logout());
    await signOut();
    navigate("/login");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Clerk profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {clerkUser?.fullName ||
              clerkUser?.username ||
              user?.name ||
              "Guest"}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {clerkUser?.primaryEmailAddress?.emailAddress ||
              user?.email ||
              "No email available"}
          </p>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Phone</dt>
              <dd className="text-stone-800">
                {clerkUser?.primaryPhoneNumber?.phoneNumber || "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Role</dt>
              <dd className="text-stone-800 capitalize">
                {user?.role || "customer"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Joined</dt>
              <dd className="text-stone-800">
                {clerkUser?.createdAt
                  ? new Date(clerkUser.createdAt).toLocaleDateString()
                  : user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Sign out
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            >
              Back to shop
            </button>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
            <UserProfile routing="path" path="/profile" />
          </div>
        </aside>
        <div className="grow space-y-8">
          <MyOrderPage />
        </div>
      </div>
    </div>
  );
};

export default Profile;
