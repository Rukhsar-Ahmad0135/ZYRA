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
      syncedUserIdRef.current = null;
      // Clear the Redux user store so no stale profile is shown, but keep the
      // guestId stable (don't regenerate it) so repeat guest browsing is smooth.
      dispatch(clearUser());
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
        // Profile or cart sync can fail (e.g. backend down); don't block the UI.
      });
  }, [dispatch, isLoaded, isSignedIn, userId]);

  return null;
};

export default ClerkAuthBridge;
