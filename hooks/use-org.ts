"use client";

import { useSession } from "next-auth/react";

/**
 * useOrg — Safe client-side access to the current user's organisation ID.
 * Returns orgId string | null
 * Requires SessionProvider in the parent tree.
 */
export function useOrg() {
  const { data: session } = useSession();
  return session?.user?.orgId ?? null;
}
