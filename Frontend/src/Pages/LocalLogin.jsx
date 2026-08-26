/*
 * Local Login Page - Email/password login for local fallback mode
 * Uses /api/users/login endpoint directly
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice.js";
import { toast } from "sonner";

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
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
      
      // Use the result from the login action (has the fresh user data with role)
      const loggedInUser = result;
      // If user is admin/superadmin, prefer /admin, otherwise use redirect param or home
      const finalRedirect = ["admin", "superadmin"].includes(loggedInUser?.role) 
        ? (redirectTo === "/" ? "/admin" : redirectTo) 
        : redirectTo;
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
        <p className="text-gray-500">Local login only available in local mode</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5efe6,#e7dcc9_42%,#d3c1a5)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-4xl border border-white/60 bg-white/90 shadow-[0_30px_80px_rgba(30,20,10,0.14)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-semibold tracking-[0.25em] text-white">
            Z
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">
            Local Development Login
          </p>
          <h1 className="mt-3 max-w-lg text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Sign in with email and password
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">
            This login uses local database authentication (bypasses Clerk).
          </p>
          
          <div className="mt-10 max-w-md">
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
                  placeholder="superadmin@zyra.com"
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
            
            <p className="mt-4 text-center text-sm text-gray-500">
              Default superadmin: superadmin@zyra.com / SuperAdmin@123!
            </p>
            
            <p className="mt-2 text-center text-sm text-gray-500">
              <a href="/login" className="text-blue-500 hover:underline">
                Use Clerk Sign In instead
              </a>
            </p>
          </div>
        </div>
        
        <div className="hidden bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              Local Development Mode
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Email/password authentication using local database.
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalLogin;