/**
 * lib/supabase/queries.ts — Cached Server-Side Data Loaders
 *
 * All functions are wrapped in React's cache() to deduplicate identical DB
 * calls within a single request lifecycle. This prevents redundant Supabase
 * hits when the same data is needed by both the Auth.js authorize function
 * and any surrounding Server Action context during the session handshake.
 *
 * cache() scope: per-request (reset on every new incoming request).
 * Use ONLY in server-side code. Never import in client components.
 */

import { cache } from "react";
import { adminClient } from "@/lib/supabase/admin";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  organisation_id: string;
  password_hash: string;
};

/**
 * Fetch a user and their organisation_id by email.
 * Deduplicated: calling this twice with the same email in one request
 * results in exactly one Supabase query.
 */
export const getUserByEmail = cache(async (email: string): Promise<UserRow | null> => {
  const { data, error } = await adminClient
    .from("users")
    .select("id, email, name, organisation_id, password_hash")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data as UserRow;
});
