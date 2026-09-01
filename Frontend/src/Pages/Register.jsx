/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { SignUp, useAuth } from "@clerk/react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../redux/slices/authSlice.js";
import { toast } from "sonner";

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
};

const ClerkConfigError = () => (
  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
    <p className="font-semibold">Clerk not configured</p>
    <p className="mt-1">
      Set <code className="rounded bg-amber-100 px-1">VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
      <code className="rounded bg-amber-100 px-1">Frontend/.env</code> to enable Google
      sign-up. You can still create an account with the email & password
      form below.
    </p>
  </div>
);

const RegisterForm = ({ onSuccess, redirectTo }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await dispatch(registerUser({ name, email, password })).unwrap();
      toast.success("Account created successfully");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          placeholder="Jane Doe"
          required
          autoComplete="name"
        />
      </div>
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
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
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
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
};

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const { isSignedIn, isLoaded } = useAuth();

  const clerkPublishableKey =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
  const isClerkConfigured =
    typeof clerkPublishableKey === "string" &&
    clerkPublishableKey.startsWith("pk_") &&
    clerkPublishableKey.length > 10;

  useEffect(() => {
    if (isClerkConfigured && isLoaded && isSignedIn) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (user && !authLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, isSignedIn, isLoaded, isClerkConfigured, navigate, redirectTo]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe8ff,#ddd4ff_42%,#c2b3ff)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-4xl border border-white/60 bg-white/90 shadow-[0_30px_80px_rgba(30,20,10,0.14)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              Join the store
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Create one account and use the same profile everywhere.
            </h2>
          </div>
          <div className="grid gap-4 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Google and social providers via Clerk
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Email verification
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Built-in profile management
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
            Create account
          </p>
          <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Start shopping in minutes
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">
            Sign up with Google, social providers, or your email and continue
            straight into checkout.
          </p>

          <div className="mt-10 max-w-md space-y-6">
            {isClerkConfigured ? (
              <SignUp
                routing="path"
                path="/register"
                signInUrl="/login"
                forceRedirectUrl={redirectTo}
              />
            ) : (
              <>
                <ClerkConfigError />
                <RegisterForm redirectTo={redirectTo} />
              </>
            )}

            {isClerkConfigured && (
              <details className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-stone-700">
                  Or sign up with email & password (local)
                </summary>
                <div className="mt-4">
                  <RegisterForm redirectTo={redirectTo} />
                </div>
              </details>
            )}

            <div className="border-t border-stone-200 pt-4 text-center">
              <p className="text-sm text-stone-600">
                Already have an account?{" "}
                <Link
                  to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-black underline"
                >
                  Sign in
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
      </div>
    </div>
  );
};

export default Register;
