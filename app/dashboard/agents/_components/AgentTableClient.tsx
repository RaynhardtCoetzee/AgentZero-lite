"use client";

import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/actions/agent-crud-actions";

type AgentStatus = "running" | "idle" | "error";

function StatusIndicator({ status }: { status: AgentStatus }) {
  const statusConfig = {
    running: { dot: "bg-primary",     text: "running", animation: "status-pulse-green" },
    idle:    { dot: "bg-amber-600",   text: "idle",    animation: "status-pulse-amber" },
    error:   { dot: "bg-destructive", text: "error",   animation: "status-pulse-red"   },
  };

  const config = statusConfig[status];

  return (
    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/50">
      <span
        className={cn("h-2.5 w-2.5 rounded-full", config.dot)}
        style={{ animation: `${config.animation} 2s infinite` }}
      />
      {config.text}
    </span>
  );
}

function AgentTooltip({ name, instructions }: { name: string; instructions: string | null }) {
  const summary = instructions ? instructions.slice(0, 120) + (instructions.length > 120 ? "…" : "") : "No description";

  return (
    <div className="group relative inline-block">
      <span className="cursor-help border-b border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors">
        {name}
      </span>
      <div className="pointer-events-none absolute left-0 bottom-full mb-2 hidden w-48 rounded-sm border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground/70 shadow-lg group-hover:block z-50">
        {summary}
        <div className="absolute top-full left-1.5 -mt-1.5 h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-border" />
      </div>
    </div>
  );
}

type Props = {
  agents: Agent[];
};

export function AgentTableClient({ agents }: Props) {
  return (
    <div className="rounded-sm border border-border/40 bg-card overflow-x-auto">
      {/* Column headers — hidden on mobile */}
      <div className="hidden md:grid grid-cols-[1fr_7rem_9rem_7rem_3rem] gap-3 border-b border-border/40 px-4 py-2.5 bg-muted/20">
        {["NAME", "STATUS", "LAST RUN", "MODEL", ""].map((h) => (
          <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">
            {h}
          </span>
        ))}
      </div>

      <div className="md:space-y-0">
        {agents.map((agent, i) => (
          <div
            key={agent.id}
            className={cn(
              "hidden md:grid grid-cols-[1fr_7rem_9rem_7rem_3rem] gap-3 items-center px-4 py-2.5 transition-all group hover:bg-muted/5",
              i !== agents.length - 1 ? "border-b border-border/20" : "",
            )}
          >
            <Link
              href={`/dashboard/agents/${agent.id}`}
              className="font-mono text-sm font-medium text-foreground/80 hover:text-primary transition-colors truncate"
            >
              <AgentTooltip name={agent.name} instructions={agent.instructions} />
            </Link>

            <StatusIndicator status="idle" />

            <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
              {formatDistanceToNow(new Date(agent.created_at))}
            </span>

            <span className="font-mono text-[10px] text-muted-foreground/40">
              default
            </span>

            <Link
              href={`/dashboard/agents/${agent.id}`}
              className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Run ${agent.name}`}
            >
              <Play className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-2 p-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-sm border border-border/40 bg-muted/5 hover:bg-muted/10 px-3 py-3 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="block font-mono text-sm font-medium text-foreground/80 hover:text-primary transition-colors truncate"
                >
                  {agent.name}
                </Link>
                <div className="mt-1.5 space-y-1 text-xs text-muted-foreground/60">
                  <div>Created {formatDistanceToNow(new Date(agent.created_at))}</div>
                  <StatusIndicator status="idle" />
                </div>
              </div>
              <Link
                href={`/dashboard/agents/${agent.id}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label={`Run ${agent.name}`}
              >
                <Play className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
