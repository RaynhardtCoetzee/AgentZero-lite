"use client";

import { useState, useRef, Children, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, Brain, Copy, Check, Download, ArrowUpDown, Folder, FolderOpen, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

// ─── Segment parser ───────────────────────────────────────────────────────────

type Segment =
  | { type: "thought"; content: string }
  | { type: "text";    content: string };

function parseSegments(raw: string): Segment[] {
  // Split on complete <thought>…</thought> blocks only.
  // Incomplete tags (mid-stream) fall through as plain text.
  return raw
    .split(/(<thought>[\s\S]*?<\/thought>)/g)
    .filter((s) => s.length > 0)
    .map((part): Segment => {
      const m = part.match(/^<thought>([\s\S]*?)<\/thought>$/);
      return m
        ? { type: "thought", content: m[1].trim() }
        : { type: "text",    content: part };
    })
    .filter((s) => s.content.trim().length > 0);
}

// ─── CollapsibleList ──────────────────────────────────────────────────────────

function CollapsibleList({
  children,
  isOrdered,
}: {
  children: React.ReactNode;
  isOrdered: boolean;
}) {
  const [open, setOpen] = useState(false);

  const items = Children.toArray(children).filter(
    (child) => !(typeof child === "string" && !child.trim()),
  );
  const itemCount = items.length;
  const showCollapse = itemCount >= 5;

  const ListTag = isOrdered ? "ol" : "ul";
  const listClass = "mb-3 list-none space-y-1.5 py-2";

  if (!showCollapse) {
    return <ListTag className={listClass}>{children}</ListTag>;
  }

  return (
    <div className="mb-2">
      <ListTag className={listClass}>
        {open ? items : items.slice(0, 3)}
      </ListTag>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 text-xs text-primary/60 hover:text-primary/80 transition-colors font-mono"
        aria-expanded={open}
      >
        {open ? "Collapse" : `+ ${itemCount - 3} more`}
      </button>
    </div>
  );
}

// ─── InteractiveTable ─────────────────────────────────────────────────────────

function InteractiveTable({ children }: { children: React.ReactNode }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    if (!tableRef.current) return;
    const rows = Array.from(tableRef.current.querySelectorAll("tr"));
    const csv = rows
      .map((row) =>
        Array.from(row.querySelectorAll("th, td"))
          .map((cell) => {
            const text = cell.textContent || "";
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `table-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="mb-2 space-y-2">
      <div className="overflow-x-auto bg-white/[0.015]">
        <table ref={tableRef} className="w-full border-collapse text-xs">
          {children}
        </table>
      </div>
      <button
        type="button"
        onClick={exportCSV}
        className="flex items-center gap-1.5 text-[9px] font-medium text-primary/60 hover:text-primary transition-colors"
      >
        <Download className="h-2.5 w-2.5" />
        Export as CSV
      </button>
    </div>
  );
}

// ─── FileTreeBlock ────────────────────────────────────────────────────────────

type TreeNode = { name: string; isDir: boolean; depth: number };

function parseFileTreeText(text: string): TreeNode[] {
  return text.trim().split('\n').flatMap((line): TreeNode[] => {
    if (!line.trim()) return [];
    let depth = 0;
    let pos = 0;
    while (pos < line.length) {
      const chunk = line.slice(pos, pos + 4);
      if (chunk === '│   ' || chunk === '    ') { depth++; pos += 4; }
      else break;
    }
    const rest = line.slice(pos);
    const branchMatch = rest.match(/^[├└]──\s*/);
    let name: string;
    if (branchMatch) {
      depth++;
      name = rest.slice(branchMatch[0].length).trim();
    } else {
      name = rest.trim();
    }
    if (!name) return [];
    const isDir = name.endsWith('/');
    return [{ name: name.replace(/\/$/, ''), isDir, depth }];
  });
}

function isFileTreeContent(text: string): boolean {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 3) return false;
  return lines.some(l => /[├└│]/.test(l));
}

function extractChildrenText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return (node as unknown[]).map(extractChildrenText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as { props?: { children?: unknown } };
    return extractChildrenText(el.props?.children);
  }
  return '';
}

function FileTreeBlock({ content }: { content: string }) {
  const nodes = parseFileTreeText(content);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const pathStack: string[] = [];
  const visible: (TreeNode & { path: string })[] = [];

  for (const node of nodes) {
    pathStack.length = node.depth;
    pathStack[node.depth] = node.name;
    const path = pathStack.slice(0, node.depth + 1).join('/');
    const isHidden = Array.from({ length: node.depth }, (_, i) => {
      return collapsed.has(pathStack.slice(0, i + 1).join('/'));
    }).some(Boolean);
    if (!isHidden) visible.push({ ...node, path });
  }

  return (
    <div className="mb-2 rounded-sm border border-border/20 bg-muted/5 overflow-hidden">
      <div className="flex items-center px-3 py-1.5 border-b border-border/10">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/35">
          File Tree
        </span>
      </div>
      <div className="px-2 py-2 space-y-0.5">
        {visible.map(({ name, isDir, depth, path }) => {
          const isCollapsed = collapsed.has(path);
          return (
            <div
              key={path}
              style={{ paddingLeft: `${depth * 14 + 4}px` }}
              className={cn(
                "flex items-center gap-1.5 py-0.5 rounded-sm font-mono text-[11px] leading-none",
                isDir
                  ? "cursor-pointer hover:bg-muted/20 text-muted-foreground/65 transition-colors"
                  : "text-muted-foreground/45",
              )}
              onClick={isDir ? () => toggle(path) : undefined}
            >
              {isDir ? (
                isCollapsed
                  ? <Folder className="h-3 w-3 shrink-0 text-primary/40" />
                  : <FolderOpen className="h-3 w-3 shrink-0 text-primary/55" />
              ) : (
                <FileCode className="h-3 w-3 shrink-0 text-muted-foreground/25" />
              )}
              <span>{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CodeBlock (block code with copy button) ──────────────────────────────────

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function copy() {
    const text = preRef.current?.textContent ?? "";
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="group relative mb-2">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className={cn(
          "absolute right-2 top-2 flex items-center gap-1 rounded-sm px-1.5 py-0.5",
          "font-mono text-[9px] uppercase tracking-wider transition-all duration-150",
          "opacity-0 group-hover:opacity-100",
          copied
            ? "text-primary/80 opacity-100"
            : "text-muted-foreground/40 hover:text-muted-foreground/70",
        )}
      >
        {copied
          ? <><Check className="h-2.5 w-2.5" />copied</>
          : <><Copy className="h-2.5 w-2.5" />copy</>}
      </button>
      <pre ref={preRef} className="overflow-x-auto rounded bg-muted p-0">
        {children}
      </pre>
    </div>
  );
}

// ─── Markdown component map (shared) ─────────────────────────────────────────

const MD: Components = {
  p:          ({ children })             => <p className="mb-3 last:mb-0 leading-[1.9]">{children}</p>,
  h1:         ({ children })             => <h1 className="mb-3 text-base font-bold">{children}</h1>,
  h2: ({ children }) => {
    const text = typeof children === "string" ? children : "";
    const numMatch = text.match(/^(\d+\.)\s*/);
    const isKey = text.toLowerCase().includes("key");
    const body = numMatch ? text.slice(numMatch[0].length) : children;
    const prefix = numMatch ? <span className="text-primary/60 font-mono mr-1.5">{numMatch[1]}</span> : null;
    return isKey ? (
      <h2 className="mb-3 mt-7 text-sm font-bold text-primary/90 font-mono uppercase tracking-wide">{prefix}{body}</h2>
    ) : (
      <h2 className="mb-3 mt-7 text-sm font-bold border-l-2 border-primary/40 pl-3 bg-primary/5 py-1.5">{prefix}{body}</h2>
    );
  },
  h3:         ({ children }) => {
    const isKeyObs = typeof children === "string" && children.toLowerCase().includes("observation");
    return isKeyObs ? (
      <h3 className="mb-2 mt-5 text-sm font-semibold text-primary/80">{children}</h3>
    ) : (
      <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground/70 font-mono text-[11px] uppercase tracking-wide">{children}</h3>
    );
  },
  ul:         ({ children })             => <CollapsibleList isOrdered={false}>{children}</CollapsibleList>,
  ol:         ({ children })             => <CollapsibleList isOrdered={true}>{children}</CollapsibleList>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 list-none border border-border/[0.15] rounded-sm px-3 py-2 bg-white/[0.015] hover:bg-white/[0.025] transition-colors">
      <span className="mt-[7px] h-[5px] w-[5px] rounded-full bg-primary/35 shrink-0" />
      <span className="flex-1 min-w-0 leading-[1.8] text-foreground/70">{children}</span>
    </li>
  ),
  pre: ({ children }) => {
    const raw = extractChildrenText(children);
    if (isFileTreeContent(raw)) return <FileTreeBlock content={raw} />;
    return <CodeBlock>{children}</CodeBlock>;
  },
  blockquote: ({ children })             => <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground/70">{children}</blockquote>,
  strong:     ({ children })             => <strong className="font-semibold">{children}</strong>,
  hr:         ()                         => <hr className="my-2 border-border" />,
  a:          ({ href, children })       => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = Boolean(className?.includes("language-"));
    return isBlock ? (
      <code className="block rounded bg-muted px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {children}
      </code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
    );
  },
  table: ({ children }) => <InteractiveTable>{children}</InteractiveTable>,
  tr: ({ children }) => <tr className="even:bg-white/[0.02] transition-colors">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b border-border/40 bg-muted/40 px-3 py-2 text-left font-semibold text-muted-foreground/70 hover:bg-muted/60 transition-colors cursor-pointer group">
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
      </div>
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/10 px-3 py-2 text-foreground/75">{children}</td>
  ),
};

// ─── ThoughtBlock ─────────────────────────────────────────────────────────────

function ThoughtBlock({
  content,
  isStreaming,
  hasFollowingText,
}: {
  content: string;
  isStreaming?: boolean;
  hasFollowingText?: boolean;
}) {
  // Start open while the thought is "live" (no following text yet); collapse once text flows in
  const [open, setOpen] = useState(!hasFollowingText);

  useEffect(() => {
    if (hasFollowingText) {
      const t = setTimeout(() => setOpen(false), 700);
      return () => clearTimeout(t);
    }
  }, [hasFollowingText]);

  return (
    <div className="mb-2.5">
      {/* Minimalist header — collapsed state shows progress dot */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-0.5 py-1 text-left group"
          aria-expanded={open}
        >
          <div className="relative flex items-center gap-1.5">
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 rounded-full bg-primary/60 ${isStreaming && !hasFollowingText ? "animate-pulse" : ""}`}
            />
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">
              [kernel]
            </span>
          </div>
          <span className="ml-auto text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 font-mono transition-colors">
            View logic
          </span>
        </button>
      )}

      {/* Expanded state — full thought display */}
      {open && (
        <div className="rounded-sm border border-border/30 bg-muted/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/20 transition-colors"
            aria-expanded={open}
          >
            <Brain className="h-3 w-3 shrink-0 text-muted-foreground/35" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/40">
              [Architect_Kernel]
            </span>
            <ChevronDown
              className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/30 rotate-180"
            />
          </button>
          <div className="border-t border-border/20 px-3 py-2.5 max-h-48 overflow-y-auto">
            <p className="font-mono text-[10px] leading-relaxed text-muted-foreground/55 whitespace-pre-wrap">
              {content
                .split(/\b(tool_call|search|query|read|write|send|fetch|check|analyze|retrieve|summarize|respond)\b/gi)
                .map((chunk, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className="text-primary/60">{chunk}</span>
                  ) : (
                    chunk
                  ),
                )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AssistantContent ─────────────────────────────────────────────────────────

export function AssistantContent({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const segments = parseSegments(content);

  return (
    <div className="break-words font-sans text-sm leading-[1.8]">
      {segments.map((seg, i) => {
        if (seg.type === "thought") {
          const hasFollowingText = segments.slice(i + 1).some((s) => s.type === "text");
          return (
            <ThoughtBlock
              key={i}
              content={seg.content}
              isStreaming={isStreaming}
              hasFollowingText={hasFollowingText}
            />
          );
        }
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={MD}>
            {seg.content}
          </ReactMarkdown>
        );
      })}
      {isStreaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] rounded-[1px] bg-current opacity-60 animate-pulse"
        />
      )}
    </div>
  );
}
