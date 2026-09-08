import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useClerk } from "@clerk/react";
import { toast } from "sonner";
import { useEffect } from "react";
import { logout } from "../../redux/slices/authSlice";

const RequireAdmin = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  // In local mode, also check localStorage as fallback for user data
  const getLocalUser = () => {
    try {
      const raw = localStorage.getItem("userInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const effectiveUser = user || (isLocalMode ? getLocalUser() : null);

  // Auto logout non-admin users when trying to access admin routes
  useEffect(() => {
    if (effectiveUser && !["admin", "superadmin"].includes(effectiveUser.role)) {
      toast.error("Logging you out from customer account...");
      dispatch(logout());
      signOut().catch(() => {});
    }
  }, [effectiveUser]);

  if (!isLocalMode && !isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking admin access...
      </div>
    );
  }

  if (!isLocalMode && !isSignedIn) {
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={`/login${search}`} replace />;
  }

  if (isLocalMode && !effectiveUser) {
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={`/local-login${search}`} replace />;
  }

  // In Clerk mode: if Clerk says user is signed in, but Redux user isn't loaded yet,
  // wait for the profile fetch to complete (authLoading) instead of showing "Loading admin profile..."
  if (!isLocalMode && isSignedIn && !user && authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading admin profile...
      </div>
    );
  }

  // If Clerk says signed in but no user in Redux and not loading, something went wrong
  // but we should still allow access - the profile will load async
  if (!isLocalMode && isSignedIn && !user && !authLoading) {
    return children;
  }

  if (!effectiveUser) {
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={isLocalMode ? `/local-login${search}` : `/login${search}`} replace />;
  }

  if (!["admin", "superadmin"].includes(effectiveUser.role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
          <p className="text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm">
            Your account does not have admin access. If you believe this is an
            error, contact support or try the admin login.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/" className="font-medium underline">Go to store</Link>
            <Link to="/local-login" className="font-medium underline">Admin login</Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAdmin;
