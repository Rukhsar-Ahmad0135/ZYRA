import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";
import { useState, useEffect, useRef } from "react";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectTimerRef = useRef(null);
  const redirectTriggeredRef = useRef(false);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  // Reset redirect flag when location changes
  useEffect(() => {
    setHasRedirected(false);
    redirectTriggeredRef.current = false;
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  }, [location.pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Handle redirect after 2 seconds - runs after render
  useEffect(() => {
    // Only run once on mount - use refs to track state
    if (redirectTriggeredRef.current) return;
    
    // Determine if we need to redirect
    const shouldRedirect = 
      (isLocalMode && !user && !authLoading) ||
      (!isLocalMode && !isSignedIn);
    
    if (!shouldRedirect) return;

    redirectTriggeredRef.current = true;
    const timer = setTimeout(() => {
      setHasRedirected(true);
    }, 2000);
    redirectTimerRef.current = timer;

    return () => clearTimeout(timer);
  }, [isLocalMode, user, authLoading, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  // In local mode: require legacy JWT token, otherwise redirect to Clerk login
  if (isLocalMode && !user && !authLoading) {
    if (!hasRedirected) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          Redirecting to login...
        </div>
      );
    }
    // Always redirect to Clerk login for customer authentication
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
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
    if (!hasRedirected) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          Redirecting to login...
        </div>
      );
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // If none of the above matched but we have a user, render children
  return children;
};

export default RequireAuth;
