-- ============================================================
-- AgentZero: Fix Schema for NVIDIA NIMs
-- Migration: 20260425000005
--
-- Updates memo_summaries embedding column to 1024 dimensions
-- for NVIDIA NIMs nv-embed-qa-mistral-7b-v3 output.
-- ============================================================

DROP INDEX IF EXISTS idx_memo_summaries_embedding;

ALTER TABLE memo_summaries
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE memo_summaries
  ADD COLUMN embedding vector(1024);

CREATE INDEX IF NOT EXISTS idx_memo_summaries_embedding
  ON memo_summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
