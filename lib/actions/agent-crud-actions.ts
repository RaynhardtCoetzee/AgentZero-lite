"use server";

/**
 * lib/actions/agent-crud-actions.ts — Agent CRUD Server Actions
 *
 * Provides listing and creation of agent rows.
 * All queries are scoped to the session user's orgId — no cross-org leakage.
 */

import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Agent = {
  id:              string;
  name:            string;
  instructions:    string | null;
  organisation_id: string;
  created_at:      string;
};

// ─── List agents for the current org ─────────────────────────────────────────

export async function getOrgAgents(): Promise<Agent[]> {
  const session = await auth();
  if (!session?.user?.orgId) return [];

  const { data, error } = await adminClient
    .from("agents")
    .select("id, name, instructions, organisation_id, created_at")
    .eq("organisation_id", session.user.orgId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Agent[];
}

// ─── Create a new agent for the current org ───────────────────────────────────

export type CreateAgentResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function createAgent(
  name?: string,
  instructions?: string,
): Promise<CreateAgentResult> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { success: false, error: "Unauthorised" };
  }

  const { orgId } = session.user;

  // Count existing agents so we can name the new one "Agent N" if no name provided.
  let finalName = name?.trim();
  if (!finalName) {
    const { count } = await adminClient
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId);

    const n = (count ?? 0) + 1;
    finalName = `Agent ${n}`;
  }

  const { data, error } = await adminClient
    .from("agents")
    .insert({
      name: finalName,
      instructions: instructions ?? null,
      organisation_id: orgId,
    })
    .select("id")
    .single();

  // Stale-session guard: PG 23503 = FK violation. The JWT's orgId points at an
  // organisation row that no longer exists — sign the user out so the next
  // login mints a fresh token against the current DB state.
  if (error?.code === "23503") {
    await signOut({ redirect: false });
    redirect("/login?reason=stale_session");
  }

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create agent" };
  }

  return { success: true, id: data.id as string };
}

// ─── Update an agent's name and instructions ──────────────────────────────────

export type UpdateAgentResult =
  | { success: true }
  | { success: false; error: string };

export async function updateAgent(
  agentId: string,
  fields: { name?: string; instructions?: string },
): Promise<UpdateAgentResult> {
  const session = await auth();
  if (!session?.user?.orgId) return { success: false, error: "Unauthorised" };

  const { error } = await adminClient
    .from("agents")
    .update(fields)
    .eq("id", agentId)
    .eq("organisation_id", session.user.orgId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Delete agents ───────────────────────────────────────────────────────────

export type DeleteAgentsResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

export async function deleteAgents(
  agentIds: string[],
): Promise<DeleteAgentsResult> {
  const session = await auth();
  if (!session?.user?.orgId) return { success: false, error: "Unauthorised" };

  if (agentIds.length === 0) {
    return { success: false, error: "No agents to delete" };
  }

  const { error, count } = await adminClient
    .from("agents")
    .delete()
    .eq("organisation_id", session.user.orgId)
    .in("id", agentIds);

  if (error) return { success: false, error: error.message };
  return { success: true, deletedCount: count ?? 0 };
}

// ─── Duplicate an agent ──────────────────────────────────────────────────────

export type DuplicateAgentResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function duplicateAgent(
  agentId: string,
): Promise<DuplicateAgentResult> {
  const session = await auth();
  if (!session?.user?.orgId) return { success: false, error: "Unauthorised" };

  const { data: original, error: fetchError } = await adminClient
    .from("agents")
    .select("name, instructions")
    .eq("id", agentId)
    .eq("organisation_id", session.user.orgId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: "Agent not found" };
  }

  const { data: newAgent, error: createError } = await adminClient
    .from("agents")
    .insert({
      name: `${original.name} (copy)`,
      instructions: original.instructions,
      organisation_id: session.user.orgId,
    })
    .select("id")
    .single();

  if (createError || !newAgent) {
    return { success: false, error: createError?.message ?? "Failed to duplicate agent" };
  }

  return { success: true, id: newAgent.id as string };
}

// ─── Save message to memo_summaries (long-term memory) ───────────────────────

import { z } from "zod";

const saveMemoSchema = z.object({
  content: z.string().min(1, "Content required").describe("Message text to save"),
  agentId: z.string().uuid("Valid agent ID required"),
  title: z.string().optional().describe("User-provided or auto-generated title"),
  tags: z.array(z.string()).optional().describe("Categorization tags"),
});

export type SaveMemoResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function saveMemoSummary(
  content: string,
  agentId: string,
  title?: string,
  tags?: string[],
): Promise<SaveMemoResult> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.orgId) {
    return { success: false, error: "Unauthorised" };
  }

  const input = saveMemoSchema.safeParse({ content, agentId, title, tags });
  if (!input.success) {
    return { success: false, error: `Invalid input: ${input.error.message}` };
  }

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(content);
  } catch (err) {
    console.warn("[memo] embedding generation failed, storing without vector:", err);
  }

  const { data, error } = await adminClient
    .from("memo_summaries")
    .insert({
      user_id: session.user.id,
      organisation_id: session.user.orgId,
      agent_id: agentId,
      content: content,
      title: title || "Untitled Memory",
      tags: tags || [],
      embedding: embedding,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to save memory" };
  }

  return { success: true, id: data.id as string };
}

// ─── Semantic search memo_summaries (cross-agent RAG) ──────────────────────

import { generateEmbedding } from "@/lib/ai/embeddings";

export type MemoSearchResult = {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  tags: string[];
  similarity: number;
};

const searchMemosSchema = z.object({
  query: z.string().min(1, "Query required").describe("Search query text"),
  limit: z.number().int().positive().default(5).describe("Max results"),
  minSimilarity: z.number().min(0).max(1).default(0.5).describe("Similarity threshold"),
});

export type SearchMemosResult =
  | { success: true; results: MemoSearchResult[] }
  | { success: false; error: string };

export async function searchMemos(
  query: string,
  limit = 5,
  minSimilarity = 0.5,
): Promise<SearchMemosResult> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { success: false, error: "Unauthorised" };
  }

  const input = searchMemosSchema.safeParse({ query, limit, minSimilarity });
  if (!input.success) {
    return { success: false, error: `Invalid input: ${input.error.message}` };
  }

  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await adminClient.rpc("match_memo_summaries", {
      query_embedding: queryEmbedding,
      match_threshold: minSimilarity,
      match_count: limit,
      filter_org_id: session.user.orgId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      results: (data || []) as MemoSearchResult[],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Embedding failed",
    };
  }
}
