// AgentZero Lite — billing layer removed
"use server";

/**
 * lib/actions/agent-actions.ts — Streaming ToolLoop Server Action
 *
 * Server Action pattern only — no /api/chat route.
 *
 * Streaming model:
 *   streamText() opens a ReAct loop (stopWhen: stepCountIs(10)). The Server
 *   Action returns an AsyncGenerator<StreamEvent> immediately. React 19 Flight
 *   serialises AsyncIterable natively — the client iterates it with a plain
 *   `for await` in useAgentStream, no ai/rsc or encoding layer needed.
 *
 * Auth / RAG run synchronously BEFORE the generator is returned — the stream
 * only starts if the caller is authorised and the prompt is valid.
 *
 * Proxy.ts boundary note:
 *   Next.js 16 Server Functions POST to their originating route, not /api/*.
 *   They are not intercepted by proxy.ts's matcher. The security requirement
 *   is met by keeping all API keys exclusively in server-side env vars.
 */

import { streamText, stepCountIs } from "ai";
import { getModel } from "@/lib/ai/provider-factory";
import { webSearchTool, emailAutomateTool, dbReadTool, dbWriteTool } from "@/features/tools";
import { z } from "zod";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { generateEmbedding, semanticSearch, semanticSearchForAgent } from "@/lib/ai/embeddings";
import { cacheLife } from "next/cache";
import { checkUserCredits, deductCredits, rollbackCredits, DeductCreditsResult } from "@/lib/actions/credit-actions";

// ─── Wire-format event union ──────────────────────────────────────────────────
// Exported so the client hook can import the type without a separate file.
// Both ends must agree on this shape — treat it as a contract.

export type StreamEvent =
  | { type: "text-delta";  delta: string }
  | { type: "tool-call";   toolName: string }
  | { type: "tool-result"; toolName: string }
  | { type: "done" }
  | { type: "error";       message: string };

// ─── Input schema (Zod 4) ─────────────────────────────────────────────────────

const runAgentSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(10_000)
    .describe("The user prompt to send to the agent"),
});

// ─── Base system prompt ───────────────────────────────────────────────────────

const BASE_INSTRUCTIONS = "You are AgentZero, a helpful AI assistant.";

// ─── Cached RAG context fetch ─────────────────────────────────────────────────
// 'use cache' derives its key from the serialized function arguments.
// Passing (query, orgId, agentId?) gives us a 60s cache scoped per-agent (or
// per-org when no agentId is supplied). 'use cache' derives its key from all
// serialised arguments, so org-level and agent-level entries don't collide.
//
// matchThreshold is intentionally low (0.1) during development so the pipeline
// can be verified end-to-end before real embeddings are funded. Raise back to
// 0.7 in production to avoid injecting irrelevant context.

async function fetchRagContext(
  query: string,
  orgId: string,
  agentId: string | null,
): Promise<string | null> {
  "use cache";
  cacheLife({ revalidate: 60 });

  try {
    const embedding = await generateEmbedding(query);

    // Agent-scoped: only chunks from documents uploaded to this agent.
    // Org-scoped fallback: all org documents (legacy / org-level uploads).
    const chunks = agentId
      ? await semanticSearchForAgent(embedding, agentId, adminClient, undefined, 0.1)
      : await semanticSearch(embedding, orgId, adminClient, undefined, 0.1);

    if (chunks.length === 0) return null;

    return (
      "Relevant context from uploaded documents:\n\n" +
      chunks.map((c) => c.content).join("\n\n---\n\n")
    );
  } catch (err) {
    console.warn("[RAG] embedding failed, running without context:", err);
    return null;
  }
}

// ─── Kept for any non-streaming callers ──────────────────────────────────────

export type AgentActionResult =
  | { success: true; text: string }
  | { success: false; error: string };

// ─── Early-exit helper ────────────────────────────────────────────────────────
// Yields a single error event and closes. Used for auth / validation failures
// that occur before the stream opens — keeps the return type uniform.

function errorStream(message: string): AsyncIterable<StreamEvent> {
  return (async function* () {
    yield { type: "error" as const, message };
  })();
}

// ─── Streaming Server Action ──────────────────────────────────────────────────

