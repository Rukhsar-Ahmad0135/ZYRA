import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/react";

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useSelector((state) => state.auth.user);

  // Wait for Clerk to finish hydrating before deciding.
  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Checking admin access...
      </div>
    );
  }

  // In production (Clerk mode), check isSignedIn
  // In local mode (USE_LOCAL_DATA=true), check if we have a user in Redux
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (!isLocalMode && !isSignedIn) {
    const target = location.pathname + location.search;
    const search = `?redirect=${encodeURIComponent(target)}`;
    return <Navigate to={`/login${search}`} replace />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading admin profile...
      </div>
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;
