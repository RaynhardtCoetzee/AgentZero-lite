-- ============================================================
-- AgentZero: Revert to OpenAI Embeddings
-- Migration: 20260425000004
--
-- Updates memo_summaries embedding column from 1024 back to 1536
-- dimensions for OpenAI text-embedding-3-small (production).
-- ============================================================

DROP INDEX IF EXISTS idx_memo_summaries_embedding;

ALTER TABLE memo_summaries
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE memo_summaries
  ADD COLUMN embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_memo_summaries_embedding
  ON memo_summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
