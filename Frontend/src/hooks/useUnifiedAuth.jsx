import { useContext, useState, useEffect } from "react";
import { useAuth as useRealAuth, useUser as useRealUser, useClerk as useRealClerk } from "@clerk/react";
import { useMockClerk } from "../context/MockClerkContext.jsx";

/**
 * Unified auth hook that works in both Clerk (production) and local mode.
 * Returns the same interface as Clerk's useAuth.
 */
export const useAuth = () => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (isLocalMode) {
    const { mockAuth } = useMockClerk();
    return mockAuth;
  }
  
  return useRealAuth();
};

/**
 * Unified user hook that works in both Clerk (production) and local mode.
 * Returns the same interface as Clerk's useUser.
 */
export const useUser = () => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (isLocalMode) {
    const { mockUser, mockClerkUser } = useMockClerk();
    return mockClerkUser;
  }
  
  return useRealUser();
};

/**
 * Unified clerk hook for signOut etc.
 */
export const useClerk = () => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (isLocalMode) {
    const { signOut } = useMockClerk();
    return { signOut };
  }
  
  return useRealClerk();
};

/**
 * Component to show user button - only in production
 */
export const UserButton = ({ children, ...props }) => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  
  if (isLocalMode) {
    return children || null;
  }
  
  // In production, render the real Clerk UserButton
  return (
    <RealUserButton {...props} />
  );
};

// Separate component for real Clerk UserButton
const RealUserButton = ({ children, ...props }) => {
  const [UserButtonComponent, setUserButtonComponent] = useState(null);
  
  useEffect(() => {
    import("@clerk/react").then(({ UserButton }) => {
      setUserButtonComponent(UserButton);
    });
  }, []);
  
  if (!UserButtonComponent) return children || null;
  
  return <UserButtonComponent {...props} />;
};

/**
 * Conditional render - only in production
 * Supports render prop pattern: <ClerkOnly>{({ user }) => <div>...</div>}</ClerkOnly>
 */
export const ClerkOnly = ({ children }) => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  if (isLocalMode) return null;
  
  // Support render prop pattern
  if (typeof children === "function") {
    return (
      <RealClerkOnlyRender children={children} />
    );
  }
  return <>{children}</>;
};

/**
 * Conditional render - only in local mode
 * Supports render prop pattern: <LocalOnly>{({ user }) => <div>...</div>}</LocalOnly>
 */
export const LocalOnly = ({ children }) => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  if (!isLocalMode) return null;
  
  // Support render prop pattern
  if (typeof children === "function") {
    return (
      <RealLocalOnlyRender children={children} />
    );
  }
  return <>{children}</>;
};

// Separate components to handle dynamic imports properly
// Clerk version - uses useUser hook at top level (valid)
const RealClerkOnlyRender = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useRealAuth();
  
  if (typeof children === "function") {
    return children({ user, isLoaded, isSignedIn });
  }
  return <>{children}</>;
};

// Local version - uses useMockClerk hook at top level (valid)
const RealLocalOnlyRender = ({ children }) => {
  const { mockUser, mockClerkUser } = useMockClerk();
  
  if (typeof children === "function") {
    return children({ user: mockUser, ...mockClerkUser });
  }
  return <>{children}</>;
};

/**
 * Conditional render - only when NOT signed in (Clerk production)
 * Supports render prop pattern: <ClerkNotOnly>{({ isSignedIn, isLoaded }) => <div>...</div>}</ClerkNotOnly>
 */
export const ClerkNotOnly = ({ children }) => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  if (isLocalMode) return null;
  
  if (typeof children === "function") {
    return (
      <RealClerkNotOnlyRender children={children} />
    );
  }
  return <>{children}</>;
};

/**
 * Conditional render - only when NOT logged in (local mode)
 * Supports render prop pattern: <LocalNotOnly>{({ user }) => <div>...</div>}</LocalNotOnly>
 */
export const LocalNotOnly = ({ children }) => {
  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";
  if (!isLocalMode) return null;
  
  if (typeof children === "function") {
    return (
      <RealLocalNotOnlyRender children={children} />
    );
  }
  return <>{children}</>;
};

// Clerk not-only render
const RealClerkNotOnlyRender = ({ children }) => {
  const { isLoaded, isSignedIn } = useRealAuth();
  
  if (!isLoaded) return null;
  
  if (typeof children === "function") {
    return children({ isSignedIn, isLoaded });
  }
  return isSignedIn ? null : <>{children}</>;
};

// Local not-only render
const RealLocalNotOnlyRender = ({ children }) => {
  const { mockUser } = useMockClerk();
  
  if (typeof children === "function") {
    return children({ user: mockUser });
  }
  return mockUser ? null : <>{children}</>;
};