# 🏛️ AgentZero Architectural Decision Log

[cite_start]This log tracks every major structural choice to ensure the $1.2M exit valuation is supported by intentional engineering[cite: 620, 755].

---

### 1. The Unified Boundary Pattern
* [cite_start]**Decision**: Implement `proxy.ts` as the sole unified framework entry point[cite: 18, 175].
* [cite_start]**Date**: 23 March 2026 (Phase 0, Day 1)[cite: 18, 658].
* [cite_start]**Alternatives**: `middleware.ts` (Next.js 15 legacy), separate `/api` routes[cite: 21, 186].
* [cite_start]**Reason**: Next.js 16.2+ officially merged middleware and proxy concerns into `proxy.ts`[cite: 1009, 1010]. [cite_start]Using a unified boundary prevents framework conflicts and ensures a single, authoritative sentry for all background traffic[cite: 20, 178].
* [cite_start]**Trade-offs**: Requires breaking legacy "Edge Middleware" mental models in favor of the 2026 Node-first boundary approach[cite: 179, 1012].

### 2. Mandatory Node.js Runtime for Proxy
* [cite_start]**Decision**: Enforce Node.js runtime for the `proxy.ts` layer[cite: 177, 1011].
* [cite_start]**Date**: 23 March 2026 (Phase 0, Day 1)[cite: 18].
* [cite_start]**Alternatives**: Edge Runtime (`runtime = "edge"`)[cite: 179].
* [cite_start]**Reason**: AI SDK 6 "ToolLoopAgent" and high-fidelity "Thinking" logs require unbuffered streaming[cite: 46, 66]. [cite_start]The Edge runtime frequently buffers or clips headers[cite: 179]. [cite_start]Next.js 16 enforces Node.js for `proxy.ts` to guarantee 100% stream integrity for agentic loops[cite: 1011].
* [cite_start]**Trade-offs**: Acceptable increase in cold-start latency (20-50ms) as `proxy.ts` never handles the initial UI page render—only background AI/Auth traffic[cite: 179, 1012].

