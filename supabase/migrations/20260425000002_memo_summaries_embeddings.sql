-- ============================================================
-- AgentZero: Vector Embeddings for Memo Summaries
-- Migration: 20260425000002
--
-- Adds pgvector support + embedding column for semantic search.
-- Enables cross-agent RAG via similarity matching.
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to memo_summaries
ALTER TABLE memo_summaries
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Vector similarity search RPC
--    Returns top N memo summaries by semantic similarity
--    scoped to organisation_id for multi-tenant isolation.
CREATE OR REPLACE FUNCTION match_memo_summaries(
  query_embedding  vector,
  match_threshold  float,
  match_count      int,
  filter_org_id    uuid
)
RETURNS TABLE (
  id         uuid,
  agent_id   uuid,
  title      text,
  content    text,
  tags       text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ms.id::uuid,
    ms.agent_id::uuid,
    ms.title,
    ms.content,
    ms.tags,
    (1 - (ms.embedding <=> query_embedding))::float AS similarity
  FROM memo_summaries ms
  WHERE ms.organisation_id = filter_org_id
    AND ms.embedding IS NOT NULL
    AND 1 - (ms.embedding <=> query_embedding) > match_threshold
  ORDER BY ms.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- 4. Index for fast vector search
CREATE INDEX IF NOT EXISTS idx_memo_summaries_embedding
  ON memo_summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
