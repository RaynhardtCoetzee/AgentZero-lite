# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. 
## 🎯 Project Overview
AgentZero is a production-ready AI agent SaaS boilerplate targeting a $1.2M exit. 
- **Stack**: Next.js 16.2.1 (Turbopack), AI SDK 6, Supabase (pgvector), Auth.js v5. 
- **Philosophy**: 5-10 year solo empire. "Hardened" architecture over "90-day dreams". 

## 🧱 Architectural Guardrails (Mandatory)
- **Network Boundary**: All AI/DB requests MUST pass through `proxy.ts` at the project root. [cite: 18, 175]
- **Runtime Sentry**: `proxy.ts` must run in the Node.js runtime to guarantee AI stream integrity; do NOT use Edge/Middleware for streams.
- **Async-First Next.js 16**: `cookies()` and `headers()` are strictly asynchronous. ALWAYS await them in `proxy.ts`, Server Actions, and Components.
- **Intelligence Layer**: Use the `ToolLoopAgent` from AI SDK 6 with the Server Action pattern; no REST endpoints for chat. 
- **Partial Prerendering (PPR)**: The dashboard shell must render in <100ms. Wrap dynamic agent feeds in `Suspense` boundaries.
- **Caching**: Use the 'use cache' directive at the component level for Sidebars and Global Stats. Use short `cacheLife` (60s) for vector lookups. 

## 💳 Commercial Layer (Security)
- **Pre-flight Check**: Usage-based credit checks must happen server-side BEFORE the `ToolLoopAgent` runs. 
- **Optimistic Deduction**: 1. Lock credits pre-run. 2. Confirm ONLY on tool success. 3. Refund/Rollback on agent failure. 
- **No Silent Failures**: Rejection for insufficient credits must return a clean 402 error.

## 🛠️ Coding Standards
- **Validation**: Every tool and API must have a Zod 4 schema for input AND output.
- **Documentation**: Use `.describe()` on all Zod fields to guide the AI's tool-selection logic. 
- **Style**: TypeScript strict mode, Tailwind 4.x (if stable), Shadcn/ui (React 19 compatible).