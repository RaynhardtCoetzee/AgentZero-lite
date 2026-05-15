"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "@/lib/utils";
import { Play, Bot, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/actions/agent-crud-actions";

function StatusIndicator({ status }: { status: "running" | "idle" | "error" }) {
  const statusConfig = {
    running: { dot: "bg-primary",              text: "running", animation: "status-pulse-green" },
    idle:    { dot: "bg-muted-foreground/30",  text: "idle",    animation: ""                   },
    error:   { dot: "bg-destructive",          text: "error",   animation: "status-pulse-red"   },
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

type Props = {
  agents: Agent[];
  onSelectAgent?: (agent: Agent) => void;
};

export function AgentKanban({ agents, onSelectAgent }: Props) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="group relative flex flex-row sm:flex-col gap-3 sm:gap-3.5 items-center sm:items-stretch rounded-sm border border-border bg-card p-3.5 sm:p-4 transition-all duration-200 cursor-pointer hover:border-primary/30 hover:bg-primary/5 active:scale-95 sm:active:scale-100"
          onClick={() => {
            if (onSelectAgent) {
              onSelectAgent(agent);
            } else {
              router.push(`/dashboard/agents/${agent.id}`);
            }
          }}
        >
          {/* Zone center: Name + description */}
          <div className="flex-1 min-w-0 sm:flex-none">
            <p className="font-mono text-xs sm:text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate">
              {agent.name}
            </p>
            {agent.instructions && (
              <p className="text-[10px] sm:text-sm text-muted-foreground/50 truncate sm:line-clamp-2 mt-0.5 sm:mt-0">
                {agent.instructions}
              </p>
            )}
          </div>

          {/* Zone right: chevron on mobile */}
          <div className="sm:hidden flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </div>

          {/* Desktop: bot icon and quick-action buttons */}
          <div className="hidden sm:flex items-start justify-between gap-2">
            <Bot className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5" />
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/agents/${agent.id}?view=config`);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors"
                aria-label={`Edit ${agent.name}`}
                title="Edit"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectAgent) {
                    onSelectAgent(agent);
                  } else {
                    router.push(`/dashboard/agents/${agent.id}?view=chat`);
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label={`Run ${agent.name}`}
                title="Run"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop: Footer with status and date */}
          <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border/40 text-xs sm:text-sm">
            <StatusIndicator status="idle" />
            <span className="text-muted-foreground/40">
              {formatDistanceToNow(new Date(agent.created_at))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
