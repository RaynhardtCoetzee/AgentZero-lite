"use client";

/**
 * components/dashboard/AgentChat.tsx
 *
 * Streaming ReAct chat interface. Wires useAgentStream to a message thread,
 * a live tool log strip, and a textarea input.
 *
 * Animations:
 *   - Tool log section: React 19 <ViewTransition> cross-fades the strip
 *     in/out between runs (fired by React navigation startTransition).
 *   - Individual tool entries: Tailwind 4 `starting:` variant (@starting-style)
 *     animates each entry on DOM insertion — no JS, no startTransition required.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import { ViewTransition } from "react";
import { useAgentStream, type ToolLogEntry } from "@/hooks/use-agent-stream";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Globe,
  Mail,
  Database,
  Ellipsis,
  CheckCircle2,
  AlertCircle,
  BotMessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getToolLabel } from "@/lib/ai/tool-logs";
import { INSUFFICIENT_CREDITS_MESSAGE } from "@/lib/credits/constants";

// ─── Tool icon map ────────────────────────────────────────────────────────────
// Labels come from lib/ai/tool-logs.ts (single source of truth).
// Icons are UI-layer concerns so they stay here.

type ToolMeta = { label: string; Icon: LucideIcon };

const TOOL_ICONS: Record<string, LucideIcon> = {
  webSearchTool:     Globe,
  emailAutomateTool: Mail,
  dbReadTool:        Database,
  dbWriteTool:       Database,
};

function getToolMeta(toolName: string): ToolMeta {
  return {
    label: getToolLabel(toolName),
    Icon:  TOOL_ICONS[toolName] ?? Ellipsis,
  };
}

// ─── UserMessage ──────────────────────────────────────────────────────────────

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <p
        className={cn(
          "max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-2.5",
          "bg-primary text-primary-foreground",
          "text-sm leading-relaxed whitespace-pre-wrap",
        )}
      >
        {content}
      </p>
    </div>
  );
}

// ─── AssistantMessage ─────────────────────────────────────────────────────────

function AssistantMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  // While the agent is in a tool step, no text tokens arrive yet.
  // Render a "Thinking…" pill instead of an empty bubble.
  const showThinking = isStreaming && !content;

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-2.5",
          "border border-border bg-card",
          "text-sm leading-relaxed text-foreground",
        )}
      >
        {showThinking ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span className="text-xs">Thinking…</span>
          </span>
        ) : (
          <p className="whitespace-pre-wrap">
            {content}
            {/* Blinking cursor — only shown while tokens are still arriving */}
            {isStreaming && (
              <span
                aria-hidden
                className={cn(
                  "ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px]",
                  "rounded-[1px] bg-current opacity-60 animate-pulse",
                )}
              />
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ToolLogItem ──────────────────────────────────────────────────────────────

function ToolLogItem({ entry }: { entry: ToolLogEntry }) {
  const { label, Icon } = getToolMeta(entry.toolName);
  const isDone = entry.status === "done";

  return (
    // starting: = Tailwind 4's @starting-style variant.
    // On DOM insertion the element begins at opacity-0 / translate-y-1
    // and transitions to its resting state — no JS required.
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5",
        "text-xs transition-all duration-200 ease-out",
        "opacity-100 translate-y-0",
        "starting:opacity-0 starting:translate-y-1",
        isDone ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-3 shrink-0",
          isDone ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {isDone ? (
        <CheckCircle2 className="size-3 shrink-0 text-primary" />
      ) : (
        <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

// ─── AgentChat ────────────────────────────────────────────────────────────────

export function AgentChat({ agentId }: { agentId: string }) {
  const { messages, toolLog, isLoading, error, append } = useAgentStream(agentId);
  const [input, setInput]   = useState("");
  const bottomRef           = useRef<HTMLDivElement>(null);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on every new token.
  // "instant" while streaming avoids per-token bounce; "smooth" on completion.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isLoading ? "instant" : "smooth",
    });
  }, [messages, isLoading]);

  // Restore textarea focus when the run finishes.
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  // void — fire-and-forget. append owns all streaming state internally.
  const handleSubmit = useCallback(
    (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      const prompt = input.trim();
      if (!prompt || isLoading) return;
      setInput("");
      void append(prompt);
    },
    [input, isLoading, append],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const hasMessages     = messages.length > 0;
  const showToolLog     = toolLog.length > 0;
  const lastMsg         = messages[messages.length - 1];
  const isLastStreaming  = isLoading && lastMsg?.role === "assistant";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">

      {/* ── Message thread ─────────────────────────────────────────────────── */}
      <div className="overflow-y-auto min-h-[220px] max-h-[38dvh] sm:min-h-[320px] sm:max-h-[500px] px-4 py-4">
        {!hasMessages ? (
          <div className="flex h-full min-h-[188px] sm:min-h-[288px] flex-col items-center justify-center gap-3 text-center">
            <BotMessageSquare
              className="size-8 text-muted-foreground/40"
              strokeWidth={1.25}
            />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Ask AgentZero anything.
              </p>
              <p className="text-xs text-muted-foreground/60">
                It can search the web, query your database, and send emails.
              </p>
            </div>
            <span className="hidden sm:inline-flex rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              Enter to send · Shift+Enter for newline
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              if (msg.role === "user") {
                return <UserMessage key={msg.id} content={msg.content} />;
              }
              return (
                <AssistantMessage
                  key={msg.id}
                  content={msg.content}
                  isStreaming={isLast && isLastStreaming}
                />
              );
            })}
          </div>
        )}
        {/* Scroll anchor — always rendered, always at the bottom of the list */}
        <div ref={bottomRef} />
      </div>

      {/* ── Tool log strip ─────────────────────────────────────────────────── */}
      {/*                                                                       */}
      {/* <ViewTransition> marks this subtree as a cross-fade target. React     */}
      {/* animates the strip appearing / disappearing during navigation         */}
      {/* startTransition events (e.g. route changes while a run is active).    */}
      {/* Per-entry entry animation is handled by CSS @starting-style above.    */}
      <ViewTransition>
        {showToolLog && (
          <div className="border-t border-border bg-muted/30 px-3 py-2.5">
            <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Tool activity
            </p>
            {toolLog.map((entry) => (
              <ToolLogItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </ViewTransition>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        error === INSUFFICIENT_CREDITS_MESSAGE ? (
          <div className="flex items-start gap-2.5 border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
            <AlertCircle className="mt-px size-3.5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You&apos;re out of credits. Top up to continue.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 border-t border-destructive/20 bg-destructive/5 px-4 py-2.5">
            <AlertCircle className="mt-px size-3.5 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )
      )}

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-border bg-background px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Message AgentZero…"
          rows={1}
          aria-label="Chat input"
          className={cn(
            "flex-1 resize-none rounded-lg border border-input bg-transparent",
            "px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
            "min-h-[36px] max-h-[120px] overflow-y-auto",
            "outline-none transition-shadow",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          aria-label={isLoading ? "Agent is running" : "Send message"}
        >
          {isLoading
            ? <Loader2 className="size-4 animate-spin" />
            : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
