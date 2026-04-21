"use client";

/**
 * components/dashboard/PageTransition.tsx
 *
 * Thin client boundary that wraps the dynamic content slot in a React 19
 * <ViewTransition>. The layout itself stays a Server Component — this is the
 * only client node needed for transitions.
 *
 * <ViewTransition> activates when React processes a navigation inside a
 * startTransition (which Next.js App Router does automatically). The Sidebar
 * and GlobalStats are rendered outside this boundary so they never animate —
 * they remain static and cached throughout every navigation.
 *
 * Step 2 (not yet): pass `transitionTypes` on <Link> in Sidebar to drive
 * named animations (e.g. slide-left vs slide-right per route direction).
 */

import { ViewTransition } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
