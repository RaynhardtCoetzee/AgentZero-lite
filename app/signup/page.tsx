/**
 * app/signup/page.tsx — Server Component (PPR-compliant)
 *
 * Mirrors /app/login/page.tsx structure.
 * AuthGuard redirects authenticated users to /dashboard.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up — AgentZero",
};

// ─── Dynamic layer ────────────────────────────────────────────────────────────
// Renders nothing — only purpose is to redirect authenticated users.

async function AuthGuard() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return null;
}

// ─── Static shell ─────────────────────────────────────────────────────────────
// SignupForm renders immediately. AuthGuard streams in and redirects if needed.

export default function SignupPage() {
  return (
    <main className="relative min-h-dvh flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/4.5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-primary/3 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-50">
          <defs>
            <pattern id="signup-dot-grid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-dot-grid)" />
        </svg>
      </div>
      <Suspense>
        <AuthGuard />
      </Suspense>
      <SignupForm />
    </main>
  );
}