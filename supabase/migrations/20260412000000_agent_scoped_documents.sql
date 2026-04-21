-- ============================================================
-- AgentZero: Agent-Scoped Documents
-- Migration: 20260412000000
--
-- 1. Adds agent_id (nullable) to documents so uploads can be
--    scoped to a specific agent rather than just an org.
-- 2. Creates match_agent_chunks() — a pgvector similarity search
--    scoped to a single agent via a JOIN with documents.
-- ============================================================

-- 1. Add agent_id to documents (nullable — org-level docs remain valid)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_agent_id ON documents (agent_id);

-- 2. Agent-scoped semantic search RPC
--    Mirrors match_chunks() but joins document_chunks → documents
--    and filters by agent_id instead of org_id.
--    Called by semanticSearchForAgent() in lib/ai/embeddings.ts.
CREATE OR REPLACE FUNCTION match_agent_chunks(
  query_embedding  vector,
  match_threshold  float,
  match_count      int,
  filter_agent_id  uuid
)
RETURNS TABLE (content text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.agent_id = filter_agent_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
