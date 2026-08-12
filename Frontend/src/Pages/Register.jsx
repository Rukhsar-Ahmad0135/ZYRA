/*
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
import { useSearchParams } from "react-router-dom";
import { SignUp } from "@clerk/react";

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
};

const Register = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));
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
              Google and social providers
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
            Start with Clerk, then let the dashboard handle the rest.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-600">
            New customers can sign up with Google or another enabled provider
            and continue straight into checkout.
          </p>
          <div className="mt-10 max-w-md">
            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              forceRedirectUrl={redirectTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
