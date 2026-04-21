import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { UploadKnowledge } from "@/components/dashboard/UploadKnowledge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Trash2, RefreshCcw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Knowledge — AgentZero" };

// ─── Types ────────────────────────────────────────────────────────────────────

type DocRow = {
  id:         string;
  file_name:  string;
  file_type:  string;
  created_at: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "indexed" | "processing" | "failed" }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
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
    <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/25 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] text-destructive">
      failed
    </span>
  );
}

// ─── Document list ────────────────────────────────────────────────────────────

async function DocumentList() {
  const session = await auth();
  const orgId   = session?.user?.orgId;
  if (!orgId) return null;

  const { data: docs } = await adminClient
    .from("documents")
    .select("id, file_name, file_type, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const documents = (docs ?? []) as DocRow[];
  const state: "populated" | "empty" = documents.length > 0 ? "populated" : "empty";

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/50">
            Indexed Files {documents.length > 0 && documents.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/35">
            attached to: {orgId.slice(0, 8)}…
          </span>
          <Link
            href="/dashboard/agents"
            className="rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground/60 hover:text-foreground hover:border-border/70 transition-colors"
          >
            Manage agents
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_6rem_5rem_7rem_9rem_4rem] gap-3 border-b border-border px-4 py-2">
          {["NAME", "SIZE", "CHUNKS", "UPLOADED", "STATUS", ""].map((h) => (
            <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30">
              {h}
            </span>
          ))}
        </div>

        {documents.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <FileText className="mx-auto mb-3 h-7 w-7 text-muted-foreground/20" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground/50">No documents uploaded yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/30">
              Drop a PDF or TXT file above to build your knowledge base.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-[1fr_6rem_5rem_7rem_9rem_4rem] gap-3 items-center border-b border-border/40 px-4 py-3 last:border-0 hover:bg-muted/10 transition-colors group"
              >
                {/* Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                  <span className="truncate text-sm text-foreground">{doc.file_name}</span>
                </div>

                {/* Size */}
                <span className="font-mono text-xs text-muted-foreground/40">—</span>

                {/* Chunks */}
                <span className="font-mono text-xs text-muted-foreground/40">—</span>

                {/* Uploaded */}
                <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
                  {formatDistanceToNow(new Date(doc.created_at))}
                </span>

                {/* Status */}
                <StatusBadge status="indexed" />

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors">
                    <Search className="h-3 w-3" />
                  </button>
                  <button className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function KnowledgePage() {
  const session = await auth();
  const orgId   = session?.user?.orgId;
  let docCount  = 0;

  if (orgId) {
    const { count } = await adminClient
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    docCount = count ?? 0;
  }

  const state: "populated" | "uploading" | "empty" =
    docCount > 0 ? "populated" : "empty";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-mono font-black uppercase tracking-tight text-foreground">
          Knowledge
        </h1>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-sm text-muted-foreground/60">org-knowledge</span>
        <div className="flex items-center gap-1">
          {(["empty", "uploading", "populated"] as const).map((s) => (
            <span
              key={s}
              className={
                s === state
                  ? "rounded-sm border border-[#c8f135]/60 bg-[#c8f135]/10 px-2 py-0.5 font-mono text-[10px] text-[#c8f135]"
                  : "rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground/30"
              }
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <UploadKnowledge agentId="" />

      {/* Indexed files */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-sm" />}>
        <DocumentList />
      </Suspense>

    </div>
  );
}
