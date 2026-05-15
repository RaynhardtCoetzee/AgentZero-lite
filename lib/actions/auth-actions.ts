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
import argon2 from "argon2";
import { signIn, signOut } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
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

// ─── Registration schema (Zod 4) ──────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string()
    .min(2)
    .describe("User's display name"),
  orgName: z
    .string()
    .min(2)
    .describe("Organisation name — slug is derived from this"),
  email: z
    .string()
    .email()
    .describe("Unique login email"),
  password: z
    .string()
    .min(8)
    .describe("Plaintext password — argon2-hashed before storage"),
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

// ─── registerAction ───────────────────────────────────────────────────────────

/**
 * Server Action for user registration.
 * Creates organisation + user atomically (with orphan cleanup on user insert failure).
 */
export async function registerAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validate input — throw on malformed data.
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: `Invalid input: ${parsed.error.message}` };
  }

  const { name, orgName, email, password } = parsed.data;

  // 2. Pre-flight: check email uniqueness.
  const user = await getUserByEmail(email);
  if (user) {
    return { success: false, error: "Email already registered. Please sign in." };
  }

  // 3. Derive slug from orgName.
  let slug = orgName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (!slug) slug = "org";

  // 4. Create organisation.
  let orgId: string | undefined;
  let orgCreateError = false;

  // First attempt: slug as-is
  {
    const { data, error } = await adminClient
      .from("organisations")
      .insert({ name: orgName, slug })
      .select("id")
      .single();

    if (error) {
      // Slug collision — retry with 4-char random suffix
      if (error.code === "23505") {
        const suffix = Math.random().toString(36).substring(2, 6);
        const { data: retryData, error: retryError } = await adminClient
          .from("organisations")
          .insert({ name: orgName, slug: `${slug}-${suffix}` })
          .select("id")
          .single();

        if (retryError || !retryData) {
          orgCreateError = true;
        } else {
          orgId = retryData.id;
        }
      } else {
        orgCreateError = true;
      }
    } else if (data) {
      orgId = data.id;
    }
  }

  if (orgCreateError || !orgId) {
    return { success: false, error: "Failed to create organisation. Please try again." };
  }

  // 5. Hash password.
  const passwordHash = await argon2.hash(password);

  // 6. Create user.
  const { data: userData, error: userError } = await adminClient
    .from("users")
    .insert({
      email,
      name,
      organisation_id: orgId,
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  if (userError || !userData) {
    // Cleanup: delete the orphaned organisation.
    await adminClient.from("organisations").delete().eq("id", orgId);
    return { success: false, error: "Failed to create account. Please try again." };
  }

  // 7. Sign in immediately — signIn will redirect on success or throw on failure.
  // In next-auth v5, use redirectTo instead of redirect: false.
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // NEXT_REDIRECT exceptions should bubble up and end the flow.
    // Other errors mean auth failed.
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Account created, but sign-in failed. Please try again." };
    }
    throw error;
  }

  // If signIn didn't redirect (shouldn't happen), do it explicitly.
  redirect("/dashboard");
}