### 3. Updated Supabase Secret Key Naming
* [cite_start]**Decision**: Standardize on `SUPABASE_SECRET_KEY` naming convention[cite: 25, 658].
* **Date**: 23 March 2026 (Phase 0, Day 1).
* **Alternatives**: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ADMIN_KEY`.
* [cite_start]**Reason**: Alignment with the 2026 Supabase Dashboard UI[cite: 210]. [cite_start]Maintaining legacy "Service Role" terminology creates friction during project initialization[cite: 96, 929].
* [cite_start]**Trade-offs**: Minimal confusion for developers familiar with pre-2026 Supabase versions; outweighed by 1:1 parity with current platform documentation[cite: 96, 811].

## ADR 003: Component Primitive Layer Selection

**Status:** Decided  
**Date:** 2026-03-26 (Phase 0, Day 3)  
**Context:** Choosing the underlying primitive library for our Shadcn/ui implementation.

### Decision
We are utilizing **Radix UI** as the primitive layer for Shadcn instead of Base UI.

### Rationale
* **Buyer Familiarity:** Radix is the industry standard for modern Next.js applications. A $1.2M+ acquirer will recognize the stack instantly, reducing perceived technical risk.
* **Community Resources:** The ecosystem of pre-built patterns, accessibility audits, and troubleshooting for Radix is significantly deeper than Base UI.
* **API Consistency:** While Base UI is an impressive newcomer, the functional difference in the Shadcn API is negligible. Radix provides the stability required for a 30-day "Hardened" build.

### Trade-offs
* **Maintenance Trajectory:** Base UI (from the MUI team) has a strong long-term roadmap, but its current community maturity is insufficient for a rapid-build product targeted at developers who expect battle-tested primitives.
* **Bundle Size:** Radix is slightly heavier in some edge cases, but the trade-off for accessibility (A11y) compliance out-of-the-box is worth the minimal overhead.

### Consequences
* All future UI components must be scaffolded using the Radix-based Shadcn CLI.
* Any custom complex components (Comboboxes, Dialogs) will leverage Radix primitives to ensure keyboard navigation and screen-reader support.

## ADR 004: UI Preset Selection (Nova)

**Status:** Decided  
**Date:** 2026-03-26 (Phase 0, Day 3)  
**Context:** Selecting a design system density for the AgentZero dashboard.

### Decision
We are adopting the **Nova** preset for Shadcn/ui.

### Rationale
* **Information Density:** Developers and AI orchestrators require a "Command Center" feel. Nova provides the compact layout necessary to display complex agent state-machines and logs simultaneously.
* **Professional Utility:** The reduced padding and tighter typography hit the right balance between modern aesthetics and functional readability.

### Trade-offs
* **Visual Breathing Room:** Nova has significantly less white space than the Vega or Maia presets. This increases the cognitive load for casual users but is the correct trade-off for a specialized developer tool.
* **Mobile Responsiveness:** Higher density requires more aggressive "stacking" logic on mobile, but the primary use case for AgentZero is a desktop-first engineering environment.

### Consequences
* All Shadcn components will be initialized with the Nova-specific `tailwind.config.js` spacing scales.
* UI patterns will prioritize side-by-side "Panel" layouts over single-column "Feed" layouts.

## ADR 005: Navigation Animation Strategy (React 19 View Transitions)

**Status:** Decided  
**Date:** 2026-03-26 (Phase 0, Day 3)  
**Context:** Defining the transition logic between dashboard sub-routes (Overview, Agents, Billing).

### Decision
We are implementing **React 19 View Transitions** for all internal dashboard navigation.

### Rationale
* **Zero Dependency Cost:** By leveraging the native Browser/React 19 View Transition API, we avoid the 30kb+ bundle overhead of Framer Motion.
* **Layout Stability:** The sidebar and top stats bar remain static (persistent) while the main content area performs a clean cross-fade. This enhances the "Single Page App" feel without the complexity of manual layout syncing.
* **Future-Proofing:** Aligning with the React 19 roadmap ensures this asset remains relevant and "modern" for a 2026/2027 acquisition window.

### Alternatives Considered
* **No Transitions:** Too jarring for a high-end AI tool; feels "cheap."
* **CSS-only Transitions:** Difficult to coordinate with Next.js App Router's concurrent rendering.
* **Framer Motion:** Excellent API, but introduces unnecessary weight for simple cross-fades.

### Trade-offs
* **Experimental Status:** The Next.js integration layer for View Transitions is currently marked experimental. This is an acceptable risk for a developer-centric boilerplate where technical buyers value cutting-edge performance over "Legacy" stability.
* **Browser Support:** Requires modern chromium-based browsers for the full effect, falling back to standard navigation on older versions.

### Consequences
* Navigation logic will use the `startTransition` and `document.startViewTransition` patterns.
* Update to V2 (Stable) once the Next.js/React 19 bridge is officially out of experimental.

## Architecture Decision Record: ToolLoopAgent Instantiation

**Date:** Phase 0, Day 4  
**Status:** Decided  

### Decision
The `ToolLoopAgent` has been instantiated at the **module level** within the Server Action.

### Reasoning
* **Security & Isolation:** Server Actions execute exclusively on the server side. This ensures that sensitive credentials, such as API keys, remain protected and never leak to the client-side bundle.
* **Boundary Clarification:** The architectural intent defined in `AGENTS.md` is satisfied by the server/client split. The security boundary is enforced by the execution environment itself, rather than relying on the `proxy.ts` matcher.
* **Current Simplicity:** A module-level instance is sufficient for the current single-model configuration.

### Trade-offs
* **Flexibility:** While efficient now, this approach will require refactoring during **Task 36**. 
* **Future Requirement:** Once the `ProviderFactory` is introduced to support dynamic model selection via `.env` variables, we will need to move toward **per-request resolution** to handle varying provider configurations.

## Architecture Decision Record: LanguageModel Typing

**Date:** Phase 0, Day 4  
**Status:** Decided  

### Decision
Utilize the `LanguageModel` type instead of `LanguageModelV1`.

### Reasoning
* **AI SDK Update:** In AI SDK 6, `LanguageModelV1` has been renamed to `LanguageModel`. 
* **Deprecation:** `LanguageModelV1` no longer exists as a valid export in the current version of the SDK.
* **Knowledge Gap:** Most AI tools and existing documentation (including training data) still reference the legacy `LanguageModelV1` naming convention. 

### Implementation Note
* **Verification:** When encountering type errors during development, verify against the **AI SDK 6 types** directly rather than relying on legacy documentation or AI-generated boilerplate.

# Architectural Decision Records

## ADR: Selection of Embedding Method for AI SDK 6

### Status
**Accepted**

### Context
When implementing vector embeddings using the Vercel AI SDK (version 6.x), there is a discrepancy between legacy documentation/LLM training data and the current library implementation. Many external resources and older code snippets reference a function called `embedText`.

### Decision
We will use the **`embed`** function imported from the `"ai"` package instead of `embedText`. 

The `embedText` function is deprecated/non-existent in the version 6 API. The implementation must utilize the `openai.embedding("text-embedding-3-small")` model (or equivalent) passed as a parameter to the `embed` function.

### Implementation Example
```typescript
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "Your text content here",
});

