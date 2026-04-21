"use client";

/**
 * components/auth/LoginForm.tsx
 *
 * Progressive Enhancement: the <form action={formAction}> pattern works
 * without JS. useActionState wires in the Server Action response once
 * hydrated. isPending from the React 19 3-tuple drives the submit state
 * directly — no useFormStatus wrapper needed.
 */

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/lib/actions/auth-actions";

const initialState: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-sm">

      {/* Wordmark */}
      <div className="mb-8">
        <p className="text-xs font-mono tracking-widest text-indigo-500 uppercase mb-1">
          AgentZero
        </p>
        <h1 className="text-xl font-semibold text-zinc-100">
          Sign in to your workspace
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your credentials to continue.
        </p>
      </div>

      {/* Card */}
      <form
        action={formAction}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-5"
      >
        {/* Server Action error */}
        {state?.success === false && (
          <div className="flex items-start gap-2 rounded border border-red-500/20 bg-red-500/5 px-3 py-2">
            <span className="mt-px text-red-400 text-xs">⚠</span>
            <p className="text-sm text-red-400">{state.error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium tracking-wide text-zinc-400 uppercase"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-medium tracking-wide text-zinc-400 uppercase"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
