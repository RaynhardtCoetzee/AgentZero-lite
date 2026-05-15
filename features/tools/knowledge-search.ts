// Team knowledge search tool
import { tool } from "ai";
import { z } from "zod";
import { searchMemos } from "@/lib/actions/agent-crud-actions";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const inputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe("Natural language search query to find relevant team memories and insights."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Maximum number of results. Defaults to 5, capped at 20."),
    minSimilarity: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.3)
      .describe("Semantic similarity threshold (0-1). Higher = stricter matching. Start at 0.3 (default); retry at 0.2 if 0 results returned."),
  })
  .strict();

const memoResultSchema = z
  .object({
    id: z.string().uuid().describe("Unique memo ID"),
    agent_id: z.string().uuid().describe("ID of the agent that created this memory"),
    title: z.string().describe("User-friendly title of the memory"),
    content: z.string().describe("The full text content of the memory"),
    tags: z.array(z.string()).describe("Categorization tags for this memory"),
    similarity: z.number().min(0).max(1).describe("Semantic similarity score to the query"),
  })
  .strict();

const outputSchema = z
  .object({
    results: z
      .array(memoResultSchema)
      .describe("Ranked list of team memories matching the query, best matches first."),
    query: z.string().describe("The original query that was searched, echoed for traceability."),
    total: z.number().describe("Total number of results returned"),
  })
  .strict();

// ---------------------------------------------------------------------------
// Types (inferred from schemas)
// ---------------------------------------------------------------------------

type KnowledgeSearchInput = z.infer<typeof inputSchema>;
type KnowledgeSearchOutput = z.infer<typeof outputSchema>;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const knowledgeSearchTool = tool({
  description:
    "Search this organisation's knowledge base (memo_summaries table, scoped to the current org). " +
    "Contains architecture decisions, business plans, product context, and team learnings. " +
    "ALWAYS call this first for: 'why', 'what is the reason', 'business plan', 'explain the design', 'what is the goal', or any strategic question. " +
    "Retry strategy: if the first call returns 0 results, call again with minSimilarity: 0.2 and rephrase the query using broader synonyms (e.g. 'business plan' → 'revenue strategy goals roadmap'). " +
    "Only tell the user nothing was found after two attempts with different queries at minSimilarity: 0.2. " +
    "Do NOT ask the user for more context before exhausting these retries.",
  inputSchema,
  outputSchema,
  execute: async (input: KnowledgeSearchInput): Promise<KnowledgeSearchOutput> => {
    const result = await searchMemos(input.query, input.limit, input.minSimilarity);

    if (!result.success) {
      throw new Error(`Knowledge search failed: ${result.error}`);
    }

    const output = {
      query: input.query,
      results: result.results,
      total: result.results.length,
    };

    // Validate output shape
    return outputSchema.parse(output);
  },
});
