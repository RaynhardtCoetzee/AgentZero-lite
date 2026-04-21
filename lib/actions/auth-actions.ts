"use server";

/**
 * lib/actions/auth-actions.ts — Server Action Auth Flow
 *
 * This is the correct layer for await headers() — Server Actions run within
 * the Next.js async context where next/headers is available, unlike Auth.js
 * callbacks which run outside it.
 *
 * Flow:
 *   1. Zod validates raw form input
 *   2. headers() captures request context for audit/logging
 *   3. getUserByEmail() pre-flight (react cache — zero extra DB hit if
 *      authorize() calls it again in the same request)
 *   4. signIn('credentials') delegates to auth.ts → argon2.verify runs there
 *   5. AuthError caught and mapped to user-facing messages
 *   6. redirect() on success (throws NEXT_REDIRECT — must not be caught)
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { getUserByEmail } from "@/lib/supabase/queries";

// ─── Shared return type ───────────────────────────────────────────────────────
// Compatible with React 19 useActionState — both actions return this shape.

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ─── Input schema (Zod 4) ─────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .describe("User email address submitted via the login form"),
  password: z
    .string()
    .min(8)
    .describe("Raw password — verified against the argon2 hash inside authorize()"),
});

// ─── loginAction ──────────────────────────────────────────────────────────────

/**
 * Bound to the login form via useActionState(loginAction, null).
 * _prevState is required by React 19's action contract; not used here.
 */
export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validate raw form input — throw on malformed data, never coerce.
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: `Invalid input: ${parsed.error.message}` };
  }

  const { email, password } = parsed.data;

  // 2. Capture request context.
  //    await headers() is valid here — we are inside a Server Action.
  //    TODO: pipe ip + userAgent to an audit_log table in a future migration.
  const requestHeaders = await headers();
  const _ip =
    requestHeaders.get("x-forwarded-for") ??
    requestHeaders.get("x-real-ip") ??
    "unknown";
  const _userAgent = requestHeaders.get("user-agent") ?? "unknown";

  // 3. Pre-flight existence check via cached query.
  //    Short-circuits before invoking Auth.js machinery for non-existent users.
  //    When authorize() calls getUserByEmail() moments later, react cache
  //    returns the memoised result — exactly one Supabase query for this request.
  const user = await getUserByEmail(email);
  if (!user) {
    // Generic message — never confirm whether an email exists (prevents enumeration).
    return { success: false, error: "Invalid email or password." };
  }

  // 4. Delegate to Auth.js credentials flow.
  //    authorize() in auth.ts handles argon2.verify — no duplication here.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "Authentication failed. Please try again." };
      }
    }
    // Re-throw everything else — Next.js redirect throws must bubble up.
    throw error;
  }

  // 5. signIn succeeded. redirect() throws NEXT_REDIRECT — do not catch it.
  redirect("/dashboard");
}

// ─── logoutAction ─────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/");
}
