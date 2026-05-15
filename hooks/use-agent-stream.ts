// AgentZero Lite — billing layer removed
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
import { createConversation, saveMessage, loadConversation, updateConversationTitle } from "@/lib/actions/conversation-actions";

// ─── Title generator ──────────────────────────────────────────────────────────

function generateTitleFromMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New conversation";
  // Take first 50 chars, or up to first sentence
  const firstSentence = trimmed.split(/[.!?]/)[0] || trimmed;
  const title = firstSentence.slice(0, 50).trim();
  return title || "New conversation";
}

// ─── Status message generator ──────────────────────────────────────────────────

function getStatusMessage(toolName: string, status: "calling" | "done"): string {
  const messages: Record<string, { calling: string; done: string }> = {
    webSearchTool: {
      calling: "Searching the web…",
      done: "Web search complete",
    },
    knowledgeSearchTool: {
      calling: "Searching knowledge base…",
      done: "Knowledge search complete",
    },
  };
  return messages[toolName]?.[status] ?? (status === "calling" ? "Processing…" : "Complete");
}

// ─── Public types ─────────────────────────────────────────────────────────────
// Exported so AgentChat (and any future components) can annotate props.

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ToolLogEntry = {
  id: string;
  toolCallId: string;
  toolName: string;
  status: "calling" | "done";
  statusMessage?: string;
  input?: unknown;
  output?: unknown;
  startMs: number;   // Date.now() when the tool was invoked
  endMs?: number;    // Date.now() when the tool completed
};

export type UseAgentStreamReturn = {
  messages:        Message[];
  toolLog:         ToolLogEntry[];
  isLoading:       boolean;
  error:           string | null;
  conversationId:  string | null;
  append:          (prompt: string, options?: { modelId?: string; enabledTools?: string[]; attachments?: any }) => Promise<void>;
  loadConversationHistory: (convId: string) => Promise<void>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentStream(agentId: string): UseAgentStreamReturn {
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [toolLog,         setToolLog]         = useState<ToolLogEntry[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [conversationId,  setConversationId]  = useState<string | null>(null);

  // Ref-based guard prevents overlapping runs if the user submits mid-stream.
  // State alone isn't enough — a second call can read stale isLoading before
  // the first setState has flushed.
  const isRunningRef = useRef(false);
  // Accumulates the full assistant response during a run so the done handler
  // can save it — reading messages state here would be stale (closure capture).
  const assistantContentRef = useRef("");
  // Track if we've auto-generated a title for this conversation to avoid doing it multiple times
  const titleGeneratedRef = useRef(false);

  const append = useCallback(async (prompt: string, options?: { modelId?: string; enabledTools?: string[]; attachments?: any }) => {
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
    assistantContentRef.current = "";

    // ── Create or reuse conversation ───────────────────────────────────────────
    let convId = conversationId;
    if (!convId) {
      const result = await createConversation(agentId);
      if (result.ok) {
        convId = result.conversationId;
        setConversationId(convId);
      }
    }

    // ── Save user message ──────────────────────────────────────────────────────
    if (convId) {
      await saveMessage(convId, "user", prompt);
      // Auto-generate title from first message
      if (!titleGeneratedRef.current) {
        const title = generateTitleFromMessage(prompt);
        await updateConversationTitle(convId, title);
        titleGeneratedRef.current = true;
      }
    }

    try {
      const iterable = await streamAgentAction(prompt, agentId, { modelId: options?.modelId, enabledTools: options?.enabledTools, attachments: options?.attachments });

      for await (const event of iterable) {
        switch (event.type) {

          // ── Text token ──────────────────────────────────────────────────────
          // Append delta to the trailing assistant message in-place so React
          // batches these into a single re-render per animation frame.
          case "text-delta":
            assistantContentRef.current += event.delta;
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
          case "tool-call":
            setToolLog(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                toolCallId: event.toolCallId,
                toolName: event.toolName,
                status: "calling",
                statusMessage: getStatusMessage(event.toolName, "calling"),
                input: event.input,
                startMs: Date.now(),
              },
            ]);
            break;

          // ── Tool completion ─────────────────────────────────────────────────
          // Match by toolCallId (exact) so parallel calls to the same tool
          // resolve independently.
          case "tool-result":
            setToolLog(prev => {
              const lastCallingIdx = prev.reduceRight(
                (found, entry, i) =>
                  found === -1 &&
                  entry.toolCallId === event.toolCallId &&
                  entry.status     === "calling"
                    ? i
                    : found,
                -1,
              );
              if (lastCallingIdx === -1) return prev;
              return prev.map((entry, i) =>
                i === lastCallingIdx
                  ? { ...entry, status: "done" as const, statusMessage: getStatusMessage(entry.toolName, "done"), output: event.output, endMs: Date.now() }
                  : entry,
              );
            });
            break;

          // ── Clean close ─────────────────────────────────────────────────────
          // Save the final assistant message to the conversation.
          case "done": {
            if (convId && assistantContentRef.current) {
              await saveMessage(convId, "assistant", assistantContentRef.current);
            }
            break;
          }

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
        prev.map(e =>
          e.status === "calling"
            ? { ...e, status: "done" as const, statusMessage: getStatusMessage(e.toolName, "done"), endMs: Date.now() }
            : e,
        ),
      );
      setIsLoading(false);
      isRunningRef.current = false;
    }
  }, [agentId, conversationId]); // conversationId for message saving

  const loadConversationHistory = useCallback(
    async (convId: string) => {
      const result = await loadConversation(convId);
      if (result.ok) {
        const loadedMessages: Message[] = result.messages.map((msg) => ({
          id: crypto.randomUUID(),
          role: msg.role,
          content: msg.content,
        }));
        setMessages(loadedMessages);
        setConversationId(convId);
        setToolLog([]);
        setError(null);
        titleGeneratedRef.current = true; // Don't re-generate title for existing conversations
      } else {
        setError(result.message);
      }
    },
    [],
  );

  return { messages, toolLog, isLoading, error, conversationId, append, loadConversationHistory };
}
