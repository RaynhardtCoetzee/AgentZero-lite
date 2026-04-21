import type { NextConfig } from "next";
import path from "path";

/**
 * 🚀 AgentZero Core Configuration
 * Framework: Next.js 16.2.1 (Turbopack)
 * Strategy: Section 2.3 - Foundation Layer [cite: 44]
 */

const nextConfig: NextConfig = {
  // React 19 Compiler for high-performance View Transitions [cite: 56]
  reactCompiler: true,

  // 1. PERFORMANCE: Partial Prerendering (PPR)
  // Enabled via the stabilized top-level cacheComponents key [cite: 46]
  cacheComponents: true,

  experimental: {
    // 2. SECURITY: Taint API
    // Prevents leaking Server-Only objects (like Secret Keys) to the client
    taint: true,

    // 3. VIEW TRANSITIONS: Enables deeper Next.js integration so <Link>
    // can pass transitionTypes to <ViewTransition> boundaries.
    // Marked experimental by Next.js — monitor for stable release.
    viewTransition: true,

    // 4. SERVER ACTIONS: Raise body limit to cover the 10 MB file cap enforced
    // in document-actions.ts. Buffer is intentional — multipart envelope overhead
    // means a 10 MB file arrives as slightly more than 10 MB on the wire.
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },

  turbopack: {
    // 3. ARCHITECTURE: Absolute Workspace Root
    // Resolves "must be absolute" warning for consistent 300ms-400ms refreshes
    root: path.resolve(__dirname),
  },

  images: {
    // Optimized for the 2026 'Pretty' UI assets you demonstrated
    unoptimized: false,
    localPatterns: [{ pathname: "/public/**" }],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;