"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { AssistantContent } from "@/components/dashboard/AssistantContent";
import { useAgentStream, type ToolLogEntry } from "@/hooks/use-agent-stream";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Globe,
  Ellipsis,
  CheckCircle2,
  AlertCircle,
  BotMessageSquare,
  Search,
  Zap,
  Brain,
  Eye,
  Save,
  Paperclip,
  X,
  ChevronDown,
  BookOpen,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { listOrgDocuments } from "@/lib/actions/document-actions";
import type { LucideIcon } from "lucide-react";
import { getToolLabel } from "@/lib/ai/tool-logs";
import { INSUFFICIENT_CREDITS_MESSAGE } from "@/lib/credits/constants";
import { saveMemoSummary } from "@/lib/actions/agent-crud-actions";
import { TOOL_REGISTRY } from "@/lib/ai/tool-registry";
import { MODEL_REGISTRY } from "@/lib/ai/model-registry";

type ToolMeta = { label: string; Icon: LucideIcon };

const TOOL_ICONS: Record<string, LucideIcon> = {
  webSearchTool: Globe,
  knowledgeSearchTool: BookOpen,
};

function getToolMeta(toolName: string): ToolMeta {
  return {
    label: getToolLabel(toolName),
    Icon: TOOL_ICONS[toolName] ?? Ellipsis,
  };
}

function getToolDetail(toolName: string, input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const inp = input as Record<string, unknown>;
  switch (toolName) {
    case "webSearchTool":
    case "knowledgeSearchTool":
      if (typeof inp.query === "string") {
        return inp.query.length > 55 ? inp.query.slice(0, 55) + "…" : inp.query;
      }
      break;
  }
  return null;
}

type PromptTemplate = {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
};

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    label: "Web research brief",
    prompt: "Search the web for the latest developments in AI agents and give me a structured brief with key findings.",
    icon: Search,
    keywords: ["web", "search", "research", "brief"],
  },
  {
    label: "Knowledge base lookup",
    prompt: "Search our knowledge base and summarise the most relevant documents for the topic I describe.",
    icon: BookOpen,
    keywords: ["knowledge", "documents", "summary"],
  },
] as const;

const REACT_PIPELINE = [
  { label: "Think", Icon: Brain },
  { label: "Act", Icon: Zap },
  { label: "Observe", Icon: Eye },
] as const;

const TOOL_PRIORITY = [
  { label: "Knowledge", Icon: BookOpen, note: "primary"  },
  { label: "Web",       Icon: Globe,    note: "fallback" },
] as const;

