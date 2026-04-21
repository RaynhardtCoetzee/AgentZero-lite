// AgentZero Lite — billing layer removed
import { z } from "zod";

// ─── Subscription lifecycle events ───────────────────────────────────────────
// Payload data.type = "subscriptions". Fired for record-level state changes;
// NO money moves on these. Credits follow money — these are upsert-only.

export const subscriptionEventNameSchema = z.enum([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);
export type SubscriptionEventName = z.infer<typeof subscriptionEventNameSchema>;

export const subscriptionStatusSchema = z.enum([
  "on_trial",
  "active",
  "paused",
  "past_due",
  "unpaid",
  "cancelled",
  "expired",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// ─── Shared: custom_data ─────────────────────────────────────────────────────
// We inject this at checkout creation and LS echoes it back on every webhook
// for the resulting resource. user_id is the only way we map LS → AgentZero.

export const customDataSchema = z
  .object({
    user_id: z.uuid().describe("AgentZero users.id — injected at checkout creation"),
  })
  .describe("custom_data attached when creating the LS checkout URL");

// ─── Subscription payload (data.type = "subscriptions") ──────────────────────

export const subscriptionPayloadSchema = z.object({
  meta: z.object({
    event_name: subscriptionEventNameSchema,
    custom_data: customDataSchema,
  }),
  data: z.object({
    type: z.literal("subscriptions"),
    id: z.string().min(1).describe("Lemon Squeezy subscription ID"),
    attributes: z.object({
      store_id: z.number().int(),
      customer_id: z.number().int(),
      user_email: z.email(),
      status: subscriptionStatusSchema,
      variant_id: z.number().int(),
      variant_name: z.string(),
      renews_at: z.iso.datetime().nullable(),
      ends_at: z.iso.datetime().nullable(),
      trial_ends_at: z.iso.datetime().nullable(),
    }),
  }),
});
export type SubscriptionPayload = z.infer<typeof subscriptionPayloadSchema>;

// ─── Subscription-invoice events (data.type = "subscription-invoices") ───────
// These fire when money actually moves on a subscription — this is where
// credits get granted (on success) or revoked (on refund).

export const subscriptionInvoiceEventNameSchema = z.enum([
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
  "subscription_payment_refunded",
]);
export type SubscriptionInvoiceEventName = z.infer<
  typeof subscriptionInvoiceEventNameSchema
>;

export const invoiceStatusSchema = z.enum(["paid", "void", "refunded"]);
export const billingReasonSchema = z.enum(["initial", "renewal", "updated"]);

export const subscriptionInvoicePayloadSchema = z.object({
  meta: z.object({
    event_name: subscriptionInvoiceEventNameSchema,
    custom_data: customDataSchema,
  }),
  data: z.object({
    type: z.literal("subscription-invoices"),
    id: z.string().min(1).describe("Lemon Squeezy invoice ID"),
    attributes: z.object({
      store_id: z.number().int(),
      subscription_id: z.number().int().describe("LS subscription.id — numeric here, string on subscription payloads"),
      customer_id: z.number().int(),
      user_email: z.email(),
      billing_reason: billingReasonSchema,
      status: invoiceStatusSchema,
      currency: z.string().length(3),
      total: z.number().int().describe("Total paid in minor units (cents)"),
      refunded: z.boolean(),
      refunded_at: z.iso.datetime().nullable(),
      created_at: z.iso.datetime(),
    }),
  }),
});
export type SubscriptionInvoicePayload = z.infer<
  typeof subscriptionInvoicePayloadSchema
>;

// ─── Order events (data.type = "orders") ─────────────────────────────────────
// Fired for one-time purchases (founding tier). Never fires for subscription
// products — those use the invoice events above instead.

export const orderEventNameSchema = z.enum(["order_created", "order_refunded"]);
export type OrderEventName = z.infer<typeof orderEventNameSchema>;

export const orderStatusSchema = z.enum([
  "pending",
  "failed",
  "paid",
  "refunded",
]);

export const orderPayloadSchema = z.object({
  meta: z.object({
    event_name: orderEventNameSchema,
    custom_data: customDataSchema,
  }),
  data: z.object({
    type: z.literal("orders"),
    id: z.string().min(1).describe("Lemon Squeezy order ID"),
    attributes: z.object({
      store_id: z.number().int(),
      customer_id: z.number().int(),
      user_email: z.email(),
      status: orderStatusSchema,
      currency: z.string().length(3),
      total: z.number().int().describe("Total paid in minor units (cents)"),
      refunded: z.boolean(),
      refunded_at: z.iso.datetime().nullable(),
      // LS nests per-order variant info under first_order_item.
      first_order_item: z.object({
        variant_id: z.number().int(),
        variant_name: z.string(),
      }),
      created_at: z.iso.datetime(),
    }),
  }),
});
export type OrderPayload = z.infer<typeof orderPayloadSchema>;

// ─── Router envelope — permissive parse, used only to read event_name ────────

export const webhookEnvelopeSchema = z
  .object({
    meta: z.object({ event_name: z.string().min(1) }),
  })
  .passthrough();
export type WebhookEnvelope = z.infer<typeof webhookEnvelopeSchema>;
