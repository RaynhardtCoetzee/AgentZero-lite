import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { NewAgentButton } from "@/app/dashboard/_components/NewAgentButton";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "@/lib/utils";
import { Bot, Play } from "lucide-react";

export const metadata: Metadata = { title: "Agents — AgentZero" };

async function AgentTable() {
  const agents = await getOrgAgents();

  if (agents.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
        <Bot className="mx-auto mb-3 h-7 w-7 text-muted-foreground/20" strokeWidth={1.25} />
        <p className="text-sm text-muted-foreground/50">No agents yet.</p>
        <p className="mt-1 text-xs text-muted-foreground/30">
          Click &quot;New Agent&quot; to create your first agent.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_7rem_9rem_7rem_3rem] gap-3 border-b border-border px-4 py-2">
        {["NAME", "STATUS", "LAST RUN", "MODEL", ""].map((h) => (
          <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30">
            {h}
          </span>
        ))}
      </div>

      {agents.map((agent, i) => (
        <div
          key={agent.id}
          className={`grid grid-cols-[1fr_7rem_9rem_7rem_3rem] gap-3 items-center px-4 py-3 transition-colors hover:bg-muted/10 group ${
            i !== agents.length - 1 ? "border-b border-border/40" : ""
          }`}
        >
          {/* Name */}
          <Link
            href={`/dashboard/agents/${agent.id}`}
            className="font-mono text-sm font-medium text-foreground hover:text-[#c8f135] transition-colors truncate"
          >
            {agent.name}
          </Link>

          {/* Status */}
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            idle
          </span>

          {/* Last run */}
          <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
            {formatDistanceToNow(new Date(agent.created_at))}
          </span>

          {/* Model */}
          <span className="font-mono text-[10px] text-muted-foreground/40">
            default
          </span>

          {/* Run button */}
          <Link
            href={`/dashboard/agents/${agent.id}`}
            className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/30 hover:text-[#c8f135] hover:bg-[#c8f135]/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={`Run ${agent.name}`}
          >
            <Play className="h-3 w-3" />
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="font-mono font-black uppercase tracking-tight text-foreground">Agents</h1>
        </div>
        <NewAgentButton />
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full rounded-sm" />}>
        <AgentTable />
      </Suspense>
    </div>
  );
}
