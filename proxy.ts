// AgentZero Lite — billing layer removed
import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

/**
 * 🕵️ AgentZero Security & Stream Proxy
 * STACK: Next.js 16 Proxy Layer (Standardized Architecture) [cite: 45]
 * ROLE: Intercepts AI requests to inject sensitive API keys server-side.
 * RELEVANCE: Section 2.3 - Foundation Layer (Infrastructure Sentry) 
 */

/**
 * 🎯 PROXY MATCHER
 * CRITICAL: This ensures the proxy only intercepts background data calls.
 * Without this, the proxy will block the initial UI page load. 
 */
export const config = {
  matcher: [
    '/api/:path*', 
    '/proxy/:path*',
    '/supabase/:path*'
  ],
};

interface ProxyOptions {
  aiAuthToken?: string;        // Injected server-side (OpenAI, Claude, etc.) [cite: 52]
  supabaseSecretKey?: string;  // 2026 Opaque Key (sb_secret_...) [cite: 55]
  allowedOrigins?: string[];   // Multi-tenant domain isolation 
}

export function createProxyHandler(options: ProxyOptions = {}) {
  const { aiAuthToken, supabaseSecretKey, allowedOrigins = [] } = options;

  /**
   * The 'proxy' entry point for Next.js 16.
   * Note: Uses NextRequest/NextResponse for Web-standard compatibility. [cite: 48]
   */
  return async function proxy(req: NextRequest) {
    // Fallback to 'referer' if 'origin' is absent (standard local browser behavior)
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const normalizedOrigin = origin.replace(/\/$/, "");

    // 1️⃣ MULTI-TENANT ORIGIN GUARD 
    // Prevents unauthorized domains from draining your AI credit balance. 
    if (allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some(allowed => 
        normalizedOrigin.startsWith(allowed.replace(/\/$/, ""))
      );

      if (!isAllowed && origin !== "") {
        return NextResponse.json(
          { error: "Forbidden origin", detected: origin },
          { status: 403 }
        );
      }
    }

    // 2️⃣ CLONE HEADERS FOR INJECTION
    // Next.js headers are immutable; cloning is required to append Auth keys safely. [cite: 48]
    const requestHeaders = new Headers(req.headers);

    // 3️⃣ 2026 SUPABASE APIKEY PATTERN [cite: 55]
    // Bypasses Row Level Security (RLS) on server-side calls via Opaque Keys.
    if (supabaseSecretKey) {
      requestHeaders.set("apikey", supabaseSecretKey);
      requestHeaders.set("authorization", `Bearer ${supabaseSecretKey}`);
    }

    // 4️⃣ AI PROVIDER AUTH HANDSHAKE
    // Prepares request for the Day 4 ProviderFactory logic. [cite: 52]
    if (aiAuthToken) {
      requestHeaders.set("x-ai-authorization", `Bearer ${aiAuthToken}`);
    }

    // 5️⃣ PRODUCE PROXY RESPONSE
    // Forwards the modified headers upstream to the AI Provider or Supabase.
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // 6️⃣ AI SDK 6 STREAMING OPTIMIZATION [cite: 56]
    // CRITICAL: Disables Nginx/Vercel buffering to enable frame-by-frame ReAct logs. 
    response.headers.set("Content-Type", "text/event-stream");
    response.headers.set("Cache-Control", "no-cache, no-transform");
    response.headers.set("Connection", "keep-alive");
    response.headers.set("X-Accel-Buffering", "no");

    // 7️⃣ CORS HANDSHAKE [cite: 37]
    // Enables multi-tenant cross-origin requests for high-end Agency setups. [cite: 82]
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  };
}

// Default export: Primary entry point for the Next.js 16 Proxy Layer.
const proxyInstance = createProxyHandler({
  aiAuthToken: process.env.OPENAI_API_KEY,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]
});

export default proxyInstance;