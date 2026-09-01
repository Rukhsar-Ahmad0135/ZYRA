/*
 * Local Admin Login Page - Email/password login for admin/superadmin
 * Uses /api/users/login endpoint directly
 */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice.js";
import { toast } from "sonner";

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/admin";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
};

const LocalLogin = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLocalMode = import.meta.env.VITE_USE_LOCAL_DATA === "true";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      toast.success("Logged in successfully");

      const loggedInUser = result;
      // Admin users: respect explicit redirect or default to /admin
      // Block non-admin users from using the admin login
      if (!["admin", "superadmin"].includes(loggedInUser?.role)) {
        toast.error("This page is for admin access only. Use the customer login.");
        return;
      }
      const finalRedirect = redirectTo === "/admin" ? "/admin" : redirectTo;
      navigate(finalRedirect, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  if (!isLocalMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Local admin login only available in local mode</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a1a1a,#000_70%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-zinc-900/90 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-semibold tracking-[0.25em] text-black">
            Z
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Admin access
          </p>
          <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Administrator sign-in
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300">
            Restricted area. Authorized admin and superadmin accounts only.
            Customer accounts should use the regular sign-in page.
          </p>

          <div className="mt-10 max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white placeholder-zinc-500"
                  placeholder="superadmin@zyra.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-white pr-10 placeholder-zinc-500"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3 px-4 rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Signing in..." : "Sign in to admin"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-700 pt-4 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">Default superadmin</p>
              <p className="mt-1 font-mono text-xs text-zinc-300">
                superadmin@zyra.com / SuperAdmin@123!
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                New admin: rukhsar11@example.com / rukhsar@123111
              </p>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link
                to="/login"
                className="text-zinc-300 underline hover:text-white"
              >
                ← Back to customer sign-in
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden bg-white p-10 text-black lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
              Admin control center
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Manage products, orders, and users from one dashboard.
            </h2>
          </div>
          <div className="grid gap-4 text-sm text-zinc-700">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              Product management
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              Order processing
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              User administration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalLogin;
