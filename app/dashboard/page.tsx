import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { NewAgentButton } from "./_components/NewAgentButton";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — AgentZero" };

// ─── Page header ──────────────────────────────────────────────────────────────

async function PageHeader() {
  const session = await auth();
  const orgId   = session?.user?.orgId;

  let orgName    = "workspace";
  let agentCount = 0;

  if (orgId) {
    const [orgRes, agentRes] = await Promise.all([
      adminClient.from("organisations").select("name").eq("id", orgId).single(),
      adminClient.from("agents").select("id", { count: "exact", head: true }).eq("organisation_id", orgId),
    ]);
    if (orgRes.data?.name) orgName = orgRes.data.name as string;
    agentCount = agentRes.count ?? 0;
  }

  const state: "populated" | "empty" = agentCount > 0 ? "populated" : "empty";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <h1 className="font-mono font-black uppercase tracking-tight text-foreground">
          Dashboard
        </h1>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-sm text-muted-foreground/60">{orgName}</span>
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          live
        </span>
        <div className="hidden sm:flex items-center gap-1">
          {(["populated", "loading", "empty"] as const).map((s) => (
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
      <NewAgentButton />
    </div>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

async function StatCards() {
  const session = await auth();
  const orgId   = session?.user?.orgId;
  const userId  = session?.user?.id;

  let credits    = 0;
  let agentCount = 0;

  if (orgId) {
    const { count } = await adminClient
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId);
    agentCount = count ?? 0;
  }
  if (userId) {
    const { data } = await adminClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();
    credits = (data?.credits_remaining as number) ?? 0;
  }

  const approxRuns = Math.floor(credits / 50);

  const cards = [
    {
      key:   "credits_remaining",
      value: credits.toLocaleString(),
      delta: `≈ ${approxRuns} runs remaining`,
      accent: true,
    },
    {
      key:   "agents_active",
      value: String(agentCount),
      delta: agentCount > 0 ? `${agentCount} configured` : "none yet",
      accent: false,
    },
    {
      key:   "total_runs",
      value: "—",
      delta: "no run data yet",
      accent: false,
    },
    {
      key:   "success_rate",
      value: "—",
      delta: "no run data yet",
      accent: false,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
      {cards.map(({ key, value, delta, accent }) => (
        <div key={key} className="flex flex-col gap-3 bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {key}
          </p>
          <p className={
            accent
              ? "text-3xl font-black font-mono tabular-nums text-[#c8f135]"
              : "text-3xl font-black font-mono tabular-nums text-foreground"
          }>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground/50">{delta}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Run status badge ─────────────────────────────────────────────────────────

function RunStatusBadge({ status }: { status: "running" | "success" | "failed" }) {
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5 font-mono text-xs text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        running
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
        success
      </span>
    );
  }
  return (
    <span className="rounded-sm border border-destructive/20 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] text-destructive">
      failed
    </span>
  );
}

// ─── Agent runs table ─────────────────────────────────────────────────────────

async function AgentRunsTable() {
  const agents = await getOrgAgents();

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-foreground">agent_runs</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {agents.length > 0 ? `${agents.length} agents` : "0 running"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-sm border border-border overflow-hidden">
            {(["all", "success", "failed", "running"] as const).map((tab, i) => (
              <button
                key={tab}
                className={`px-3 py-1 font-mono text-[10px] transition-colors ${
                  tab === "all"
                    ? "bg-card text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                } ${i > 0 ? "border-l border-border" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <span className="text-xs">≡</span>
            Logs
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2rem_1fr_8rem_7rem_7rem] gap-3 border-b border-border px-4 py-2">
        {["#", "PROMPT", "AGENT", "STARTED", "STATUS"].map((h) => (
          <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {agents.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground/50">No runs yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/30">
            Create an agent and run it to see history here.
          </p>
        </div>
      ) : (
        agents.slice(0, 10).map((agent, i) => (
          <Link
            key={agent.id}
            href={`/dashboard/agents/${agent.id}`}
            className="grid grid-cols-[2rem_1fr_8rem_7rem_7rem] gap-3 items-center border-b border-border/40 px-4 py-3 last:border-0 transition-colors hover:bg-muted/20"
          >
            <span className="font-mono text-xs text-muted-foreground/30 tabular-nums">
              {agents.length - i}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{agent.name}</p>
              <p className="truncate text-[10px] text-muted-foreground/40">
                Click to open agent
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground/50 truncate">
              {agent.name.toLowerCase().replace(/\s+/g, "-")}
            </span>
            <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
              {formatDistanceToNow(new Date(agent.created_at))}
            </span>
            <RunStatusBadge status="success" />
          </Link>
        ))
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      <Suspense fallback={<Skeleton className="h-8 w-full rounded-sm" />}>
        <PageHeader />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-none" />)}
        </div>
      }>
        <StatCards />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-sm" />}>
        <AgentRunsTable />
      </Suspense>

    </div>
  );
}
