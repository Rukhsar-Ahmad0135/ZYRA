import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";
import { useState, useEffect } from "react";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const [hasRedirected, setHasRedirected] = useState(false);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  // Reset redirect flag when location changes
  useEffect(() => {
    setHasRedirected(false);
  }, [location.pathname]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  // In local mode: require legacy JWT token, otherwise redirect to login
  if (isLocalMode && !user && !authLoading) {
    if (!hasRedirected) {
      setHasRedirected(true);
      const target = location.pathname + location.search;
      const search = `?redirect=${encodeURIComponent(target)}`;
      return <Navigate to={`/local-login${search}`} replace />;
    }
    // Already redirected and still no user/profile, keep showing loading
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  // In local mode: Clerk says signed in but no Redux user yet + still loading
  // → show "Loading profile..." instead of redirecting (gives fetchProfile time to complete)
  if (isLocalMode && isSignedIn && !user && authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  // In Clerk mode (production): if Clerk says user is signed in, but Redux user isn't loaded yet,
  // wait for the profile fetch to complete (authLoading) instead of showing "Loading profile..."
  if (!isLocalMode && isSignedIn && !user && authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  // In Clerk mode: signed in but no user in Redux and not loading — allow access
  // (user data will populate shortly via async fetchProfile)
  if (!isLocalMode && isSignedIn && !user && !authLoading) {
    // Allow access - user data will populate shortly
    return children;
  }

  // If none of the above matched but we have a user, render children
  return children;
};

export default RequireAuth;
