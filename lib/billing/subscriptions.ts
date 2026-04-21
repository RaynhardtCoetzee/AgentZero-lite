// AgentZero Lite — billing layer removed
import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import {
  PRO_CREDITS_PER_CYCLE,
  FOUNDING_CREDITS_ONE_TIME,
} from "@/lib/billing/constants";
import type {
  SubscriptionPayload,
  SubscriptionInvoicePayload,
  OrderPayload,
} from "@/lib/billing/webhook-events";

// ─── webhook_events claim (outer idempotency) ────────────────────────────────
// Pattern: INSERT ... ON CONFLICT DO NOTHING. If the row was inserted, we hold
// the lock — proceed. If not, read processed_at: non-null means a prior attempt
// already finished cleanly (skip); null means a prior attempt failed and LS is
// retrying (proceed, same body hash). On handler success, call
// markWebhookProcessed. On failure, markWebhookFailed and return non-2xx.

export type ClaimResult =
  | { status: "claimed" | "retry"; bodyHash: string }
  | { status: "already_processed"; bodyHash: string };

export function hashBody(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export async function claimWebhookEvent(params: {
  rawBody: string;
  eventName: string;
  resourceId: string | null;
  payload: unknown;
}): Promise<ClaimResult> {
  const bodyHash = hashBody(params.rawBody);

  const { data: inserted } = await adminClient
    .from("webhook_events")
    .insert({
      body_hash: bodyHash,
      event_name: params.eventName,
      ls_resource_id: params.resourceId,
      raw_payload: params.payload,
    })
    .select("id")
    .maybeSingle();

  if (inserted) return { status: "claimed", bodyHash };

  const { data: existing } = await adminClient
    .from("webhook_events")
    .select("processed_at")
    .eq("body_hash", bodyHash)
    .single();

  if (existing?.processed_at) return { status: "already_processed", bodyHash };
  return { status: "retry", bodyHash };
}

export async function markWebhookProcessed(bodyHash: string): Promise<void> {
  await adminClient
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString(), error: null })
    .eq("body_hash", bodyHash);
}

export async function markWebhookFailed(bodyHash: string, message: string): Promise<void> {
  await adminClient
    .from("webhook_events")
    .update({ error: message })
    .eq("body_hash", bodyHash);
}

// ─── Variant → tier mapping ──────────────────────────────────────────────────
// LS payloads carry variant_id as a number; our env stores it as a string.
// Normalize to string for comparison.

export function variantIdToTier(variantId: number): Tier | null {
  const asString = String(variantId);
  if (asString === VARIANT.PRO) return "PRO";
  if (asString === VARIANT.FOUNDING) return "FOUNDING";
  return null;
}

// ─── Subscription row upsert (no credits) ────────────────────────────────────

type TierLower = "pro" | "founding";

export type UpsertResult =
  | { ok: true }
  | { ok: false; reason: "unknown_variant" | "db_error"; detail?: string };

