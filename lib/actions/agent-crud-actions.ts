"use server";

/**
 * lib/actions/agent-crud-actions.ts — Agent CRUD Server Actions
 *
 * Provides listing and creation of agent rows.
 * All queries are scoped to the session user's orgId — no cross-org leakage.
 */

import { auth } from "@/auth";
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

export async function createAgent(): Promise<CreateAgentResult> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { success: false, error: "Unauthorised" };
  }

  const { orgId } = session.user;

  // Count existing agents so we can name the new one "Agent N".
  const { count } = await adminClient
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", orgId);

  const n = (count ?? 0) + 1;

  const { data, error } = await adminClient
    .from("agents")
    .insert({ name: `Agent ${n}`, organisation_id: orgId })
    .select("id")
    .single();

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
