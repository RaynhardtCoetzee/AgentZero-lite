-- ============================================================
-- AgentZero: Multi-Tenant Schema
-- Migration: 20260325000000
-- Schema: organisations → users → agents
-- ============================================================

-- 1. ORGANISATIONS
--    Root of the tenant hierarchy. Every user and agent belongs to one.
CREATE TABLE IF NOT EXISTS organisations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organisations_slug_unique UNIQUE (slug)
);

-- 2. USERS
--    Auth.js manages identity; we store the org link and password hash here.
--    password_hash: bcrypt hash — never store plaintext.
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL,
  name            TEXT,
  organisation_id UUID        NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  password_hash   TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- 3. AGENTS
--    AI agents are scoped to an organisation, not a user.
--    This allows org-level sharing without exposing cross-tenant data.
CREATE TABLE IF NOT EXISTS agents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  instructions    TEXT,
  organisation_id UUID        NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_organisation_id  ON users  (organisation_id);
CREATE INDEX IF NOT EXISTS idx_agents_organisation_id ON agents (organisation_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables locked down. The service-role key (used in auth
-- callbacks and Server Actions) bypasses RLS automatically.
-- User-facing read policies will be added in the next migration
-- once the Auth.js JWT → Supabase session bridge is complete.
-- ============================================================
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
