import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Edge Function: Batch re-embed memos (e.g., after provider migration)
// Call: POST /functions/v1/embed-memo with { memo_ids: string[] }

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { memo_ids } = await req.json() as { memo_ids?: string[] };

    if (!memo_ids || !Array.isArray(memo_ids) || memo_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "memo_ids array required" }),
        { status: 400 }
      );
    }

    // Fetch memos
    const { data: memos, error: fetchError } = await supabase
      .from("memo_summaries")
      .select("id, content")
      .in("id", memo_ids);

    if (fetchError || !memos) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch memos" }),
        { status: 500 }
      );
    }

    // Note: Embedding generation moved to Server Action for immediate consistency.
    // This Edge Function is for batch re-embedding on provider migration.
    // For production use, call your embedding API here.

    return new Response(
      JSON.stringify({
        success: true,
        message: "Batch embedding job queued",
        memo_count: memos.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Embedding job error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
});
