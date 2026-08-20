import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useDispatch } from "react-redux";
import { fetchProfile, clearUser } from "../../redux/slices/authSlice";
import { mergeCart, fetchCart } from "../../redux/slices/cartSlice";
import { setAuthTokenGetter } from "../../utils/clerkToken.js";
import { getOrCreateGuestId } from "../../utils/guestId.js";

const ClerkAuthBridge = () => {
  const dispatch = useDispatch();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const syncedUserIdRef = useRef(null);
  const guestIdRef = useRef(null);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isLoaded || !isSignedIn) {
        return null;
      }

      return getToken();
    });

    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      // Only clear the Redux user if we previously had an active Clerk
      // session. Without this guard, every cold start in local mode would
      // wipe the legacy auth state, causing protected routes to show
      // "Loading profile..." forever.
      if (syncedUserIdRef.current !== null) {
        syncedUserIdRef.current = null;
        dispatch(clearUser());
      }
      return;
    }

    if (syncedUserIdRef.current === userId) {
      return;
    }

    // First sign-in transition for this Clerk user.
    // Capture the guestId that was in use *before* signing in so we can merge
    // any guest cart items into the user's account cart.
    if (guestIdRef.current === null) {
      guestIdRef.current = getOrCreateGuestId();
    }
    const guestIdAtSignIn = guestIdRef.current;

    syncedUserIdRef.current = userId;

    // In local mode, the apiClient interceptor will use the Clerk token
    // (set via setAuthTokenGetter) for authenticated requests. No need to
    // manually sync Clerk user here — the backend's requireLocalUser will
    // handle Clerk token verification via CLERK_SECRET_KEY.
    // The fetchProfile() call below will use the Clerk token automatically.

    dispatch(fetchProfile())
      .unwrap()
      .then(() => {
        // Merge any guest cart into the user cart, then sync the local cart
        // with the (possibly merged) server cart.
        return dispatch(mergeCart({ guestId: guestIdAtSignIn }));
      })
      .then(() => {
        return dispatch(fetchCart({ userId }));
      })
      .catch(() => {
        // Profile or cart sync can fail (e.g., backend down); don't block the UI.
      });
  }, [dispatch, isLoaded, isSignedIn, userId]);

  return null;
};

export default ClerkAuthBridge;
