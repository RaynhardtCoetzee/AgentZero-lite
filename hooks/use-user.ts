"use client";

import { useSession } from "next-auth/react";

/**
 * useUser — Safe client-side access to the current user's session data.
 * Returns { id, email, name, orgId } | null
 * Requires SessionProvider in the parent tree.
 */
export function useUser() {
  const { data: session } = useSession();
  return session?.user ?? null;
}
