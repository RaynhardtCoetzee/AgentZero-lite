-- ============================================================
-- AgentZero: Lemon Squeezy Billing Schema
-- Migration: 20260418000000
--
-- 1. subscriptions      — User-lifetime subscription history.
-- 2. webhook_events     — Idempotency log for LS webhook deliveries.
-- 3. grant_user_credits — Atomic RPC, sibling of deduct/refund.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SUBSCRIPTIONS
--    A user may accumulate multiple rows across their lifetime
--    (cancel → resubscribe creates a new row with a new
--    ls_subscription_id). The partial unique index below enforces
--    that at most ONE subscription is "live" for a given user.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ls_subscription_id  TEXT        NOT NULL,
  ls_customer_id      BIGINT      NOT NULL,
  ls_variant_id       BIGINT      NOT NULL,
  tier                TEXT        NOT NULL CHECK (tier IN ('pro', 'founding')),
  status              TEXT        NOT NULL CHECK (
                        status IN ('on_trial', 'active', 'paused',
                                   'past_due', 'unpaid', 'cancelled', 'expired')
                      ),
  renews_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  trial_ends_at       TIMESTAMPTZ,
  -- Set to TRUE when a refund cannot be cleanly reversed against
  -- credits_remaining (e.g. user already spent the refunded credits).
  -- Ops dashboard should surface any row with this flag set.
  needs_manual_review BOOLEAN     NOT NULL DEFAULT FALSE,
  review_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_ls_subscription_id_unique UNIQUE (ls_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON subscriptions (status);

-- Business rule: one live subscription per user at any moment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_live
  ON subscriptions (user_id)
  WHERE status IN ('on_trial', 'active', 'past_due');

-- Ops dashboard: surface any subscription flagged for manual review.
CREATE INDEX IF NOT EXISTS idx_subscriptions_needs_review
  ON subscriptions (updated_at DESC)
  WHERE needs_manual_review = TRUE;

-- ------------------------------------------------------------
-- 2. WEBHOOK_EVENTS
--    Dedupe LS deliveries. Key is SHA-256 of the raw body:
--    retries send identical bytes (rejected), legitimate follow-up
--    events differ in updated_at/timestamp (accepted).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
  id             BIGSERIAL   PRIMARY KEY,
  body_hash      TEXT        NOT NULL,
  event_name     TEXT        NOT NULL,
  ls_resource_id TEXT,
  raw_payload    JSONB       NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at   TIMESTAMPTZ,
  error          TEXT,
  CONSTRAINT webhook_events_body_hash_unique UNIQUE (body_hash)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_name  ON webhook_events (event_name);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events (received_at DESC);

-- ------------------------------------------------------------
-- 3. GRANT_USER_CREDITS
--    Mirrors the deduct/refund RPCs. Adds to credits_remaining
--    without touching credits_used (a grant is not consumption).
--    Raises a clear exception on non-positive amounts or missing
--    user_credits rows — no silent coercion.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION grant_user_credits(
  p_user_id UUID,
  p_amount  INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'grant_user_credits: amount must be positive, got %', p_amount;
  END IF;

  UPDATE user_credits
     SET credits_remaining = credits_remaining + p_amount
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'grant_user_credits: no user_credits row for user %', p_user_id;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Service-role (used by the webhook + Server Actions) bypasses
--    RLS automatically. No user-facing policies yet — if we expose
--    a /billing page that reads subscriptions directly via the
--    browser client later, add a SELECT policy scoped by user_id.
-- ------------------------------------------------------------
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
