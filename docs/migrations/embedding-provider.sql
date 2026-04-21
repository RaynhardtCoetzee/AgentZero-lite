-- ============================================================================
-- embedding-provider.sql
-- Run this in Supabase SQL Editor when switching EMBEDDING_PROVIDER.
--
-- You cannot mix embedding dimensions in one table. This migration:
--   1. Clears all existing chunks (they are invalid after a dimension change).
--   2. Drops the old vector index.
--   3. Alters the embedding column to the new dimension.
--   4. Recreates the ivfflat index for the new dimension.
--
-- ⚠️  After running, re-upload all documents so they are re-embedded.
-- ============================================================================

-- ── Step 1: Clear existing chunks ───────────────────────────────────────────
-- They were embedded with the old provider and are no longer compatible.
TRUNCATE TABLE document_chunks;

-- ── Step 2: Drop the existing vector index ──────────────────────────────────
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- ── Step 3: Change the vector column dimension ──────────────────────────────
-- Run the block that matches your NEW EMBEDDING_PROVIDER value:

-- → Switching TO "cohere" (1024 dimensions):
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(1024);

-- → Switching TO "openai" (1536 dimensions):
-- ALTER TABLE document_chunks
--   ALTER COLUMN embedding TYPE vector(1536);

-- ── Step 4: Recreate the ivfflat index ──────────────────────────────────────
-- lists=100 is a safe default for up to ~500k rows.
-- Increase once you have real traffic data.
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
