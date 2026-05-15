// AgentZero Lite — billing layer removed
"use server";

import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// ─── Input schemas ────────────────────────────────────────────────────────────

const createConversationSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
});

const saveMessageSchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const updateConversationTitleSchema = z.object({
  conversationId: z.string().uuid(),
  title: z.string().min(1).max(255),
});

// ─── Create conversation ──────────────────────────────────────────────────────

export async function createConversation(
  agentId: string,
  title?: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { ok: false, message: "Unauthorised" };
  }

  const parsed = createConversationSchema.safeParse({ agentId, title });
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  // Verify agent belongs to org
  const { data: agent } = await adminClient
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .eq("organisation_id", session.user.orgId)
    .single();

  if (!agent) {
    return { ok: false, message: "Agent not found" };
  }

  const { data: conversation, error } = await adminClient
    .from("conversations")
    .insert({
      agent_id: agentId,
      organisation_id: session.user.orgId,
      title: title || "Untitled Conversation",
    })
    .select("id")
    .single();

  if (error || !conversation) {
    return { ok: false, message: "Failed to create conversation" };
  }

  return { ok: true, conversationId: conversation.id };
}

// ─── Save message ────────────────────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { ok: false, message: "Unauthorised" };
  }

  const parsed = saveMessageSchema.safeParse({ conversationId, role, content });
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  // Verify conversation belongs to org
  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organisation_id", session.user.orgId)
    .single();

  if (!conversation) {
    return { ok: false, message: "Conversation not found" };
  }

  const { error } = await adminClient
    .from("conversation_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
    });

  if (error) {
    return { ok: false, message: "Failed to save message" };
  }

  return { ok: true };
}

// ─── Load conversation ────────────────────────────────────────────────────────

export async function loadConversation(
  conversationId: string,
): Promise<
  | { ok: true; messages: Array<{ id: string; role: "user" | "assistant"; content: string }> }
  | { ok: false; message: string }
> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { ok: false, message: "Unauthorised" };
  }

  // Verify conversation belongs to org
  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organisation_id", session.user.orgId)
    .single();

  if (!conversation) {
    return { ok: false, message: "Conversation not found" };
  }

  const { data: messages, error } = await adminClient
    .from("conversation_messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, message: "Failed to load conversation" };
  }

  return { ok: true, messages: messages || [] };
}

// ─── List conversations ───────────────────────────────────────────────────────

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
  last_message_role: "user" | "assistant" | null;
  last_message_at: string | null;
};

export async function listConversations(
  agentId: string,
): Promise<
  | { ok: true; conversations: ConversationSummary[] }
  | { ok: false; message: string }
> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { ok: false, message: "Unauthorised" };
  }

  // 1. Fetch conversations
  const { data: conversations, error } = await adminClient
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("agent_id", agentId)
    .eq("organisation_id", session.user.orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { ok: false, message: "Failed to load conversations" };
  }

  if (!conversations || conversations.length === 0) {
    return { ok: true, conversations: [] };
  }

  // 2. For each conversation, fetch message count + last message
  const ids = conversations.map((c) => c.id as string);

  const [{ data: counts }, { data: lastMessages }] = await Promise.all([
    adminClient
      .from("conversation_messages")
      .select("conversation_id")
      .in("conversation_id", ids),
    adminClient
      .from("conversation_messages")
      .select("conversation_id, role, content, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = row.conversation_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  const lastMap = new Map<string, { role: "user" | "assistant"; content: string; created_at: string }>();
  for (const row of lastMessages ?? []) {
    const id = row.conversation_id as string;
    if (!lastMap.has(id)) {
      lastMap.set(id, {
        role: row.role as "user" | "assistant",
        content: row.content as string,
        created_at: row.created_at as string,
      });
    }
  }

  const enriched: ConversationSummary[] = conversations.map((c) => {
    const last = lastMap.get(c.id as string);
    return {
      id: c.id as string,
      title: c.title as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      message_count: countMap.get(c.id as string) ?? 0,
      last_message: last?.content ?? null,
      last_message_role: last?.role ?? null,
      last_message_at: last?.created_at ?? null,
    };
  });

  return { ok: true, conversations: enriched };
}

// ─── Update conversation title ────────────────────────────────────────────

export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return { ok: false, message: "Unauthorised" };
  }

  const parsed = updateConversationTitleSchema.safeParse({ conversationId, title });
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  // Verify conversation belongs to org
  const { data: conversation } = await adminClient
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organisation_id", session.user.orgId)
    .single();

  if (!conversation) {
    return { ok: false, message: "Conversation not found" };
  }

  const { error } = await adminClient
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);

  if (error) {
    return { ok: false, message: "Failed to update conversation" };
  }

  return { ok: true };
}
