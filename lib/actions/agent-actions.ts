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
import * as tools from "@/features/tools";
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
  | { type: "tool-call";   toolName: string; toolCallId: string; input: unknown }
  | { type: "tool-result"; toolName: string; toolCallId: string; output: unknown }
  | { type: "done" }
  | { type: "error";       message: string };

// ─── Input schema (Zod 4) ─────────────────────────────────────────────────────

const runAgentSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(10_000)
    .describe("The user prompt to send to the agent"),
  modelId: z
    .string()
    .optional()
    .describe("Model ID override for this run"),
  enabledTools: z
    .array(z.string())
    .optional()
    .describe("Tool IDs to enable for this run"),
  attachments: z
    .any()
    .optional()
    .describe("Message content with attachments (images)"),
});

// ─── Base system prompt ───────────────────────────────────────────────────────

const BASE_INSTRUCTIONS = `You are AgentZero, an intelligent AI assistant. \
Always attempt to answer using your available tools before asking for more context.

## Tool-use priority (follow in order)
1. Questions containing "why", "what is the reason", "how does X work", or any strategic / \
   contextual question → call knowledgeSearchTool FIRST to check this org's uploaded documents.
2. Questions requiring up-to-date external information not in the knowledge base → call webSearchTool.
3. Only ask the user for clarification AFTER you have exhausted relevant tool calls and still lack \
   enough information to answer.

## Available tools
- **knowledgeSearchTool** — Semantic search over this org's memo_summaries (uploaded documents, \
  business plans, product memos). Scoped to the current organisation — it will NOT find documents \
  from other orgs. The authoritative source for any "why" or strategic question.
- **webSearchTool** — Real-time web search. Use only when the knowledge base cannot answer the question.

## Error recovery rules
- **knowledgeSearchTool returns 0 results**: retry immediately with minSimilarity: 0.2 and rephrase \
  the query using synonyms (e.g. "business plan" → "revenue strategy roadmap goals"). Report failure \
  only after two attempts.

## Knowledge base scope
The knowledgeSearchTool searches memo_summaries scoped to this organisation's ID only. It does NOT \
search documents from other organisations or external systems. If you cannot find a specific document \
after two retries, tell the user it has not been saved to this org's knowledge base yet and suggest \
they upload it via the Knowledge page.`;

// ─── Cached RAG context fetch ─────────────────────────────────────────────────
// 'use cache' derives its key from the serialized function arguments.
// Passing (query, orgId, agentId?) gives us a 60s cache scoped per-agent (or
// per-org when no agentId is supplied). 'use cache' derives its key from all
// serialised arguments, so org-level and agent-level entries don't collide.
//
// matchThreshold is read from RAG_MATCH_THRESHOLD env var, defaulting to 0.1.

const RAG_MATCH_THRESHOLD = parseFloat(process.env.RAG_MATCH_THRESHOLD ?? "0.1");

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
      ? await semanticSearchForAgent(embedding, agentId, adminClient, undefined, RAG_MATCH_THRESHOLD)
      : await semanticSearch(embedding, orgId, adminClient, undefined, RAG_MATCH_THRESHOLD);

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

// ─── Tool filtering helper ─────────────────────────────────────────────────────
// Maps registry IDs to exported tool names and returns filtered subset.

function filterToolsByIds(toolIds: string[]): Record<string, any> {
  const idToExportName: Record<string, string[]> = {
    web_search: ["webSearchTool"],
    knowledge:  ["knowledgeSearchTool"],
  };

  const filtered: Record<string, any> = {};
  for (const registryId of toolIds) {
    const exportNames = idToExportName[registryId];
    if (exportNames) {
      for (const exportName of exportNames) {
        if (exportName in tools) {
          filtered[exportName] = (tools as Record<string, any>)[exportName];
        }
      }
    }
  }
  // Knowledge search is invisible RAG plumbing — always available to the
  // model regardless of UI toggles, so the LLM can actively pull more context
  // mid-conversation in addition to the pre-stream RAG injection.
  if ("knowledgeSearchTool" in tools) {
    filtered.knowledgeSearchTool = (tools as Record<string, any>).knowledgeSearchTool;
  }
  return filtered;
}

// ─── Streaming Server Action ──────────────────────────────────────────────────

export async function streamAgentAction(
  rawPrompt: string,
  rawAgentId?: string,
  options?: { modelId?: string; enabledTools?: string[]; attachments?: any },
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
  const parsed = runAgentSchema.safeParse({
    prompt: rawPrompt,
    modelId: options?.modelId,
    enabledTools: options?.enabledTools,
    attachments: options?.attachments,
  });
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
  const creditCheck = { ok: true as const, allowed: true as const };

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
  const selectedTools = parsed.data.enabledTools
    ? filterToolsByIds(parsed.data.enabledTools)
    : { ...tools };

  console.log("[streamAgentAction] Model:", parsed.data.modelId, "Prompt:", parsed.data.prompt?.slice(0, 50));

  const result = parsed.data.attachments
    ? streamText({
        model:    getModel(parsed.data.modelId),
        system:   instructions,
        messages: [{ role: "user", content: parsed.data.attachments.content }],
        tools:    selectedTools,
        stopWhen: stepCountIs(10),
      })
    : streamText({
        model:    getModel(parsed.data.modelId),
        system:   instructions,
        prompt:   parsed.data.prompt,
        tools:    selectedTools,
        stopWhen: stepCountIs(10),
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
        console.log("[stream] Received chunk type:", chunk.type, JSON.stringify(chunk).slice(0, 200));
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
            yield { type: "tool-call" as const, toolName: chunk.toolName, toolCallId: chunk.toolCallId, input: chunk.input as unknown };
            break;
          case "tool-result":
            yield { type: "tool-result" as const, toolName: chunk.toolName, toolCallId: chunk.toolCallId, output: chunk.output as unknown };
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