export async function streamAgentAction(
  rawPrompt: string,
  rawAgentId?: string,
): Promise<AsyncIterable<StreamEvent>> {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  // Runs before the generator is returned. Unauthenticated callers receive a
  // closed iterable with one error event — no tokens, no tool calls, no spend.
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) {
    return errorStream("Unauthorised");
  }
  const { orgId } = session.user;

  // ── Input validation ───────────────────────────────────────────────────────
  const parsed = runAgentSchema.safeParse({ prompt: rawPrompt });
  if (!parsed.success) {
    return errorStream(`Invalid input: ${parsed.error.message}`);
  }

  // ── Agent ownership check + fetch instructions ────────────────────────────
  // Verify the supplied agentId belongs to the session org before using it to
  // scope RAG — prevents cross-org context leakage from a forged client param.
  // Also fetch the agent's saved instructions to use as the system prompt.
  let agentId:           string | null = null;
  let agentInstructions: string | null = null;
  if (rawAgentId) {
    const { data: agentRow } = await adminClient
      .from("agents")
      .select("id, instructions")
      .eq("id", rawAgentId)
      .eq("organisation_id", orgId)
      .single();
    if (agentRow) {
      agentId           = rawAgentId;
      agentInstructions = (agentRow.instructions as string | null) ?? null;
    }
  }

  // ── Credit pre-flight ──────────────────────────────────────────────────────
  const creditCheck = { allowed: true as const };

  // ── RAG context ────────────────────────────────────────────────────────────
  // Runs before the generator is returned. If the org has relevant document
  // chunks they are prepended to the system prompt before the first token.
  // Use the agent's saved instructions as the base; fall back to the default.
  const baseInstructions = agentInstructions?.trim() || BASE_INSTRUCTIONS;
  let instructions = baseInstructions;
  const ragContext = await fetchRagContext(parsed.data.prompt, orgId, agentId);
  if (ragContext) {
    instructions =
      `${ragContext}\n\n` +
      `${baseInstructions}\n\n` +
      `Answer only from the provided context above. ` +
      `Do not use web search for questions that can be answered from the context.`;
  }

  // ── Stream ─────────────────────────────────────────────────────────────────
  // React 19 Flight serialises AsyncIterable natively — the generator is
  // returned immediately and each yielded StreamEvent is transferred to the
  // client as it is produced. The client iterates with a plain `for await`.
  const result = streamText({
    model:    getModel(),
    system:   instructions,
    prompt:   parsed.data.prompt,
    tools:    { webSearchTool, emailAutomateTool, dbReadTool, dbWriteTool },
    stopWhen: stepCountIs(10),   // ReAct loop cap — prevents runaway tool chains
  });

  return (async function* () {
    // Tracks legitimately open text blocks by their id.
    // AI SDK 6 emits text-start before the first text-delta for a block and
    // text-end when it closes. Tool call content that bleeds through as
    // text-delta (a Groq+Llama streaming artefact) has no matching text-start,
    // so it never enters this set and is silently dropped.
    const openTextIds = new Set<string>();
    let deduction: DeductCreditsResult | null = null;

    try {
      // ── Optimistic deduction ─────────────────────────────────────────────
      deduction = await deductCredits(session.user.id);
      if (!deduction.ok) {
        yield { type: "error" as const, message: deduction.message };
        return;
      }

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case "text-start":
            openTextIds.add(chunk.id);
            break;
          case "text-end":
            openTextIds.delete(chunk.id);
            break;
          case "text-delta":
            // Only forward deltas that belong to a known open text block.
            if (openTextIds.has(chunk.id)) {
              yield { type: "text-delta" as const, delta: chunk.text };
            }
            break;
          case "tool-call":
            yield { type: "tool-call" as const, toolName: chunk.toolName };
            break;
          case "tool-result":
            yield { type: "tool-result" as const, toolName: chunk.toolName };
            break;
          case "error": {
            const raw = chunk.error;
            const msg =
              raw instanceof Error
                ? raw.message
                : typeof raw === "object" && raw !== null && "message" in raw
                ? String((raw as { message: unknown }).message)
                : typeof raw === "string"
                ? raw
                : (JSON.stringify(raw) ?? "Stream error.");
            if (deduction?.ok) await rollbackCredits(session.user.id, deduction.deducted);
            yield { type: "error" as const, message: msg };
            return;
          }
          // tool-input-*, finish-step, start-step, start, finish, abort, raw
          // — intentionally ignored.
        }
      }
      yield { type: "done" as const };
    } catch (error) {
      if (deduction?.ok) await rollbackCredits(session.user.id, deduction.deducted);

      const raw = error;
      const message =
        raw instanceof Error
          ? raw.message
          : typeof raw === "object" && raw !== null && "message" in raw
          ? String((raw as { message: unknown }).message)
          : typeof raw === "string"
          ? raw
          : (JSON.stringify(raw) ?? "Agent failed.");
      yield { type: "error" as const, message };
    }
  })();
}
