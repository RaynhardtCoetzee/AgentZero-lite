"use server";

import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { INSUFFICIENT_CREDITS_MESSAGE } from "@/lib/credits/constants";

// ─── Output schema (Zod 4) ────────────────────────────────────────────────────

const creditCheckResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }).describe("Sufficient credits — proceed"),
  z
    .object({ ok: z.literal(false), status: z.literal(402), message: z.string() })
    .describe("Insufficient credits"),
]);

export type CreditCheckResult = z.infer<typeof creditCheckResultSchema>;

// ─── Pre-flight credit check ──────────────────────────────────────────────────
// Call this BEFORE ToolLoopAgent/streamText. Uses the service-role client so
// RLS does not interfere with server-side reads.

export async function checkUserCredits(userId: string): Promise<CreditCheckResult> {
  const { data, error } = await adminClient
    .from("user_credits")
    .select("credits_remaining")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { ok: false, status: 402, message: "Credit record not found." };
  }

  if (data.credits_remaining <= 0) {
    return { ok: false, status: 402, message: INSUFFICIENT_CREDITS_MESSAGE };
  }

  return { ok: true };
}

// ─── Optimistic credit deduction ──────────────────────────────────────────────
// Call immediately AFTER pre-flight passes, BEFORE streamText starts.
// Decrements credits_remaining and increments credits_used in one atomic RPC.
// Returns the deducted amount so the caller can pass it to rollback if needed.

const deductCreditsSchema = z.object({
  userId: z.uuid().describe("Authenticated user's ID"),
  amount: z.number().int().positive().describe("Credits to lock for this run"),
});

const deductCreditsResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), deducted: z.number() }).describe("Credits locked"),
  z
    .object({ ok: z.literal(false), status: z.literal(402), message: z.string() })
    .describe("Deduction failed"),
]);

export type DeductCreditsResult = z.infer<typeof deductCreditsResultSchema>;

export async function deductCredits(
  userId: string,
  amount = 1,
): Promise<DeductCreditsResult> {
  const input = deductCreditsSchema.safeParse({ userId, amount });
  if (!input.success) {
    return { ok: false, status: 402, message: `Invalid input: ${input.error.message}` };
  }

  const { error } = await adminClient.rpc("deduct_user_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    return { ok: false, status: 402, message: "Failed to lock credits. Please retry." };
  }

  return { ok: true, deducted: amount };
}

// ─── Credit rollback ──────────────────────────────────────────────────────────
// Call inside the agent's catch block if streamText throws or a tool fails.
// Mirrors deductCredits exactly — restores credits_remaining, unwinds credits_used.

const rollbackCreditsResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }).describe("Rollback succeeded"),
  z.object({ ok: z.literal(false), message: z.string() }).describe("Rollback failed — log and alert"),
]);

export type RollbackCreditsResult = z.infer<typeof rollbackCreditsResultSchema>;

export async function rollbackCredits(
  userId: string,
  amount: number,
): Promise<RollbackCreditsResult> {
  const { error } = await adminClient.rpc("refund_user_credits", {
    p_user_id: userId,
    p_amount:  amount,
  });

  if (error) {
    // Do not re-throw — a failed rollback must never crash the error handler.
    // Log it so ops can manually reconcile.
    console.error("[credits] rollback failed — manual reconciliation required", {
      userId,
      amount,
      error,
    });
    return { ok: false, message: "Rollback failed. Support has been notified." };
  }

  return { ok: true };
}