## Decision #12: ToolLoopAgent Instantiation

**Status:** Decided  
**Context:** Determining the lifecycle of the `ToolLoopAgent` instance.

### Decision
Instantiate `ToolLoopAgent` per-call rather than at the module level.

### Rationale
* **Dynamic Instructions:** System instructions must be dynamic because they include RAG (Retrieval-Augmented Generation) context that varies based on the specific organization and user query.
* **Performance:** The construction cost of the agent is negligible as it involves no I/O operations during instantiation.
* **API Constraints:** The alternative—overriding the system prompt during the `.generate()` call—is not currently exposed in AI SDK 6.

---

## Decision #13: Cache Key Derivation

**Status:** Decided  
**Context:** Strategy for generating unique keys for the 'use cache' directive.

### Decision
Use raw function arguments as the cache key instead of implementing a manual hashing utility.

### Rationale
* **Framework Native:** Next.js internally serializes all arguments passed to a cached function to build its internal key.
* **Simplicity:** Passing specific parameters like `(query, orgId)` already provides a unique discriminator for the cache.
* **Reduced Overhead:** Implementing a manual `createHash` call would be redundant and add unnecessary complexity to the codebase.
* 
* ## Decision #14: UploadKnowledge Component Styling

**Status:** Decided  
**Context:** Choosing between Shadcn primitives and raw Tailwind for the `UploadKnowledge` component.

### Decision
Utilize raw Tailwind CSS combined with existing CSS variables rather than installing additional Shadcn primitives. Only the base `button.tsx` is maintained as a Shadcn dependency for this component.

### Rationale
* **Dependency Management:** Adding complex primitives like `Card`, `Input`, or `Dropzone` for a single-use component increases dependency weight without a meaningful ROI.
* **Consistency:** This approach aligns with the existing architecture of `Sidebar.tsx`, maintaining a consistent internal pattern for custom UI blocks.
* **Visual Fidelity:** Direct Tailwind utility classes mapped to the project's CSS variables produce an identical visual output to Shadcn primitives while keeping the codebase leaner.
* 
* Decision #15: matchThreshold set to 0.1 temporarily for stub embedding testing. Reset to 0.7 when real OpenAI embeddings are funded. Stub embeddings confirm pipeline execution but cannot produce semantically accurate retrieval.
* 
* Decision #16: Replaced pdf-parse with unpdf for PDF text extraction. pdf-parse pulls in pdfjs-dist which requires browser globals (DOMMatrix, ImageData, Path2D) unavailable in Next.js server environment. unpdf uses WASM with no browser API dependencies — correct choice for server-side extraction in Next.js 16.


Decision: user_credits RLS scoped to SELECT only
Date: Phase 0 Day 8
Alternatives considered: Full CRUD RLS policies
Reason: All credit mutations (deduction, rollback, top-up) happen server-side via service role key — RLS on mutations would be redundant and add complexity
Trade-offs: Any future client-side credit exposure would require policy additions

Decision: credit deduction via Postgres RPC (deduct_user_credits) instead of application-layer UPDATE
Date: Phase 0 Day 8
Alternatives considered: Direct Supabase UPDATE from Server Action
Reason: Atomic execution prevents race condition where two concurrent agent runs could both pass the pre-flight check and both deduct against the same balance
Trade-offs: Additional SQL function to maintain. Worth it for correctness under concurrency.

Decision: no explicit credit confirmation step — deduction is the confirmation
Date: Phase 0 Day 8
Alternatives considered: Separate confirm RPC after successful tool execution
Reason: Optimistic deduction + rollback on failure means a standing deduction IS a successful execution. A confirm step adds a write with no correctness benefit.
Trade-offs: Credits are locked at run start, not confirmed at run end. Acceptable given rollback covers all failure paths.

Decision: All agents share the same tool library in V1. Per-agent tool configuration deferred to V2. Architecture supports it via a tools config column — not built yet because the V1 differentiation via agent-scoped knowledge bases is sufficient for launch.