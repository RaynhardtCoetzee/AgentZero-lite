"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Trash2, Loader2, ArrowLeft, Calendar, Hash, Layers, Maximize2, X } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { UploadKnowledge } from "@/components/dashboard/UploadKnowledge";
import { getDocumentContent } from "@/lib/actions/document-actions";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export type DocRow = {
  id:         string;
  file_name:  string;
  file_type:  string;
  created_at: string;
  content?:   string;
};

type Props = {
  documents: DocRow[];
  orgId: string;
};

// ─── Status badge with pulse animation ───────────────────────────────────────

function StatusBadge({ status }: { status: "indexed" | "processing" | "failed" }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animation: "status-pulse-green 2.4s ease-out infinite" }}
        />
        indexed
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-400">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/25 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] text-destructive">
      <span
        className="h-1.5 w-1.5 rounded-full bg-destructive"
        style={{ animation: "status-pulse-red 1.8s ease-out infinite" }}
      />
      failed
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KnowledgePageContent({ documents, orgId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = documents.find((d) => d.id === selectedId) ?? null;

  // Lock body scroll on mobile when a doc is selected (drawer mode)
  useEffect(() => {
    if (!selected) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 1024) return; // desktop is split-pane, no lock
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Page header */}
      <div className="flex flex-col xs:flex-row xs:items-end gap-3 xs:gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-primary/85 font-black">
              Knowledge
            </span>
          </div>
          <h1 className="font-mono font-black uppercase tracking-[-0.02em] text-2xl sm:text-3xl text-foreground leading-[0.95]">
            Document Index
          </h1>
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground/60">
            <span className="text-foreground/75">{documents.length}</span> file{documents.length === 1 ? "" : "s"} ·{" "}
            <span className="text-foreground/75">{orgId.slice(0, 8)}…</span>
          </p>
        </div>
      </div>

      {/* Upload */}
      <UploadKnowledge agentId="" />

      {/* Split pane: list on the left, preview on the right (desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 lg:gap-5">

        {/* List */}
        <div className="rounded-md glass-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/65 font-bold">
              Indexed Files {documents.length > 0 && `(${documents.length})`}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="px-4 py-12 sm:py-16 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" strokeWidth={1.25} />
              <p className="text-sm text-muted-foreground/60 font-medium">No documents yet</p>
              <p className="mt-1 text-xs text-muted-foreground/40">
                Drop a PDF, TXT, or MD file above.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04] max-h-[calc(100dvh-190px)] overflow-y-auto">
              {documents.map((doc, i) => {
                const fileType = doc.file_type?.toUpperCase().slice(-3) || "TXT";
                const isSelected = doc.id === selectedId;
                return (
                  <li
                    key={doc.id}
                    style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                    className="anim-fade-up"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={cn(
                        "group w-full flex items-center gap-3 px-4 py-4 lg:py-3 text-left",
                        "transition-[background-color,border-color] duration-150",
                        isSelected
                          ? "bg-primary/8 border-l-2 border-primary"
                          : "border-l-2 border-transparent hover:bg-white/[0.03]",
                      )}
                    >
                      {/* File type badge */}
                      <span className={cn(
                        "font-mono text-[9px] px-1.5 py-1 rounded shrink-0 border leading-none",
                        isSelected
                          ? "border-primary/30 bg-primary/12 text-primary"
                          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground/55",
                      )}>
                        {fileType}
                      </span>

                      {/* Name + timestamp */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "truncate text-[15px] lg:text-sm leading-tight",
                          isSelected ? "text-foreground font-semibold" : "text-foreground/85",
                        )}>
                          {doc.file_name}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/45">
                          {formatDistanceToNow(new Date(doc.created_at))}
                        </p>
                      </div>

                      {/* Status: dot on mobile, full badge on desktop */}
                      <span className={cn(
                        "lg:hidden shrink-0 w-2 h-2 rounded-full",
                        isSelected ? "bg-primary" : "bg-primary/40",
                      )} />
                      <span className="hidden lg:block shrink-0">
                        <StatusBadge status="indexed" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Preview pane — desktop */}
        <div className="hidden lg:flex lg:flex-col rounded-md glass-1 overflow-hidden h-[calc(100dvh-190px)]">
          {selected ? (
            <DocumentPreview doc={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <PreviewEmpty />
          )}
        </div>
      </div>

      {/* Mobile drawer for preview */}
      {selected && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setSelectedId(null)}
            className="fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm opacity-100 starting:opacity-0 transition-opacity duration-200"
          />
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed inset-x-0 bottom-0 z-[60] h-[88dvh] flex flex-col rounded-t-xl glass-3",
              "border-t border-white/[0.08] shadow-[0_-30px_60px_-20px_rgba(0,0,0,0.7)]",
              "translate-y-0 starting:translate-y-full transition-transform duration-300 ease-out",
              "safe-pb",
            )}
          >
            {/* Drag handle */}
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/[0.18]" />
            </div>
            <DocumentPreview doc={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Preview pane ─────────────────────────────────────────────────────────────

function DocumentPreview({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  const fileType = doc.file_type?.toUpperCase().slice(-3) || "TXT";
  const [content, setContent] = useState<string | null>(doc.content ?? null);
  const [isLoading, setIsLoading] = useState(!doc.content);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setContent(doc.content ?? null);
    setIsLoading(!doc.content);
    setError(null);

    if (doc.content) return;

    const fetchContent = async () => {
      try {
        const result = await getDocumentContent(doc.id);
        if (result.ok) {
          setContent(result.content);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchContent();
  }, [doc.id, doc.content]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden tap-target h-9 w-9 flex items-center justify-center rounded-sm text-muted-foreground/60 hover:bg-white/[0.06] -ml-2 shrink-0 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Mobile: filename + type label */}
        <div className="lg:hidden flex-1 min-w-0">
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-primary/60 font-bold mb-0.5">{fileType}</p>
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{doc.file_name}</p>
        </div>

        {/* Desktop: "PREVIEW" pill */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" style={{ animation: "status-pulse-green 2.4s ease-out infinite" }} />
          <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-primary/80 font-bold">
            Preview
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="tap-target h-7 w-7 flex items-center justify-center rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-colors"
            aria-label="Expand document"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="tap-target h-7 w-7 hidden lg:flex items-center justify-center rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-colors"
            aria-label="Search inside"
          >
            <Search className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="tap-target h-7 w-7 hidden lg:flex items-center justify-center rounded-sm text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Expanded fullscreen modal */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
          <div className="fixed inset-6 z-[80] flex flex-col rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_40px_80px_rgba(0,0,0,0.8)]" style={{ background: '#0a0a0a' }}>
            {/* Expanded header */}
            <div className="shrink-0 flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.06]" style={{ background: 'rgba(16,185,129,0.03)' }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <FileText className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40">
                  {fileType} · {formatDistanceToNow(new Date(doc.created_at))}
                  {content && ` · ${content.length.toLocaleString()} chars`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-colors"
                aria-label="Close expanded view"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Expanded scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-10">
                {isLoading ? (
                  <div className="flex items-center gap-2.5 py-16 justify-center text-muted-foreground/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-mono text-xs">Loading content…</span>
                  </div>
                ) : error ? (
                  <p className="text-sm text-destructive/80 font-mono">{error}</p>
                ) : content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">No content available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* File hero — pinned, hidden on mobile (header already shows filename) */}
        <div className="hidden lg:block shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.05]" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, transparent 60%)" }}>
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary/60 mb-1 font-bold">{fileType}</p>
              <p className="text-sm font-semibold text-foreground break-all leading-snug">{doc.file_name}</p>
            </div>
            <div className="shrink-0 pt-0.5">
              <StatusBadge status="indexed" />
            </div>
          </div>
        </div>

        {/* Metadata strip — pinned */}
        <div className="shrink-0 grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05]">
          <MetaCell Icon={Calendar} label="Uploaded" value={new Date(doc.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" })} />
          <MetaCell Icon={Hash} label="ID" value={`#${doc.id.slice(0, 7)}`} mono />
          <MetaCell Icon={Layers} label="Chunks" value="—" />
        </div>

        {/* Content section — fills remaining space, glass card scrolls */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5">
          <div className="flex-1 min-h-0 rounded-md glass-2 flex flex-col">
            {/* Glass header — pinned inside card */}
            <div className="shrink-0 flex items-center gap-2.5 px-5 pt-5 pb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground/40 font-bold">Content</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
              {content && (
                <span className="font-mono text-[9px] text-muted-foreground/35">
                  {content.length.toLocaleString()} chars
                </span>
              )}
            </div>
            {/* Scrollable content inside glass */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
              {isLoading ? (
                <div className="flex items-center gap-2.5 py-8 justify-center text-muted-foreground/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-mono text-xs">Loading content…</span>
                </div>
              ) : error ? (
                <p className="text-sm text-destructive/80 font-mono">{error}</p>
              ) : content ? (
                <div>
                  <MarkdownRenderer content={content.slice(0, 4000)} />
                  {content.length > 4000 && (
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <p className="font-mono text-[9px] text-muted-foreground/35 uppercase tracking-[0.16em]">
                        +{(content.length - 4000).toLocaleString()} more chars
                      </p>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No content available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCell({
  Icon,
  label,
  value,
  mono = false,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 lg:px-4 lg:py-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-2.5 w-2.5 text-muted-foreground/35" strokeWidth={1.75} />
        <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/35 font-bold">
          {label}
        </span>
      </div>
      <span className={cn(
        "font-mono text-xs tabular-nums text-foreground/70 leading-none truncate",
        mono && "text-primary/70",
      )}>
        {value}
      </span>
    </div>
  );
}

function PreviewEmpty() {
  return (
    <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center gap-4 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.06]">
        <FileText className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/55 font-bold">
          No file selected
        </p>
        <p className="text-sm text-muted-foreground/60 font-light">
          Pick a document from the list to preview it here.
        </p>
      </div>
    </div>
  );
}