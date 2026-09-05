import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";
import { useEffect, useRef } from "react";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const hasRedirected = useRef(false);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  // Determine redirect URL
  const redirectUrl = `/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  // In local mode: require legacy JWT token
  if (isLocalMode) {
    if (!user && !authLoading) {
      return <Navigate to={redirectUrl} replace />;
    }
    if (isSignedIn && !user && authLoading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          Loading profile...
        </div>
      );
    }
    // User is authenticated in local mode
    return children;
  }

  // In Clerk mode (production): check Clerk's isSignedIn state
  if (isSignedIn) {
    return children;
  }

  // Not signed in Clerk mode - redirect to login
  return <Navigate to={redirectUrl} replace />;
};

export default RequireAuth;
