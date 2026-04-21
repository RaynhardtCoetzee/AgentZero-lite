"use client";

/**
 * hooks/use-agent-stream.ts
 *
 * Consumes a streamAgentAction Server Action via a plain `for await` loop.
 * Manages message history, per-run tool log, loading state, and errors.
 *
 * Why not useChat?
 *   useChat fetches a URL — it cannot consume a Server Action's return value.
 *   ai/rsc does not exist in AI SDK 6. streamAgentAction returns an
 *   AsyncIterable<StreamEvent> serialised by React 19 Flight — iterate it
 *   directly, no adapter needed.
 *
 * Streaming model:
 *   append(prompt) → calls streamAgentAction → iterates StreamEvents:
 *     text-delta   → accumulates into the trailing assistant message
 *     tool-call    → pushes a 'calling' entry into toolLog
 *     tool-result  → flips the matching 'calling' entry to 'done'
 *     done         → no-op (finally block handles isLoading)
 *     error        → surfaces message, finally block handles isLoading
 */

import { useState, useCallback, useRef } from "react";
import { streamAgentAction } from "@/lib/actions/agent-actions";

// ─── Public types ─────────────────────────────────────────────────────────────
// Exported so AgentChat (and any future components) can annotate props.

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ToolLogEntry = {
  id: string;
  toolName: string;
  status: "calling" | "done";
};

export type UseAgentStreamReturn = {
  messages:  Message[];
  toolLog:   ToolLogEntry[];
  isLoading: boolean;
  error:     string | null;
  append:    (prompt: string) => Promise<void>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentStream(agentId: string): UseAgentStreamReturn {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [toolLog,   setToolLog]   = useState<ToolLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Ref-based guard prevents overlapping runs if the user submits mid-stream.
  // State alone isn't enough — a second call can read stale isLoading before
  // the first setState has flushed.
  const isRunningRef = useRef(false);

  const append = useCallback(async (prompt: string) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    // ── Optimistic UI ────────────────────────────────────────────────────────
    // Add the user turn and an empty assistant turn immediately so the layout
    // doesn't jump when the first token arrives.
    const userMsg: Message      = { id: crypto.randomUUID(), role: "user",      content: prompt };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setToolLog([]);           // tool log is scoped to the current run
    setError(null);
    setIsLoading(true);

    try {
      const iterable = await streamAgentAction(prompt, agentId);

      for await (const event of iterable) {
        switch (event.type) {

          // ── Text token ──────────────────────────────────────────────────────
          // Append delta to the trailing assistant message in-place so React
          // batches these into a single re-render per animation frame.
          case "text-delta":
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role !== "assistant") return prev;
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + event.delta },
              ];
            });
            break;

          // ── Tool invocation ─────────────────────────────────────────────────
          // Push a new 'calling' entry. The toolName is the display label.
          case "tool-call":
            setToolLog(prev => [
              ...prev,
              { id: crypto.randomUUID(), toolName: event.toolName, status: "calling" },
            ]);
            break;

          // ── Tool completion ─────────────────────────────────────────────────
          // Flip the most-recent 'calling' entry for this tool to 'done'.
          // Searching from the end handles the (rare) case of the same tool
          // being called multiple times in one run.
          case "tool-result":
            setToolLog(prev => {
              const lastCallingIdx = prev.reduceRight(
                (found, entry, i) =>
                  found === -1 &&
                  entry.toolName === event.toolName &&
                  entry.status   === "calling"
                    ? i
                    : found,
                -1,
              );
              if (lastCallingIdx === -1) return prev;
              return prev.map((entry, i) =>
                i === lastCallingIdx ? { ...entry, status: "done" as const } : entry,
              );
            });
            break;

          // ── Clean close ─────────────────────────────────────────────────────
          // The finally block below handles isLoading — nothing else needed.
          case "done":
            break;

          // ── Server-side error ────────────────────────────────────────────────
          // Surfaces auth failures, validation errors, and agent exceptions as
          // UI messages rather than thrown exceptions — keeps the UI stable.
          case "error":
            setError(event.message);
            break;
        }
      }
    } catch (err) {
      // Network-level or serialisation errors — the stream itself failed.
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      // Flip any tool entries still in "calling" state to "done".
      // tool-result chunks race against text-delta chunks in the merged stream
      // (see run-tools-transformation.ts); the spinner must not outlive the run.
      setToolLog(prev =>
        prev.map(e => (e.status === "calling" ? { ...e, status: "done" as const } : e)),
      );
      setIsLoading(false);
      isRunningRef.current = false;
    }
  }, [agentId]); // agentId is the only external value closed over

  return { messages, toolLog, isLoading, error, append };
}
