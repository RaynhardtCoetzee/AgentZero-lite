-- ============================================================
-- AgentZero: Fix Embedding Vector Dimensions
-- Migration: 20260425000003
--
-- Updates memo_summaries embedding column from 1536 to 1024
-- dimensions to match Cohere embedding provider output.
-- ============================================================

-- Drop existing index before altering column
DROP INDEX IF EXISTS idx_memo_summaries_embedding;

-- Drop and recreate embedding column with correct dimension
ALTER TABLE memo_summaries
  DROP COLUMN IF EXISTS embedding;

ALTER TABLE memo_summaries
  ADD COLUMN embedding vector(1024);

-- Recreate index with correct dimension
CREATE INDEX IF NOT EXISTS idx_memo_summaries_embedding
  ON memo_summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
