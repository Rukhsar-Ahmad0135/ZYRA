import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
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
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={isLocalMode ? `/local-login${search}` : `/login${search}`} replace />;
  }

  return children;
};

export default RequireAdmin;