export async function upsertSubscription(
  payload: SubscriptionPayload,
): Promise<UpsertResult> {
  const { data } = payload;
  const { custom_data } = payload.meta;
  const { attributes } = data;

  const tier = variantIdToTier(attributes.variant_id);
  if (!tier) {
    return {
      ok: false,
      reason: "unknown_variant",
      detail: `variant_id=${attributes.variant_id} is not configured as PRO or FOUNDING`,
    };
  }
  // Subscriptions only model recurring tiers — defensive guard against a
  // FOUNDING variant accidentally configured as a subscription in LS.
  if (tier === "FOUNDING") {
    return {
      ok: false,
      reason: "unknown_variant",
      detail: "FOUNDING variant received on subscription event — must be one-time in LS",
    };
  }

  const tierLower: TierLower = "pro";

  const { error } = await adminClient
    .from("subscriptions")
    .upsert(
      {
        user_id: custom_data.user_id,
        ls_subscription_id: data.id,
        ls_customer_id: attributes.customer_id,
        ls_variant_id: attributes.variant_id,
        tier: tierLower,
        status: attributes.status,
        renews_at: attributes.renews_at,
        ends_at: attributes.ends_at,
        trial_ends_at: attributes.trial_ends_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ls_subscription_id" },
    );

  if (error) {
    return { ok: false, reason: "db_error", detail: error.message };
  }
  return { ok: true };
}

// ─── Pro credit grant (on subscription_payment_success) ──────────────────────
// Pro credits follow money: every successful invoice (initial + renewal +
// recovered) grants PRO_CREDITS_PER_CYCLE. Idempotency comes from the outer
// webhook_events.body_hash claim — no invoice-level table needed.

export type GrantResult =
  | { ok: true }
  | { ok: false; reason: "not_pro" | "rpc_error"; detail?: string };

export async function grantProCreditsForInvoice(
  payload: SubscriptionInvoicePayload,
): Promise<GrantResult> {
  const { custom_data } = payload.meta;
  const ls_subscription_id = String(payload.data.attributes.subscription_id);

  const { data: sub, error: lookupError } = await adminClient
    .from("subscriptions")
    .select("tier")
    .eq("ls_subscription_id", ls_subscription_id)
    .maybeSingle();

  if (lookupError) return { ok: false, reason: "rpc_error", detail: lookupError.message };
  if (!sub || sub.tier !== "pro") return { ok: false, reason: "not_pro" };

  const { error } = await adminClient.rpc("grant_user_credits", {
    p_user_id: custom_data.user_id,
    p_amount: PRO_CREDITS_PER_CYCLE,
  });

  if (error) return { ok: false, reason: "rpc_error", detail: error.message };
  return { ok: true };
}

// ─── Pro credit revoke (on subscription_payment_refunded) ────────────────────

export type RevokeResult =
  | { ok: true; status: "revoked" | "needs_review" | "not_found" | "already_revoked" }
  | { ok: false; reason: "rpc_error"; detail: string };

export async function revokeProCreditsForInvoice(
  payload: SubscriptionInvoicePayload,
): Promise<RevokeResult> {
  const { custom_data } = payload.meta;
  const ls_subscription_id = String(payload.data.attributes.subscription_id);

  const { data, error } = await adminClient.rpc("revoke_subscription_invoice_credits", {
    p_user_id: custom_data.user_id,
    p_ls_subscription_id: ls_subscription_id,
    p_amount: PRO_CREDITS_PER_CYCLE,
  });

  if (error) return { ok: false, reason: "rpc_error", detail: error.message };
  return {
    ok: true,
    status: data as "revoked" | "needs_review" | "not_found" | "already_revoked",
  };
}

// ─── Founding grant (on order_created) ───────────────────────────────────────

export async function handleFoundingOrder(payload: OrderPayload): Promise<
  | { ok: true; status: "granted" | "already_exists" }
  | { ok: false; reason: "not_founding" | "rpc_error"; detail?: string }
> {
  const { attributes } = payload.data;
  const tier = variantIdToTier(attributes.first_order_item.variant_id);
  if (tier !== "FOUNDING") return { ok: false, reason: "not_founding" };

  const { data, error } = await adminClient.rpc("grant_founding_credits", {
    p_user_id: payload.meta.custom_data.user_id,
    p_ls_order_id: payload.data.id,
    p_amount: FOUNDING_CREDITS_ONE_TIME,
  });

  if (error) return { ok: false, reason: "rpc_error", detail: error.message };
  return { ok: true, status: data as "granted" | "already_exists" };
}

// ─── Founding revoke (on order_refunded) ─────────────────────────────────────

export async function handleFoundingRefund(payload: OrderPayload): Promise<
  | { ok: true; status: "revoked" | "needs_review" | "not_found" | "already_revoked" }
  | { ok: false; reason: "not_founding" | "rpc_error"; detail?: string }
> {
  const { attributes } = payload.data;
  const tier = variantIdToTier(attributes.first_order_item.variant_id);
  if (tier !== "FOUNDING") return { ok: false, reason: "not_founding" };

  const { data, error } = await adminClient.rpc("revoke_founding_credits", {
    p_user_id: payload.meta.custom_data.user_id,
    p_ls_order_id: payload.data.id,
    p_amount: FOUNDING_CREDITS_ONE_TIME,
  });

  if (error) return { ok: false, reason: "rpc_error", detail: error.message };
  return { ok: true, status: data as "revoked" | "needs_review" | "not_found" | "already_revoked" };
}

