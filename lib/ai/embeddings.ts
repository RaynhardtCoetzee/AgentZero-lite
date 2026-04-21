/**
 * lib/ai/embeddings.ts — RAG Embedding Utilities
 *
 * Covers the full embedding pipeline:
 *   1. generateEmbedding  — text → vector (provider-aware)
 *   2. storeChunks        — vector[] → document_chunks table
 *   3. semanticSearch     — query vector → ranked chunks via match_chunks RPC
 *
 * Embedding provider is controlled by EMBEDDING_PROVIDER env var:
 *   "openai"  — text-embedding-3-small, 1536 dimensions (default for production)
 *   "cohere"  — embed-english-v3.0, 1024 dimensions (free tier, good for dev/testing)
 *
 * ⚠️  Dimension mismatch warning:
 *   Switching providers on an existing database requires re-embedding all chunks
 *   and running the Supabase migration in /docs/migrations/embedding-provider.sql
 *   to alter the vector column dimension. You cannot mix dimensions in one table.
 *
 * All functions validate their inputs with Zod 4 and throw on failure.
 * Never silently coerce bad input.
 *
 * NOTE — ivfflat.probes optimisation:
 *   When document_chunks grows past ~3,000 rows, add a SET call before the
 *   RPC to tune recall vs. speed:
 *     await supabase.rpc('exec_sql', { sql: 'SET ivfflat.probes = 10' })
 *   This requires a privileged helper function in Postgres. Leave it out
 *   until you have enough data for the index to matter.
 */

import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { cohere } from "@ai-sdk/cohere";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Provider resolution
// ---------------------------------------------------------------------------

type EmbeddingProvider = "openai" | "cohere";

function getEmbeddingProvider(): EmbeddingProvider {
  const val = process.env.EMBEDDING_PROVIDER ?? "openai";
  if (val === "openai" || val === "cohere") return val;
  throw new Error(
    `Unknown EMBEDDING_PROVIDER: "${val}". Valid values: "openai" | "cohere"`
  );
}

