-- ============================================================
-- AgentZero: Fix Memo Summaries Schema
-- Migration: 20260425000001_memo_summaries_fix
--
-- Adds missing columns to existing memo_summaries table
-- ============================================================

-- Add missing columns if they don't exist
ALTER TABLE memo_summaries
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Memory',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_memo_summaries_organisation_id ON memo_summaries (organisation_id);
CREATE INDEX IF NOT EXISTS idx_memo_summaries_agent_id ON memo_summaries (agent_id);
CREATE INDEX IF NOT EXISTS idx_memo_summaries_user_id ON memo_summaries (user_id);
CREATE INDEX IF NOT EXISTS idx_memo_summaries_created_at ON memo_summaries (created_at DESC);

-- GiST index for tag filtering
CREATE INDEX IF NOT EXISTS idx_memo_summaries_tags ON memo_summaries USING GIN (tags);

-- Enable RLS if not already enabled
ALTER TABLE memo_summaries ENABLE ROW LEVEL SECURITY;
