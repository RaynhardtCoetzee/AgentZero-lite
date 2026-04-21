// Tavily web search tool
import { tool } from "ai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const inputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe("The search query to send to Tavily. Be specific for better results."),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Maximum number of results to return. Defaults to 5, capped at 10."),
    searchDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .default("basic")
      .describe(
        'Tavily search depth. Use "advanced" for complex research queries that need deeper results.'
      ),
  })
  .strict(); // throw on unknown fields — no silent coercion

const resultSchema = z
  .object({
    title: z.string().describe("The page title of the search result."),
    url: z.url().describe("The canonical URL of the search result."),
    snippet: z
      .string()
      .describe("A short excerpt from the page content most relevant to the query."),
  })
  .strict();

const outputSchema = z
  .object({
    results: z
      .array(resultSchema)
      .describe("Ordered list of search results from Tavily, most relevant first."),
    query: z.string().describe("The original query that was searched, echoed for traceability."),
  })
  .strict();

// ---------------------------------------------------------------------------
// Types (inferred from schemas — single source of truth)
// ---------------------------------------------------------------------------

type WebSearchInput = z.infer<typeof inputSchema>;
type WebSearchOutput = z.infer<typeof outputSchema>;

// ---------------------------------------------------------------------------
// Tavily API response shape (internal — not exported)
// ---------------------------------------------------------------------------

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results: TavilyResult[];
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const webSearchTool = tool({
  description:
    "Search the web using Tavily and return relevant results. Use this to look up current events, facts, documentation, or any information not available in context.",
  inputSchema,
  outputSchema,
  execute: async (input: WebSearchInput): Promise<WebSearchOutput> => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY environment variable is not set.");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: input.query,
        max_results: input.maxResults,
        search_depth: input.searchDepth,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Tavily API error: ${response.status} ${response.statusText}`
      );
    }

    const data: TavilyResponse = await response.json();

    const raw = {
      query: input.query,
      results: data.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      })),
    };

    // Validate output shape — throws ZodError if Tavily returns unexpected data
    return outputSchema.parse(raw);
  },
});
