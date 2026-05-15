"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { AssistantContent } from "@/components/dashboard/AssistantContent";
import { useAgentStream, type ToolLogEntry } from "@/hooks/use-agent-stream";
import { cn } from "@/lib/utils";
import {
  Square, Paperclip, Loader2, Send, ChevronDown,
  AlertCircle, History, Save, CheckCircle2, XCircle,
} from "lucide-react";

// ─── JSON syntax-highlighted viewer ──────────────────────────────────────────

function JsonView({ data }: { data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  const parts = text.split(/("(?:[^"\\]|\\.)*"(?:\s*:)?|true\b|false\b|null\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
  return (
    <pre className="max-h-44 overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all">
      {parts.map((tok, i) => {
        if (i % 2 === 0) return <span key={i} className="text-muted-foreground/35">{tok}</span>;
        if (/"[^"]*"\s*:/.test(tok))              return <span key={i} className="text-muted-foreground/70">{tok}</span>;
        if (tok.startsWith('"'))                  return <span key={i} className="text-emerald-400/60">{tok}</span>;
        if (tok === "true" || tok === "false" || tok === "null") return <span key={i} className="text-amber-400/60">{tok}</span>;
        return <span key={i} className="text-sky-400/60">{tok}</span>;
      })}
    </pre>
  );
}
import { updateAgent } from "@/lib/actions/agent-crud-actions";

// ─── Tool chip styles ─────────────────────────────────────────────────────────

type ToolChipStyle = { label: string; chipCls: string };

const TOOL_CHIP: Record<string, ToolChipStyle> = {
  webSearchTool:     { label: "web_search",     chipCls: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  emailAutomateTool: { label: "send_email",     chipCls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  dbReadTool:        { label: "read_url",       chipCls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  dbWriteTool:       { label: "database",       chipCls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  read_knowledge:    { label: "read_knowledge", chipCls: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  think:             { label: "think",          chipCls: "bg-muted/80 text-muted-foreground border-border" },
  draft_report:      { label: "draft_report",   chipCls: "bg-muted/80 text-muted-foreground border-border" },
};

function getChipStyle(toolName: string): ToolChipStyle {
  return TOOL_CHIP[toolName] ?? {
    label: toolName,
    chipCls: "bg-muted/60 text-muted-foreground border-border",
  };
}

// ─── Timed tool log entry ─────────────────────────────────────────────────────

// runElapsed: ms from run-start when this tool was invoked (for the timestamp column).
// Distinct from ToolLogEntry.startMs which is wall-clock for duration calculation.
type TimedEntry = ToolLogEntry & { runElapsed: number };

function formatMs(ms: number) {
  const m = String(Math.floor(ms / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${m}:${s}`;
}

function ToolEntry({ entry }: { entry: TimedEntry }) {
  const [open, setOpen] = useState(false);
  const chip     = getChipStyle(entry.toolName);
  const isDone   = entry.status === "done";
  const duration = isDone && entry.endMs ? entry.endMs - entry.startMs : null;
  const hasData  = entry.input !== undefined || entry.output !== undefined;

  return (
    <div className={cn(
      "border-b border-border/40 last:border-0",
      "opacity-100 translate-y-0 transition-all duration-200",
      "starting:opacity-0 starting:translate-y-1",
    )}>
      {/* ── Header row ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => { if (isDone && hasData) setOpen((v) => !v); }}
        disabled={!isDone || !hasData}
        className={cn(
          "flex w-full gap-3 px-4 py-3 text-left",
          isDone && hasData && "hover:bg-muted/10 transition-colors",
        )}
      >
        <span className="w-9 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground/35 tabular-nums">
          {formatMs(entry.runElapsed)}
        </span>
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium",
              chip.chipCls,
            )}>
              {chip.label}
            </span>
            {!isDone && (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground/40" />
            )}
            {isDone && duration !== null && (
              <span className="font-mono text-[10px] text-muted-foreground/30 tabular-nums">
                {duration}ms
              </span>
            )}
            {isDone && hasData && (
              <ChevronDown className={cn(
                "ml-auto h-3 w-3 shrink-0 text-muted-foreground/25 transition-transform duration-150",
                open && "rotate-180",
              )} />
            )}
          </div>
          <p className="text-xs text-muted-foreground/50">
            {isDone ? "Completed." : "Running…"}
          </p>
        </div>
      </button>

      {/* ── Inspector panel ─────────────────────────────────── */}
      {open && (
        <div className="border-t border-border/20 mx-4 mb-3 space-y-2.5">
          {entry.input !== undefined && (
            <div>
              <p className="pt-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/30 mb-1">
                Input
              </p>
              <div className="rounded-sm border border-border/30 bg-muted/10 p-2">
                <JsonView data={entry.input} />
              </div>
            </div>
          )}
          {entry.output !== undefined && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/30 mb-1">
                Output
              </p>
              <div className="rounded-sm border border-border/30 bg-muted/10 p-2">
                <JsonView data={entry.output} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-7",
  "claude-haiku-4-5",
] as const;

// ─── Available tools ──────────────────────────────────────────────────────────

const AVAILABLE_TOOLS = [
  { id: "web_search",     label: "web_search" },
  { id: "read_url",       label: "read_url" },
  { id: "draft_report",   label: "draft_report" },
  { id: "send_email",     label: "send_email" },
  { id: "read_knowledge", label: "read_knowledge" },
] as const;

type ToolId = (typeof AVAILABLE_TOOLS)[number]["id"];

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className={cn(
        "relative h-4 w-7 rounded-full transition-colors shrink-0",
        on ? "bg-primary" : "bg-muted"
      )}
    >
      <span className={cn(
        "absolute top-0.5 h-3 w-3 rounded-full bg-primary-foreground transition-transform",
        on ? "translate-x-3.5" : "translate-x-0.5",
      )} />
    </button>
  );
}

// ─── Context panel (right) ────────────────────────────────────────────────────

type RunStats = { elapsed: number; toolCalls: number; creditsUsed: number; tokens: number };
type RunState = "idle" | "running" | "done";

function ContextPanel({
  agentId,
  runState,
  agentName,
  initialInstructions,
  model,
  setModel,
  enabledTools,
  toggleTool,
  stats,
}: {
  agentId: string;
  runState: RunState;
  agentName: string;
  initialInstructions: string;
  model: string;
  setModel: (m: string) => void;
  enabledTools: Set<ToolId>;
  toggleTool: (id: ToolId) => void;
  stats: RunStats;
}) {
  const [name,    setName]    = useState(agentName);
  const [prompt,  setPrompt]  = useState(initialInstructions);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveErr(null);
    const result = await updateAgent(agentId, {
      name:         name.trim() || agentName,
      instructions: prompt.trim(),
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveErr(result.error);
    }
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-l border-white/[0.06] overflow-y-auto glass-1">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/55">
          Context
        </span>
        <span className="text-muted-foreground/25 select-none">···</span>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto p-4">

        {/* CONFIG */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/35">
            Config
          </p>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-muted-foreground/40">name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full rounded-sm border border-border bg-background",
                "px-3 py-1.5 font-mono text-xs text-foreground",
                "focus:border-ring focus:outline-none",
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-muted-foreground/40">system prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className={cn(
                "w-full resize-none rounded-sm border border-border bg-background",
                "px-3 py-2 font-mono text-xs text-foreground leading-relaxed",
                "focus:border-ring focus:outline-none",
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => { void handleSave(); }}
            disabled={saving}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors",
              saved
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground/60 hover:text-foreground hover:border-border/70",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {saving  ? <><Loader2 className="h-3 w-3 animate-spin" />Saving…</> :
             saved   ? <><CheckCircle2 className="h-3 w-3" />Saved</> :
                       <><Save className="h-3 w-3" />Save config</>}
          </button>
          {saveErr && (
            <p className="flex items-center gap-1 font-mono text-[10px] text-destructive">
              <XCircle className="h-3 w-3 shrink-0" />{saveErr}
            </p>
          )}
        </section>

        {/* MODEL */}
        <section className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/35">
            Model
          </p>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={cn(
                "w-full appearance-none rounded-sm border border-border bg-background",
                "py-2 pl-3 pr-7 font-mono text-xs text-foreground",
                "focus:border-ring focus:outline-none cursor-pointer",
              )}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
          </div>
        </section>

        {/* TOOLS */}
        <section className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/35">
            Tools
          </p>
          <div className="space-y-2">
            {AVAILABLE_TOOLS.map(({ id, label }) => (
              <div key={id} className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground/60">{label}</span>
                <Toggle on={enabledTools.has(id)} onToggle={() => toggleTool(id)} />
              </div>
            ))}
          </div>
        </section>

        {/* RUN STATS */}
        <section className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/35">
            Run Stats
          </p>
          <div className="space-y-1.5 rounded-sm border border-border p-3">
            {([
              ["status",       runState],
              ["elapsed",      formatMs(stats.elapsed)],
              ["tool calls",   String(stats.toolCalls)],
              ["credits used", String(stats.creditsUsed)],
              ["tokens",       stats.tokens.toLocaleString()],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground/40">{label}:</span>
                <span className={cn(
                  "font-mono text-[10px] tabular-nums",
                  label === "status" && runState === "running" ? "text-primary" :
                  label === "status" && runState === "done"    ? "text-primary" :
                  "text-foreground/80",
                )}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── RunPanel ─────────────────────────────────────────────────────────────────

export function RunPanel({
  agentId,
  agentName,
  initialInstructions = "",
}: {
  agentId: string;
  agentName: string;
  initialInstructions?: string;
}) {
  const { messages, toolLog, isLoading, error, append } = useAgentStream(agentId);

  const [input,        setInput]        = useState("");
  const [model,        setModel]        = useState("claude-sonnet-4-6");
  const [enabledTools, setEnabledTools] = useState<Set<ToolId>>(
    new Set(["web_search", "read_url", "draft_report", "read_knowledge"]),
  );
  const [elapsed,   setElapsed]   = useState(0);
  const [timedLog,  setTimedLog]  = useState<TimedEntry[]>([]);

  const startTimeRef          = useRef<number | null>(null);
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLogLenRef         = useRef(0);
  const logEndRef             = useRef<HTMLDivElement>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  // Start/stop elapsed timer
  useEffect(() => {
    if (isLoading) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - (startTimeRef.current ?? Date.now()));
      }, 500);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoading]);

  // Reset when a new run starts (isLoading flips true)
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      setTimedLog([]);
      prevLogLenRef.current = 0;
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  // Sync timed log when new tool entries arrive or statuses update
  useEffect(() => {
    const newLen = toolLog.length;
    if (newLen > prevLogLenRef.current) {
      const runElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const added = toolLog.slice(prevLogLenRef.current).map((e) => ({ ...e, runElapsed }));
      setTimedLog((prev) => [...prev, ...added]);
      prevLogLenRef.current = newLen;
    } else {
      // Propagate status, output, and endMs for completed entries
      setTimedLog((prev) =>
        prev.map((te, i) =>
          i < toolLog.length
            ? { ...te, status: toolLog[i].status, output: toolLog[i].output, endMs: toolLog[i].endMs }
            : te,
        ),
      );
    }
  }, [toolLog]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: isLoading ? "instant" : "smooth" }); }, [timedLog, messages, isLoading]);
  useEffect(() => { if (!isLoading) textareaRef.current?.focus(); }, [isLoading]);

  const handleSubmit = useCallback(() => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;
    setInput("");
    void append(prompt);
  }, [input, isLoading, append]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }, [handleSubmit]);

  const toggleTool = useCallback((id: ToolId) => {
    setEnabledTools((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const lastUserMsg      = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const hasRun           = messages.length > 0;
  const isStreaming      = isLoading && !!lastAssistantMsg;
  const isThinking       = isLoading && !lastAssistantMsg?.content && timedLog.length === 0;

  const runState: RunState = isLoading ? "running" : hasRun ? "done" : "idle";
  const doneCount = timedLog.filter((e) => e.status === "done").length;
  const tokenEstimate = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);

  const stats: RunStats = {
    elapsed,
    toolCalls:   doneCount,
    creditsUsed: doneCount * 5,
    tokens:      tokenEstimate,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md glass-1">

      {/* Run header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">state</span>
          {(["idle", "running", "done"] as const).map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors",
                runState === s
                  ? s === "running"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : s === "done"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/60 text-foreground/60"
                  : "border-transparent text-muted-foreground/25",
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <button className="flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground/50 hover:text-foreground hover:border-border/70 transition-colors">
          <History className="h-3 w-3" />
          History
        </button>
      </div>

      {/* Indeterminate progress bar */}
      <div className="h-0.5 shrink-0 overflow-hidden bg-border">
        {isLoading && (
          <div
            className="h-full w-1/3 bg-primary origin-left"
            style={{ animation: "indeterminate 1.6s ease-in-out infinite" }}
          />
        )}
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Left: tool call log */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {!hasRun ? (
              /* ── Empty state ─────────────────────────────────────── */
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-muted-foreground/40">No run started yet.</p>
                <p className="text-xs text-muted-foreground/25">
                  Enter a prompt below to run{" "}
                  <span className="font-mono">{agentName}</span>.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* ── User prompt ──────────────────────────────────── */}
                {lastUserMsg && (
                  <div className="flex gap-3 border-b border-border/40 px-4 py-3">
                    <span className="w-9 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground/30 tabular-nums">
                      00:00
                    </span>
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <span className="inline-flex w-fit rounded-sm border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground/50">
                        prompt
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {lastUserMsg.content}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Tool call entries ─────────────────────────────── */}
                {timedLog.map((entry) => (
                  <ToolEntry key={entry.id} entry={entry} />
                ))}

                {/* ── Thinking indicator (loading, no content yet) ──── */}
                {isThinking && (
                  <div className="flex gap-3 border-b border-border/40 px-4 py-3">
                    <span className="w-9 shrink-0 pt-1 font-mono text-[10px] text-muted-foreground/30">
                      {formatMs(elapsed)}
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
                      <span className="font-mono text-xs text-muted-foreground/40">
                        thinking…
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Assistant response ────────────────────────────── */}
                {lastAssistantMsg && (lastAssistantMsg.content || !isLoading) && (
                  <div className="flex gap-3 px-4 py-4">
                    <span className="w-9 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground/30 tabular-nums" />
                    <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                      <span className="inline-flex w-fit rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                        response
                      </span>
                      <AssistantContent
                        content={lastAssistantMsg.content}
                        isStreaming={isStreaming && !!lastAssistantMsg.content}
                      />
                      {isStreaming && !lastAssistantMsg.content && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          writing response…
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex shrink-0 items-start gap-2.5 border-t border-destructive/20 bg-destructive/5 px-4 py-2.5">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 border-t border-white/[0.06] glass-1">
            <div className="flex items-start gap-3 px-4 pt-3 pb-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Enter a prompt to run the agent…"
                rows={2}
                aria-label="Agent prompt"
                className={cn(
                  "flex-1 resize-none bg-transparent text-sm text-foreground",
                  "placeholder:text-muted-foreground/30 outline-none",
                  "min-h-[40px] max-h-[100px] overflow-y-auto disabled:opacity-50",
                )}
              />
              {isLoading ? (
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-mono text-xs text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Square className="h-3 w-3" />
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                  )}
                >
                  <Send className="h-3 w-3" />
                  Run
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 border-t border-border/40 px-4 py-2">
              <span className="font-mono text-[10px] text-muted-foreground/35">
                ≈{enabledTools.size * 8} cr/run
              </span>
              <span className="text-muted-foreground/20">·</span>
              <span className="font-mono text-[10px] text-muted-foreground/35">
                {enabledTools.size} tools active
              </span>
              <button className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground/35 hover:text-muted-foreground transition-colors">
                <Paperclip className="h-3 w-3" />
                Attach
              </button>
            </div>
          </div>
        </div>

        {/* Right: context panel (hidden on small screens) */}
        <div className="hidden lg:flex">
          <ContextPanel
            agentId={agentId}
            runState={runState}
            agentName={agentName}
            initialInstructions={initialInstructions}
            model={model}
            setModel={setModel}
            enabledTools={enabledTools}
            toggleTool={toggleTool}
            stats={stats}
          />
        </div>

      </div>
    </div>
  );
}
