-- ============================================================
-- AgentZero: Agent Conversations & Message History
-- Migration: 20260425000000
-- Enables multi-turn conversation tracking with session persistence
-- ============================================================

-- 1. CONVERSATIONS
--    Scoped to agents. Users can have multiple conversation threads.
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID        NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  organisation_id UUID        NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  title           TEXT        NOT NULL DEFAULT 'Untitled Conversation',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSATION_MESSAGES
--    Immutable message history. Stores user and assistant turns.
CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations (agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organisation_id ON conversations (organisation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages (conversation_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
