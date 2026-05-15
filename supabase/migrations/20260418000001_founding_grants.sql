-- ============================================================
-- AgentZero: Founding Grants + Atomic Credit RPCs
-- Migration: 20260418000001
--
-- 1. founding_grants                     — audit row per founding purchase.
-- 2. grant_founding_credits              — atomic insert + grant.
-- 3. revoke_founding_credits             — atomic revoke with threshold check.
-- 4. revoke_subscription_invoice_credits — sibling revoke for pro refunds.
--
-- Depends on: 20260418000000_lemonsqueezy_billing.sql (subscriptions table,
-- needs_manual_review column, grant_user_credits RPC).
-- ============================================================

-- ------------------------------------------------------------
-- 1. FOUNDING_GRANTS
--    One row per paid LS order for the founding variant.
--    Refunds set revoked_at rather than deleting so the audit
--    trail survives. UNIQUE(ls_order_id) is the second layer of
--    idempotency on top of webhook_events.body_hash.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS founding_grants (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ls_order_id         TEXT        NOT NULL,
  amount              INT         NOT NULL CHECK (amount > 0),
  granted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at          TIMESTAMPTZ,
  needs_manual_review BOOLEAN     NOT NULL DEFAULT FALSE,
  review_reason       TEXT,
  CONSTRAINT founding_grants_ls_order_id_unique UNIQUE (ls_order_id)
);

CREATE INDEX IF NOT EXISTS idx_founding_grants_user_id ON founding_grants (user_id);

-- Partial index: fast "show me everything ops needs to look at".
CREATE INDEX IF NOT EXISTS idx_founding_grants_needs_review
  ON founding_grants (granted_at DESC)
  WHERE needs_manual_review = TRUE;

ALTER TABLE founding_grants ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. GRANT_FOUNDING_CREDITS
--    Single-transaction insert + credit grant. Returns a text
--    status so the caller can distinguish first-delivery from
--    duplicate without relying on error codes.
--
--      'granted'        — fresh insert, credits applied.
--      'already_exists' — idempotent replay, no credits applied.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION grant_founding_credits(
  p_user_id     UUID,
  p_ls_order_id TEXT,
  p_amount      INT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'grant_founding_credits: amount must be positive, got %', p_amount;
  END IF;

  INSERT INTO founding_grants (user_id, ls_order_id, amount)
  VALUES (p_user_id, p_ls_order_id, p_amount)
  ON CONFLICT (ls_order_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN 'already_exists';
  END IF;

  UPDATE user_credits
     SET credits_remaining = credits_remaining + p_amount
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'grant_founding_credits: no user_credits row for user %', p_user_id;
  END IF;

  RETURN 'granted';
END;
$$;

-- ------------------------------------------------------------
-- 3. REVOKE_FOUNDING_CREDITS
--    Symmetric to grant_founding_credits. Behaviour matrix:
--
--      credits_remaining >= amount → decrement, mark revoked_at, return 'revoked'
--      credits_remaining <  amount → flag needs_manual_review,   return 'needs_review'
--      grant not found             → return 'not_found'
--      already revoked             → return 'already_revoked'
--
--    The rule is binary — we never partially revoke.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revoke_founding_credits(
  p_user_id     UUID,
  p_ls_order_id TEXT,
  p_amount      INT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grant_id   UUID;
  v_revoked_at TIMESTAMPTZ;
  v_remaining  INT;
BEGIN
  SELECT id, revoked_at
    INTO v_grant_id, v_revoked_at
    FROM founding_grants
   WHERE ls_order_id = p_ls_order_id
     FOR UPDATE;

  IF v_grant_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  IF v_revoked_at IS NOT NULL THEN
    RETURN 'already_revoked';
  END IF;

  SELECT credits_remaining INTO v_remaining
    FROM user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'revoke_founding_credits: no user_credits row for user %', p_user_id;
  END IF;

  IF v_remaining >= p_amount THEN
    UPDATE user_credits
       SET credits_remaining = credits_remaining - p_amount
     WHERE user_id = p_user_id;

    UPDATE founding_grants
       SET revoked_at = NOW()
     WHERE id = v_grant_id;

    RETURN 'revoked';
  ELSE
    UPDATE founding_grants
       SET needs_manual_review = TRUE,
           review_reason = FORMAT(
             'Refund requested but credits_remaining (%s) < grant amount (%s)',
             v_remaining, p_amount
           )
     WHERE id = v_grant_id;

    RETURN 'needs_review';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 4. REVOKE_SUBSCRIPTION_INVOICE_CREDITS
--    Pro-tier symmetric revoke, invoked from the
--    subscription_payment_refunded webhook handler.
--
--    Same matrix as revoke_founding_credits, but flags the
--    subscriptions row rather than a per-invoice row — invoice
--    idempotency lives at the webhook_events.body_hash layer.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revoke_subscription_invoice_credits(
  p_user_id            UUID,
  p_ls_subscription_id TEXT,
  p_amount             INT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_id    UUID;
  v_remaining INT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'revoke_subscription_invoice_credits: amount must be positive, got %', p_amount;
  END IF;

  SELECT id INTO v_sub_id
    FROM subscriptions
   WHERE ls_subscription_id = p_ls_subscription_id
     FOR UPDATE;

  IF v_sub_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  SELECT credits_remaining INTO v_remaining
    FROM user_credits
   WHERE user_id = p_user_id
     FOR UPDATE;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'revoke_subscription_invoice_credits: no user_credits row for user %', p_user_id;
  END IF;

  IF v_remaining >= p_amount THEN
    UPDATE user_credits
       SET credits_remaining = credits_remaining - p_amount
     WHERE user_id = p_user_id;

    RETURN 'revoked';
  ELSE
    UPDATE subscriptions
       SET needs_manual_review = TRUE,
           review_reason = FORMAT(
             'Refund requested but credits_remaining (%s) < invoice amount (%s)',
             v_remaining, p_amount
           ),
           updated_at = NOW()
     WHERE id = v_sub_id;

    RETURN 'needs_review';
  END IF;
END;
$$;
