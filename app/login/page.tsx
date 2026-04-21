/**
 * app/login/page.tsx — Server Component (PPR-compliant)
 *
 * The LoginForm is static — it renders instantly as the shell.
 * AuthGuard is the only dynamic part (reads the session cookie via auth()).
 * It resolves async inside <Suspense> and redirects if already authenticated.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — AgentZero",
};

// ─── Dynamic layer ────────────────────────────────────────────────────────────
// Renders nothing — only purpose is to redirect authenticated users.

async function AuthGuard() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return null;
}

// ─── Static shell ─────────────────────────────────────────────────────────────
// LoginForm renders immediately. AuthGuard streams in and redirects if needed.

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Suspense>
        <AuthGuard />
      </Suspense>
      <LoginForm />
    </main>
  );
}
