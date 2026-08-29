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

  // Redirect to login if not authenticated — run once per mount via ref
  useEffect(() => {
    if (hasRedirected.current) return;

    const shouldRedirect =
      (isLocalMode && !user && !authLoading) ||
      (!isLocalMode && !isSignedIn);

    if (!shouldRedirect) return;

    hasRedirected.current = true;
    const redirectUrl = `/login?redirect=${encodeURIComponent(
      location.pathname + location.search
    )}`;

    // Use setTimeout to ensure the redirect happens after current render cycle
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 0);
  }, [isLocalMode, user, authLoading, isSignedIn, location]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  // In local mode: require legacy JWT token, otherwise redirect to Clerk login
  if (isLocalMode && !user && !authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Redirecting to login...
      </div>
    );
  }

  // In local mode: Clerk says signed in but no Redux user yet + still loading
  if (isLocalMode && isSignedIn && !user && authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  // In Clerk mode (production): if Clerk says user is signed in, allow access
  if (!isLocalMode && isSignedIn) {
    return children;
  }

  // In Clerk mode: not signed in
  if (!isLocalMode && !isSignedIn) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Redirecting to login...
      </div>
    );
  }

  // If none of the above matched but we have a user, render children
  return children;
};

export default RequireAuth;
