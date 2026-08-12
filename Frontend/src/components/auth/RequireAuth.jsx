import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);

  // Wait until Clerk has finished hydrating before making any decision.
  // Without this gate, the first render can briefly see isSignedIn=false
  // and bounce the user to /login.
  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  // In production (Clerk mode), check isSignedIn
  // In local mode (USE_LOCAL_DATA=true), check if we have a user in Redux
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (!isLocalMode && !isSignedIn) {
    // Same-origin redirect target only. Pass the requested URL so we can
    // return the user to it after sign-in.
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={`/login${search}`} replace />;
  }

  // In local mode, we might not have Clerk signed in, but we could have a user in Redux
  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return children;
};

export default RequireAuth;
