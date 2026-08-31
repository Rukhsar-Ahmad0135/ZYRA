/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useSearchParams } from "react-router-dom";
import { SignIn } from "@clerk/react";

// Only allow same-origin, in-app paths. Reject anything that could be an
// open-redirect (external URL, protocol-relative "//evil.com", etc.).
const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
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
            Sign in with email, Google, or any Clerk provider you enable.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">
            Your profile, orders, and saved cart stay connected once you’re
            signed in.
          </p>
          <div className="mt-10 max-w-md">
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              forceRedirectUrl={redirectTo}
            />
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
              Google sign-in
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Passwordless-ready flows
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
