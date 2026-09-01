/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice.js";
import { toast } from "sonner";

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
};

const ClerkConfigError = ({ publishableKey }) => (
  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
    <p className="font-semibold">Clerk not configured</p>
    <p className="mt-1">
      Set <code className="rounded bg-amber-100 px-1">VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
      <code className="rounded bg-amber-100 px-1">Frontend/.env</code> to enable Google
      sign-in and Clerk email/password. You can still use the email/password
      form below.
    </p>
  </div>
);

const EmailPasswordForm = ({ onSuccess, redirectTo }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      toast.success("Logged in successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          placeholder="you@zyra.com"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black pr-10"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const { isSignedIn, isLoaded } = useAuth();

  const clerkPublishableKey =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
  const isClerkConfigured =
    typeof clerkPublishableKey === "string" &&
    clerkPublishableKey.startsWith("pk_") &&
    clerkPublishableKey.length > 10;

  // Redirect on successful auth
  useEffect(() => {
    if (isClerkConfigured && isLoaded && isSignedIn) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (user && !authLoading) {
      // Block admin role from logging in here
      if (["admin", "superadmin"].includes(user?.role)) {
        toast.error("Admin accounts must use the admin login page");
        return;
      }
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, isSignedIn, isLoaded, isClerkConfigured, navigate, redirectTo]);

  const handleLocalLoginSuccess = () => {
    // The user state in Redux will update and the effect above will redirect
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#e7dcc9_42%,#d3c1a5)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-4xl border border-white/60 bg-white/90 shadow-[0_30px_80px_rgba(30,20,10,0.14)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-semibold tracking-[0.25em] text-white">
            Z
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
            Welcome back
          </p>
          <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Sign in to your account
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">
            Your profile, orders, and saved cart stay connected once you're
            signed in.
          </p>

          <div className="mt-10 max-w-md space-y-6">
            {/* Clerk SignIn (Google + Clerk email/password) */}
            {isClerkConfigured ? (
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/register"
                forceRedirectUrl={redirectTo}
              />
            ) : (
              <>
                <ClerkConfigError publishableKey={clerkPublishableKey} />
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-stone-900">
                    Or sign in with email
                  </h2>
                  <EmailPasswordForm
                    onSuccess={handleLocalLoginSuccess}
                    redirectTo={redirectTo}
                  />
                </div>
              </>
            )}

            {/* Always show the local email/password form alongside Clerk when configured */}
            {isClerkConfigured && (
              <details className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-stone-700">
                  Or sign in with email & password (local)
                </summary>
                <div className="mt-4">
                  <EmailPasswordForm
                    onSuccess={handleLocalLoginSuccess}
                    redirectTo={redirectTo}
                  />
                </div>
              </details>
            )}

            <div className="border-t border-stone-200 pt-4 text-center">
              <p className="text-sm text-stone-600">
                Don't have an account?{" "}
                <Link
                  to={`/register?redirect=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-black underline"
                >
                  Create one
                </Link>
              </p>
              <p className="mt-2 text-xs text-stone-500">
                Administrator?{" "}
                <Link
                  to={`/local-login?redirect=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-stone-700 underline"
                >
                  Use the admin login
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="hidden bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              Secure commerce
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              One auth system for login, signup, profile, and social sign-in.
            </h2>
          </div>
          <div className="grid gap-4 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Google sign-in via Clerk
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Email & password authentication
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Profile and session management
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