/** Returns the embedding model and its output dimension for the active provider. */
function getEmbeddingModel(): { model: Parameters<typeof embed>[0]["model"]; dimensions: number } {
  const provider = getEmbeddingProvider();
  switch (provider) {
    case "openai":
      return { model: openai.embedding("text-embedding-3-small"), dimensions: 1536 };
    case "cohere":
      return { model: cohere.embedding("embed-english-v3.0"), dimensions: 1024 };
  }
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * Builds an embedding vector schema for the current provider's dimension.
 * Called at runtime so it reflects the active EMBEDDING_PROVIDER.
 */
function buildEmbeddingSchema(dimensions: number) {
  return z
    .array(z.number().finite())
    .length(dimensions)
    .describe(
      `A ${dimensions}-dimension vector of finite floats. Must have exactly ${dimensions} elements.`
    );
}

// ---------------------------------------------------------------------------
// generateEmbedding
// ---------------------------------------------------------------------------

const generateEmbeddingInputSchema = z
  .object({
    text: z
      .string()
      .min(1)
      .max(8191)
      .describe(
        "The raw text to embed. Must be non-empty and under 8,191 characters. Chunk your document before calling if needed."
      ),
  })
  .strict();

/**
 * Converts a string into an embedding vector using the active EMBEDDING_PROVIDER.
 *
 * @throws {ZodError}  if `text` is empty or exceeds the character limit
 * @throws {Error}     if the embedding API call fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { text: validatedText } = generateEmbeddingInputSchema.parse({ text });
  const { model } = getEmbeddingModel();

  const { embedding } = await embed({
    model,
    value: validatedText,
  });

  return embedding;
}

// ---------------------------------------------------------------------------
// storeChunks
// ---------------------------------------------------------------------------

/**
 * Inserts pre-computed chunks into the document_chunks table in a single batch.
 * Accepts an injected Supabase client so callers control which key (anon vs. service-role) is used.
 *
 * @throws {ZodError}  if chunks or orgId fail validation
 * @throws {Error}     if the Supabase insert fails
 */
export async function storeChunks(
  chunks: { content: string; embedding: number[]; documentId: string }[],
  orgId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { dimensions } = getEmbeddingModel();
  const embeddingSchema = buildEmbeddingSchema(dimensions);

  const chunkSchema = z
    .object({
      content: z
        .string()
        .min(1)
        .describe("The raw text of this chunk, as it will be stored and returned during retrieval."),
      embedding: embeddingSchema,
      documentId: z
        .string()
        .uuid()
        .describe("UUID of the parent document in the documents table. Must already exist."),
    })
    .strict();

  z.object({
    chunks: z
      .array(chunkSchema)
      .min(1)
      .describe("One or more chunks to insert. Each must include content, embedding, and documentId."),
    orgId: z
      .string()
      .uuid()
      .describe("UUID of the organisation that owns these chunks."),
  })
    .strict()
    .parse({ chunks, orgId });

  const rows = chunks.map((chunk) => ({
    document_id: chunk.documentId,
    content: chunk.content,
    embedding: chunk.embedding,
  }));

  const { error } = await supabase.from("document_chunks").insert(rows);

  if (error) {
    throw new Error(`[storeChunks] Supabase insert failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// semanticSearch
// ---------------------------------------------------------------------------

const semanticSearchBaseSchema = z
  .object({
    orgId: z
      .string()
      .uuid()
      .describe(
        "UUID of the organisation to scope the search to. Passed as filter_org_id to the match_chunks RPC."
      ),
    matchCount: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(5)
      .describe("Maximum number of chunks to return, ordered by similarity. Defaults to 5, capped at 50."),
    matchThreshold: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.7)
      .describe(
        "Minimum cosine similarity score to include a chunk. 0 = include everything, 1 = exact match only. Defaults to 0.7."
      ),
  })
  .strict();

const semanticSearchOutputSchema = z
  .array(
    z
      .object({
        content: z
          .string()
          .describe("The text of the matched chunk, ready to inject into a prompt."),
        similarity: z
          .number()
          .describe("Cosine similarity score between 0 and 1. Higher = more relevant."),
      })
  )
  .describe("Ranked list of matching chunks, most similar first.");

/**
 * Runs a cosine-similarity search via the match_chunks Postgres function.
 * Results are ordered by similarity descending (most relevant first).
 *
 * @throws {ZodError}  if any input fails validation
 * @throws {Error}     if the Supabase RPC call fails
 */
export async function semanticSearch(
  queryEmbedding: number[],
  orgId: string,
  supabase: SupabaseClient,
  matchCount?: number,
  matchThreshold?: number,
): Promise<{ content: string; similarity: number }[]> {
  const { dimensions } = getEmbeddingModel();
  const embeddingSchema = buildEmbeddingSchema(dimensions);

  const { queryEmbedding: validatedEmbedding, ...rest } = z
    .object({
      queryEmbedding: embeddingSchema.describe("The embedding of the user's query."),
      ...semanticSearchBaseSchema.shape,
    })
    .parse({ queryEmbedding, orgId, matchCount, matchThreshold });

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding:  validatedEmbedding,
    match_threshold:  rest.matchThreshold,
    match_count:      rest.matchCount,
    filter_org_id:    rest.orgId,
  });

  if (error) {
    throw new Error(`[semanticSearch] match_chunks RPC failed: ${error.message}`);
  }

  return semanticSearchOutputSchema.parse(data ?? []);
}

// ---------------------------------------------------------------------------
// semanticSearchForAgent
// ---------------------------------------------------------------------------

/**
 * Agent-scoped variant of semanticSearch. Calls match_agent_chunks(), which
 * joins document_chunks → documents and filters by agent_id.
 *
 * Use this instead of semanticSearch when the caller has a specific agentId
 * so that only documents uploaded to that agent are considered.
 *
 * @throws {ZodError}  if any input fails validation
 * @throws {Error}     if the Supabase RPC call fails
 */
export async function semanticSearchForAgent(
  queryEmbedding: number[],
  agentId: string,
  supabase: SupabaseClient,
  matchCount?: number,
  matchThreshold?: number,
): Promise<{ content: string; similarity: number }[]> {
  const { dimensions } = getEmbeddingModel();
  const embeddingSchema = buildEmbeddingSchema(dimensions);

  const agentSearchSchema = z.object({
    queryEmbedding: embeddingSchema.describe("The embedding of the user's query."),
    agentId: z
      .string()
      .uuid()
      .describe("UUID of the agent to scope the search to."),
    matchCount: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(5)
      .describe("Maximum number of chunks to return. Defaults to 5."),
    matchThreshold: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.7)
      .describe("Minimum cosine similarity score. Defaults to 0.7."),
  });

  const parsed = agentSearchSchema.parse({
    queryEmbedding,
    agentId,
    matchCount,
    matchThreshold,
  });

  const { data, error } = await supabase.rpc("match_agent_chunks", {
    query_embedding:  parsed.queryEmbedding,
    match_threshold:  parsed.matchThreshold,
    match_count:      parsed.matchCount,
    filter_agent_id:  parsed.agentId,
  });

  if (error) {
    throw new Error(`[semanticSearchForAgent] match_agent_chunks RPC failed: ${error.message}`);
  }

  return semanticSearchOutputSchema.parse(data ?? []);
}