function ThoughtVisualization({ urls }: { urls: string[] }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % REACT_PIPELINE.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const activeToolIndex = urls.length > 0 ? 1 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {REACT_PIPELINE.map(({ label, Icon }, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2 py-1 transition-all duration-500",
                i === stageIndex
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground/30",
              )}
            >
              <Icon className="size-3 shrink-0" />
              <span className="font-mono text-[8px] uppercase tracking-wider">{label}</span>
            </div>
            {i < REACT_PIPELINE.length - 1 && (
              <span className="font-mono text-[8px] text-muted-foreground/25">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {TOOL_PRIORITY.map(({ label, Icon, note }, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1 transition-all duration-300 border",
                i === activeToolIndex
                  ? "bg-primary/10 text-primary/70 border-primary/20"
                  : "text-muted-foreground/25 border-transparent",
              )}
            >
              <Icon className="size-3 shrink-0" />
              <span className="font-mono text-[8px] uppercase tracking-wider">{label}</span>
              <span className="font-mono text-[7px] text-muted-foreground/30">{note}</span>
            </div>
            {i < TOOL_PRIORITY.length - 1 && (
              <span className="font-mono text-[8px] text-muted-foreground/20">→</span>
            )}
          </div>
        ))}
      </div>

      {urls.length > 0 && (
        <div className="space-y-1 pl-2">
          {urls.slice(-3).map((url, i) => (
            <div key={i} className="font-mono text-[8px] text-muted-foreground/45 truncate max-w-[280px] uppercase tracking-wide">
              → {url.replace(/^https?:\/\//, "").split("/")[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-2 transition-[opacity,transform] duration-200">
      <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground/40 shrink-0 w-8 sm:w-10 text-right pt-2.5 select-none font-bold">
        you
      </span>
      <div className="flex-1 min-w-0 glass-1 rounded-md px-3.5 sm:px-4 py-2.5 relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/0 via-white/10 to-white/0" aria-hidden />
        <p className="text-[15px] leading-relaxed text-foreground/90 font-light whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  isStreaming,
  toolLog = [],
  agentId = "",
  agentName = "",
}: {
  content: string;
  isStreaming: boolean;
  toolLog?: ToolLogEntry[];
  agentId?: string;
  agentName?: string;
}) {
  const showThinking = isStreaming && !content;
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const urls = toolLog
    .filter((entry) => entry.toolName === "webSearchTool" && entry.status !== "done")
    .map((entry) => {
      const inp = entry.input as Record<string, unknown>;
      return inp.query as string;
    })
    .filter((q): q is string => typeof q === "string");

  const handleCopy = () => {
    if (contentRef.current?.textContent) {
      void navigator.clipboard.writeText(contentRef.current.textContent).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }
  };

  const handleSave = async () => {
    if (!content || !agentId) return;
    setSaving(true);
    try {
      const result = await saveMemoSummary(content, agentId);
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        console.error("[memo save] failed:", result.error);
      }
    } catch (err) {
      console.error("[memo save] error:", err);
    } finally {
      setSaving(false);
    }
  };

  const label = agentName ? agentName.slice(0, 4).toLowerCase() : "sys";

  return (
    <div className="flex items-start gap-3 sm:gap-4 group opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-2 transition-[opacity,transform] duration-200">
      <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-primary/50 shrink-0 w-8 sm:w-10 text-right pt-1 select-none font-medium">
        {label}
      </span>
      <div ref={contentRef} className="flex-1 min-w-0 rounded-md glass-2 px-3.5 sm:px-4 py-2.5 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0" aria-hidden />
        <div className="mb-3 font-mono text-[7px] sm:text-[8px] uppercase tracking-widest text-primary/55 pb-2 border-b border-primary/10">
          {agentName || "agent"}
        </div>
        {showThinking ? (
          <div className="opacity-50">
            <ThoughtVisualization urls={urls} />
          </div>
        ) : (
          <AssistantContent content={content} isStreaming={isStreaming} />
        )}
        {!showThinking && !isStreaming && (
          <div className="flex items-center gap-2 mt-3 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2 py-1",
                "font-mono text-[8px] uppercase tracking-wider transition-all duration-150 border border-transparent",
                saveSuccess
                  ? "text-primary/80"
                  : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:border-muted-foreground/10 hover:bg-muted/30",
              )}
              aria-label={saveSuccess ? "Saved to memory" : "Save to memory"}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saveSuccess ? (
                <><CheckCircle2 className="h-3 w-3" />saved</>
              ) : (
                <><Save className="h-3 w-3" />save</>
              )}
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2 py-1",
                "font-mono text-[8px] uppercase tracking-wider transition-all duration-150 border border-transparent",
                copied
                  ? "text-primary/80"
                  : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:border-muted-foreground/10 hover:bg-muted/30",
              )}
              aria-label={copied ? "Copied" : "Copy response"}
            >
              {copied
                ? <><CheckCircle2 className="h-3 w-3" />copied</>
                : <><Send className="h-3 w-3" />copy</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolLogItem({ entry }: { entry: ToolLogEntry }) {
  const { Icon } = getToolMeta(entry.toolName);
  const isDone = entry.status === "done";
  const displayText = entry.statusMessage || entry.toolName;
  const detail = getToolDetail(entry.toolName, entry.input);
  const durationMs = entry.endMs && entry.startMs ? entry.endMs - entry.startMs : null;
  const [showDetail, setShowDetail] = useState(false);

  const hasOutput = !!entry.output;
  const statusBadgeText = isDone ? "Done" : "Running";

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowDetail(!showDetail)}
        disabled={!hasOutput}
        className={cn(
          "w-full flex items-start gap-3 rounded-sm px-2.5 py-2",
          "text-[10px] transition-all duration-200 ease-out",
          "opacity-100 translate-y-0",
          "starting:opacity-0 starting:translate-y-1",
          isDone ? "text-muted-foreground/50" : "text-foreground/60",
          hasOutput ? "hover:bg-muted/20 cursor-pointer" : "cursor-default",
        )}
      >
        <Icon
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            isDone ? "text-primary/40" : "text-muted-foreground/40",
          )}
        />
        <div className="flex-1 min-w-0">
          <span className="block truncate text-foreground/70 font-mono text-[9px] uppercase tracking-wider">{displayText}</span>
          {detail && (
            <span className="block truncate font-mono text-[8px] text-muted-foreground/40 mt-1 uppercase tracking-wider">
              {detail}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5 ml-2">
          {isDone && durationMs !== null && (
            <span className="font-mono text-[8px] text-muted-foreground/40">{durationMs}ms</span>
          )}
          <span className={cn(
            "px-2 py-1 rounded-sm text-[8px] font-mono uppercase tracking-wider font-medium",
            isDone
              ? "bg-primary/15 text-primary/70"
              : "bg-amber-500/15 text-amber-600/70",
          )}>
            {statusBadgeText}
          </span>
          {isDone ? (
            <CheckCircle2 className="size-3.5 text-primary/50" />
          ) : (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground/30" />
          )}
        </div>
      </button>
      {showDetail && hasOutput && (
        <div className="mt-1.5 mx-2 p-2.5 rounded-sm bg-muted/10 border border-border/20">
          <p className="font-mono text-[8px] text-muted-foreground/50 break-words max-h-[120px] sm:max-h-[80px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {typeof entry.output === "string"
              ? entry.output.slice(0, 500) + (entry.output.length > 500 ? "…" : "")
              : JSON.stringify(entry.output, null, 2).slice(0, 500) + "…"}
          </p>
        </div>
      )}
    </div>
  );
}

type DocFile = {
  id: string;
  file_name: string;
  file_type: string
};

export function AgentChat({ agentId, agentName = "", initialConversationId, selectedModel, initialMessage, onCompact }: { agentId: string; agentName?: string; initialConversationId?: string; selectedModel?: string; initialMessage?: string; onCompact?: Dispatch<SetStateAction<boolean>> }) {
  const { messages, toolLog, isLoading, error, append, conversationId, loadConversationHistory } = useAgentStream(agentId);
  const [input, setInput] = useState(initialMessage ?? "");
  const [toolLogExpanded, setToolLogExpanded] = useState(true);
  const [model, setModel] = useState(selectedModel || MODEL_REGISTRY[0]?.id || "");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<DocFile[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(
    new Set(TOOL_REGISTRY.map(t => t.id))
  );
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (initialConversationId && !conversationId) {
      void loadConversationHistory(initialConversationId);
    }
  }, [initialConversationId, conversationId, loadConversationHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isLoading ? "instant" : "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && toolLog.length > 0) {
      setToolLogExpanded(false);
    }
  }, [isLoading, toolLog.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const compact = el.scrollTop > 60;
      setIsCompact(compact);
      onCompact?.(compact);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [onCompact]);

  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (!modelPickerRef.current?.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelPicker]);

  const loadKnowledge = useCallback(async () => {
    if (knowledgeFiles.length > 0) return;
    setKnowledgeLoading(true);
    const result = await listOrgDocuments();
    if (result.ok) setKnowledgeFiles(result.documents);
    setKnowledgeLoading(false);
  }, [knowledgeFiles.length]);

  const handleSubmit = useCallback(
    (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      const prompt = input.trim();
      if (!prompt && attachments.length === 0) return;
      if (isLoading) return;

      const messageContent = attachments.length > 0
        ? [
          { type: "text" as const, text: prompt || "" },
          ...attachments.map(att => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: att.type as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
              data: att.data.split(",")[1] || att.data,
            },
          })),
        ]
        : prompt;

      void append(prompt || "Attached image(s)", {
        modelId: model,
        enabledTools: Array.from(enabledTools),
        attachments: attachments.length > 0 ? { content: messageContent } : undefined,
      });
      setInput("");
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
    [input, isLoading, append, model, enabledTools, attachments],
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

  const hasMessages = messages.length > 0;
  const showToolLog = toolLog.length > 0;
  const lastMsg = messages[messages.length - 1];
  const isLastStreaming = isLoading && lastMsg?.role === "assistant";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card relative">
      {/* ── Scrollable History Area ── */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-8 py-6 sm:py-8 [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%)]">
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center gap-8 sm:gap-10 px-4 sm:px-8 py-8 text-center relative">
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] h-48 w-48 rounded-full bg-primary/6 blur-3xl" aria-hidden />

            <div className="relative anim-fade-up">
              <div className="absolute inset-0 rounded-md bg-primary/15 blur-xl" aria-hidden />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/25 shadow-[0_0_36px_-8px_rgba(200,241,53,0.45)]">
                <BotMessageSquare
                  className="size-7 text-primary"
                  strokeWidth={1.4}
                />
              </div>
            </div>

            <div className="space-y-3 max-w-md anim-fade-up anim-fade-up-delay-1">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                ready
              </p>
              <p className="text-xl sm:text-2xl text-foreground font-mono font-black tracking-tight leading-[1.1]">
                What can AgentZero do for you?
              </p>
              <p className="text-sm sm:text-base text-muted-foreground/70 leading-relaxed font-light">
                Search the web, query your data, compose emails—all in one place.
              </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-3 text-left anim-fade-up anim-fade-up-delay-2">
              {PROMPT_TEMPLATES.filter((t) => {
                if (!input) return true;
                const query = input.toLowerCase();
                return t.keywords.some((kw) => kw.includes(query) || query.includes(kw));
              }).map(({ label, prompt, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className={cn(
                    "flex gap-4 rounded-md glass-1 px-4 sm:px-5 py-4 sm:py-5 text-left",
                    "border-primary/15 hover:border-primary/40",
                    "transition-[border-color,background-color,transform] duration-200 ease-out",
                    "press group anim-fade-up",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 transition-colors duration-200 group-hover:bg-primary/20">
                    <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 text-primary/80 transition-colors group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-foreground/85 font-semibold">{label}</p>
                    <p className="mt-1.5 text-sm sm:text-base leading-snug text-muted-foreground/70">{prompt}</p>
                  </div>
                </button>
              ))}
            </div>
            <span className="hidden sm:inline-flex rounded-sm border border-border/20 px-3 py-1.5 font-mono text-[10px] text-muted-foreground/50 mt-4">
              ⏎ Enter to send  ·  ⇧ Enter for newline
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-7">
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
                  toolLog={isLast && isLastStreaming ? toolLog : []}
                  agentId={agentId}
                  agentName={agentName}
                />
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Sticky Pinned Footer Area ── */}
      <div className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-sm border-t border-white/[0.06]">
        {showToolLog && (
          <div className="sticky bottom-0 z-20 bg-transparent opacity-50 hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={() => setToolLogExpanded((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3 sm:px-4 py-3 text-left hover:bg-muted/20 transition-colors duration-150"
            >
              <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/40">
                Execution Log
              </p>
              <ChevronDown
                className={cn(
                  "ml-auto size-3.5 shrink-0 text-muted-foreground/30 transition-transform duration-200",
                  toolLogExpanded && "rotate-180",
                )}
              />
            </button>
            {toolLogExpanded && (
              <div className="px-3 sm:px-4 pb-4 sm:pb-4 space-y-2 max-h-40 overflow-y-auto">
                {toolLog.map((entry) => (
                  <ToolLogItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          error === INSUFFICIENT_CREDITS_MESSAGE ? (
            <div className="flex items-start gap-3 border-t border-amber-500/15 bg-amber-500/8 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600/80" />
              <p className="text-sm text-amber-700/90 dark:text-amber-400/80 leading-relaxed">
                You&apos;re out of credits. Top up to continue.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 border-t border-destructive/15 bg-destructive/8 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive/80" />
              <p className="text-sm text-destructive/80 leading-relaxed">{error}</p>
            </div>
          )
        )}

        {showKnowledge && (
          <div className="border-t border-border/30 px-3 sm:px-4 py-3 bg-muted/5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/50">
                Knowledge Base
              </span>
              <Link
                href="/dashboard/knowledge"
                className="font-mono text-[8px] text-primary/60 hover:text-primary transition-colors duration-200 uppercase tracking-wide"
              >
                + add
              </Link>
            </div>
            {knowledgeLoading ? (
              <span className="text-[9px] text-muted-foreground/50">Loading…</span>
            ) : knowledgeFiles.length === 0 ? (
              <p className="text-[9px] text-muted-foreground/50">
                No files indexed.{" "}
                <Link href="/dashboard/knowledge" className="text-primary/60 hover:text-primary transition-colors duration-200">
                  Upload →
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {knowledgeFiles.map((f) => (
                  <span
                    key={f.id}
                    className="flex items-center gap-1.5 rounded-sm border border-border/30 bg-muted/30 px-2 py-1 font-mono text-[8px] text-foreground/60 uppercase tracking-wide"
                  >
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    {f.file_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Box Area */}
        <div className={cn(
    "px-3 sm:px-4 safe-pb transition-[padding] duration-200 ease-out",
    isCompact ? "pt-1.5 pb-1.5" : "pt-3 pb-3",
  )}>
          <form
            onSubmit={handleSubmit}
            className={cn(
              "sticky bottom-0 z-70 glass-2 rounded-md transition-[border-color,box-shadow] duration-200",
              "focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(200,241,53,0.10)]",
            )}
          >
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-3">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-sm border border-border/30 bg-muted/30 px-2.5 py-1.5">
                    <span className="font-mono text-[8px] text-foreground/60 truncate max-w-[100px] uppercase tracking-wide">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(atts => atts.filter((_, idx) => idx !== i))}
                      className="text-foreground/30 hover:text-foreground/60 transition-colors duration-150"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type your message…"
              rows={1}
              aria-label="Chat input"
              className={cn(
                "w-full resize-none bg-transparent",
                "px-3 pt-3 pb-2 text-sm text-foreground placeholder:text-foreground/30",
                "min-h-[44px] overflow-y-auto",
                "outline-none",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            />

            <div className="flex flex-wrap gap-1 px-2 pt-2">
              {TOOL_REGISTRY.map(tool => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = new Set(enabledTools);
                    next.has(tool.id) ? next.delete(tool.id) : next.add(tool.id);
                    setEnabledTools(next);
                  }}
                  title={`${enabledTools.has(tool.id) ? "Disable" : "Enable"} ${tool.label}`}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 py-1 rounded-sm transition-all duration-150 font-mono text-[7px] uppercase tracking-wider",
                    enabledTools.has(tool.id)
                      ? "text-primary/50 hover:text-primary/80"
                      : "text-muted-foreground/20 hover:text-muted-foreground/40",
                  )}
                >
                  <tool.icon strokeWidth={1.5} className="h-3 w-3 shrink-0" />
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-2 pb-2 pt-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
                className="h-9 w-9 flex items-center justify-center rounded-sm border border-border/20 text-foreground/30 hover:text-foreground/50 hover:bg-muted/40 hover:border-border/30 active:scale-90 transition-all duration-150 shrink-0"
              >
                <Paperclip strokeWidth={1.5} className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                title="Knowledge context"
                onClick={() => {
                  const next = !showKnowledge;
                  setShowKnowledge(next);
                  if (next) void loadKnowledge();
                }}
                className={cn(
                  "h-9 px-2.5 rounded-sm flex items-center gap-1.5 transition-all duration-150 border font-mono text-[8px] uppercase tracking-wider shrink-0",
                  showKnowledge
                    ? "border-primary/40 bg-primary/15 text-primary/90 hover:bg-primary/20 active:scale-95"
                    : "border-border/20 text-foreground/30 hover:text-foreground/50 hover:border-border/40",
                )}
              >
                <BookOpen strokeWidth={1.5} className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">context</span>
              </button>

              <div className="flex-1" />

              <div ref={modelPickerRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModelPicker(v => !v)}
                  className={cn(
                    "h-9 px-2.5 rounded-sm flex items-center gap-1.5 transition-all duration-150 border font-mono text-[8px] uppercase tracking-wider",
                    showModelPicker
                      ? "border-primary/40 bg-primary/15 text-primary/90"
                      : "border-border/20 text-foreground/30 hover:text-foreground/50 hover:border-border/40",
                  )}
                >
                  <span className="max-w-28 truncate">
                    {MODEL_REGISTRY.find(m => m.id === model)?.label ?? model}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
                {showModelPicker && (
                  <div className="absolute bottom-full mb-2 right-0 z-50 min-w-44 rounded-sm border border-border/40 bg-card py-1.5 shadow-lg">
                    {MODEL_REGISTRY.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setModel(id); setShowModelPicker(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-left font-mono text-[9px] uppercase tracking-wide transition-colors duration-150",
                          id === model
                            ? "text-primary bg-primary/10"
                            : "text-foreground/60 hover:text-foreground/80 hover:bg-muted/30",
                        )}
                      >
                        <span>{label}</span>
                        {id === model && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                aria-label={isLoading ? "Running" : "Send"}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-sm transition-all duration-150 shrink-0",
                  ((!input.trim() && attachments.length === 0) || isLoading)
                    ? "text-foreground/15 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90",
                )}
              >
                {isLoading
                  ? <Loader2 strokeWidth={2} className="h-3.5 w-3.5 animate-spin" />
                  : <Send strokeWidth={2} className="h-3.5 w-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          for (const file of files) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const base64 = evt.target?.result as string;
              setAttachments(prev => [...prev, {
                name: file.name,
                type: file.type,
                data: base64,
              }]);
            };
            reader.readAsDataURL(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
}