-- ============================================================
-- AgentZero: Add Document Content Storage
-- Migration: 20260504000000
--
-- Adds content column to documents table to store full extracted
-- text for preview rendering in the Knowledge UI.
-- ============================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content TEXT;
