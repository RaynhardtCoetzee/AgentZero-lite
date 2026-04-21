// Supabase read/write tool
import { tool } from "ai";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/**
 * A permissive but bounded value type for filter values and row data.
 * Keeps the schema honest: the agent may only pass JSON-serialisable scalars.
 */
const scalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// ---------------------------------------------------------------------------
// dbReadTool
// ---------------------------------------------------------------------------

const dbReadInputSchema = z
  .object({
    table: z
      .string()
      .min(1)
      .describe(
        "Exact Supabase table name to query (e.g. 'users', 'agent_runs'). Case-sensitive."
      ),
    filters: z
      .record(z.string(), scalarSchema)
      .optional()
      .describe(
        "Optional key-value pairs to filter rows. Each key is a column name, each value is the exact match. Example: { status: 'active', organisation_id: 'abc' }."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .describe("Maximum number of rows to return. Defaults to 20, capped at 100."),
    orderBy: z
      .object({
        column: z.string().describe("Column name to sort by."),
        ascending: z
          .boolean()
          .optional()
          .default(true)
          .describe("Sort direction. true = ASC, false = DESC. Defaults to true."),
      })
      .optional()
      .describe("Optional sort configuration. Omit to use the table's default order."),
  })
  ;

const dbReadOutputSchema = z
  .object({
    rows: z
      .array(z.record(z.string(), z.unknown()))
      .describe("Array of matching rows. Empty array if no rows match the filters."),
    count: z
      .number()
      .int()
      .describe("Number of rows returned in this response (not total table count)."),
    table: z
      .string()
      .describe("The table that was queried, echoed for traceability."),
  })
  .strict();

type DbReadInput = z.infer<typeof dbReadInputSchema>;
type DbReadOutput = z.infer<typeof dbReadOutputSchema>;

export const dbReadTool = tool({
  description:
    "Read rows from a Supabase table. Supports optional column filters, row limit, and sort order. Use this to look up records before deciding whether to write.",
  inputSchema: dbReadInputSchema,
  outputSchema: dbReadOutputSchema,
  execute: async (input: DbReadInput): Promise<DbReadOutput> => {
    let query = adminClient.from(input.table).select("*");

    if (input.filters) {
      for (const [column, value] of Object.entries(input.filters)) {
        if (value === null) {
          query = query.is(column, null);
        } else {
          query = query.eq(column, value);
        }
      }
    }

    if (input.orderBy) {
      query = query.order(input.orderBy.column, {
        ascending: input.orderBy.ascending,
      });
    }

    query = query.limit(input.limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase read error on table "${input.table}": ${error.message}`);
    }

    const rows = data ?? [];

    const raw = {
      rows,
      count: rows.length,
      table: input.table,
    };

    return dbReadOutputSchema.parse(raw);
  },
});

// ---------------------------------------------------------------------------
// dbWriteTool
// ---------------------------------------------------------------------------

const dbWriteInputSchema = z
  .object({
    table: z
      .string()
      .min(1)
      .describe(
        "Exact Supabase table name to write to (e.g. 'agent_runs', 'events'). Case-sensitive."
      ),
    operation: z
      .enum(["insert", "upsert"])
      .describe(
        '"insert" adds a new row and fails on conflict. "upsert" inserts or updates on primary-key conflict.'
      ),
    data: z
      .record(z.string(), scalarSchema)
      .describe(
        "Key-value pairs representing the row to insert or upsert. Keys must be valid column names."
      ),
  })
  .strict();

const dbWriteOutputSchema = z
  .object({
    row: z
      .record(z.string(), z.unknown())
      .describe("The full row as persisted in Supabase, including any server-generated fields such as id or created_at."),
    table: z
      .string()
      .describe("The table that was written to, echoed for traceability."),
    operation: z
      .enum(["insert", "upsert"])
      .describe("The operation that was performed, echoed for traceability."),
  })
  .strict();

type DbWriteInput = z.infer<typeof dbWriteInputSchema>;
type DbWriteOutput = z.infer<typeof dbWriteOutputSchema>;

export const dbWriteTool = tool({
  description:
    "Insert or upsert a single row into a Supabase table. Returns the persisted row including server-generated fields. Run dbReadTool first if you need to check for an existing record before writing.",
  inputSchema: dbWriteInputSchema,
  outputSchema: dbWriteOutputSchema,
  execute: async (input: DbWriteInput): Promise<DbWriteOutput> => {
    const baseQuery = adminClient.from(input.table);

    const { data, error } =
      input.operation === "upsert"
        ? await baseQuery.upsert(input.data).select().single()
        : await baseQuery.insert(input.data).select().single();

    if (error) {
      throw new Error(
        `Supabase ${input.operation} error on table "${input.table}": ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        `Supabase ${input.operation} on table "${input.table}" returned no data.`
      );
    }

    const raw = {
      row: data as Record<string, unknown>,
      table: input.table,
      operation: input.operation,
    };

    return dbWriteOutputSchema.parse(raw);
  },
});
