// AgentZero Lite — billing layer removed
import "server-only";
import { z } from "zod";

// ─── LS Checkout response schema (Zod 4) ─────────────────────────────────────
// The LS /v1/checkouts endpoint returns JSON:API. We only need the hosted URL.
// Keep the schema narrow — if LS adds fields, we ignore them. If `data.attributes.url`
// disappears or is non-string, we throw instead of handing a bad URL to callers.

const checkoutResponseSchema = z.object({
  data: z.object({
    type: z.literal("checkouts"),
    id: z.string().min(1).describe("LS checkout resource ID"),
    attributes: z.object({
      url: z.url().describe("Hosted Lemon Squeezy checkout URL"),
    }),
  }),
});

// ─── Core helper: build the JSON:API body and POST to /v1/checkouts ──────────
// custom_data.user_id is the only mapping LS → AgentZero we control. The webhook
// handler reads it back off every subsequent event for the resulting resource.
// redirect_url lands the user on our domain after a successful checkout.

export async function createLemonSqueezyCheckout(params: {
  tier: Tier;
  userId: string;
  redirectUrl: string;
}): Promise<{ url: string; checkoutId: string }> {
  const variantId = VARIANT[params.tier];

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: { user_id: params.userId },
        },
        product_options: {
          redirect_url: params.redirectUrl,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: lsEnv.LEMONSQUEEZY_STORE_ID },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const raw = await lsFetch<unknown>("/checkouts", {
    method: "POST",
    json: body,
  });

  const parsed = checkoutResponseSchema.parse(raw);
  return {
    url: parsed.data.attributes.url,
    checkoutId: parsed.data.id,
  };
}
