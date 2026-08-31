import { createContext, useContext, useState, useEffect, useMemo } from "react";

const MockClerkContext = createContext(null);

export const useMockClerk = () => {
  const context = useContext(MockClerkContext);
  if (!context) {
    throw new Error("useMockClerk must be used within MockClerkProvider");
  }
  return context;
};

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const MockClerkProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUserFromStorage());
  const [isLoaded, setIsLoaded] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(!!getUserFromStorage());

  // Sync with localStorage changes (e.g., login in another tab, or loginUser thunk)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = getUserFromStorage();
      setUser(storedUser);
      setIsSignedIn(!!storedUser);
    };

    // Listen for storage events (cross-tab)
    window.addEventListener("storage", handleStorageChange);
    
    // Also poll for same-tab changes (when loginUser thunk updates localStorage)
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getToken = useMemo(() => async () => {
    try {
      return localStorage.getItem("legacyToken") || null;
    } catch {
      return null;
    }
  }, []);

  const signOut = useMemo(() => async () => {
    setUser(null);
    setIsSignedIn(false);
    try {
      localStorage.removeItem("legacyToken");
      localStorage.removeItem("userInfo");
    } catch {
      // ignore
    }
  }, []);

  const mockAuth = useMemo(() => ({
    isLoaded,
    isSignedIn,
    userId: user?._id || user?.id || null,
    getToken,
    signOut,
  }), [isLoaded, isSignedIn, user, getToken, signOut]);

  const mockUser = useMemo(() => ({
    fullName: user?.name || "",
    primaryEmailAddress: { emailAddress: user?.email || "" },
    primaryPhoneNumber: { phoneNumber: user?.phone || "" },
    createdAt: user?.createdAt || null,
    username: user?.name || "",
  }), [user]);

  const mockClerkUser = useMemo(() => ({
    user: mockUser,
    isLoaded,
    isSignedIn,
  }), [mockUser, isLoaded, isSignedIn]);

  const value = useMemo(() => ({
    mockAuth,
    mockUser,
    mockClerkUser,
    setUser,
    setIsSignedIn,
    getToken,
    signOut,
  }), [mockAuth, mockUser, mockClerkUser, setUser, setIsSignedIn, getToken, signOut]);

  return (
    <MockClerkContext.Provider value={value}>
      {children}
    </MockClerkContext.Provider>
  );
};