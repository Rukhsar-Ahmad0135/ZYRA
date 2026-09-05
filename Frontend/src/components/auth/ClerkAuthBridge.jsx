import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, clearUser } from "../../redux/slices/authSlice";
import { mergeCart, fetchCart } from "../../redux/slices/cartSlice";
import { setAuthTokenGetter } from "../../utils/clerkToken.js";
import { getOrCreateGuestId } from "../../utils/guestId.js";

const GUEST_CART_STORAGE_KEY = "zyra_cart_v1";

const ClerkAuthBridge = () => {
  const dispatch = useDispatch();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useSelector((state) => state.auth);
  const syncedUserIdRef = useRef(null);
  const guestIdRef = useRef(null);
  const hasCheckedGuestCartRef = useRef(false);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  // Set up auth token getter - runs on mount and when dependencies change
  // In local mode, prefer Clerk token when signed in; fall back to legacy token
  // In production mode, use Clerk token
  useEffect(() => {
    setAuthTokenGetter(async () => {
      // In local mode: prefer Clerk token when signed in, fall back to legacy token
      if (isLocalMode) {
        if (isSignedIn && isLoaded) {
          try {
            return await getToken();
          } catch {
            // Clerk token unavailable, fall through to legacy
          }
        }
        // Fall back to legacy token from localStorage
        const legacyToken = localStorage.getItem("legacyToken");
        return legacyToken || null;
      }

      // In production mode, use Clerk token
      if (!isLoaded || !isSignedIn) {
        return null;
      }

      return getToken();
    });

    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn, isLocalMode]);

  // Sync user state with Clerk
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      // Preserve a legacy local login on cold start, but clear any Clerk
      // session that has just ended so cart writes become guest writes.
      const hasLegacySession = Boolean(localStorage.getItem("legacyToken"));
      if (syncedUserIdRef.current !== null || (user && !hasLegacySession)) {
        syncedUserIdRef.current = null;
        guestIdRef.current = null;
        hasCheckedGuestCartRef.current = false;
        dispatch(clearUser());
      }
      return;
    }

    if (syncedUserIdRef.current === userId) {
      // User is already synced - check if we need to merge guest cart
      // This handles the case where user was already signed in when app loaded
      if (!hasCheckedGuestCartRef.current) {
        hasCheckedGuestCartRef.current = true;
        const guestId = getOrCreateGuestId();
        // Check if there's a guest cart in localStorage
        try {
          const localCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
          if (localCart && JSON.parse(localCart).length > 0) {
            dispatch(mergeCart({ guestId }))
              .unwrap()
              .catch(() => {});
          }
          dispatch(fetchCart({ userId: user?._id || user?.id })).catch(
            () => {},
          );
        } catch {}
      }
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
    hasCheckedGuestCartRef.current = true;

    // In local mode, the apiClient interceptor will use the Clerk token
    // (set via setAuthTokenGetter) for authenticated requests. No need to
    // manually sync Clerk user here — the backend's requireLocalUser will
    // handle Clerk token verification via CLERK_SECRET_KEY.
    // The fetchProfile() call below will use the Clerk token automatically.

    dispatch(fetchProfile())
      .unwrap()
      .then((profile) => {
        // Merge any guest cart into the user cart, then sync the local cart
        // with the (possibly merged) server cart.
        return dispatch(mergeCart({ guestId: guestIdAtSignIn })).then(
          () => profile,
        );
      })
      .then((profile) => {
        return dispatch(fetchCart({ userId: profile?._id || profile?.id }));
      })
      .catch(() => {
        // Profile or cart sync can fail (e.g., backend down); don't block the UI.
      });
  }, [dispatch, isLoaded, isSignedIn, userId]);

  return null;
};

export default ClerkAuthBridge;
