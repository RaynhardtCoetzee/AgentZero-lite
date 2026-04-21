import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { Play, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Run — AgentZero" };

export default async function RunPage() {
  const session = await auth();
  const orgId   = session?.user?.orgId ?? "";

  const agents = await getOrgAgents();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <h1 className="font-mono font-black uppercase tracking-tight text-foreground">Run</h1>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-sm text-muted-foreground/50">select agent</span>
      </div>

      {/* Agent selector */}
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
            Select an agent to run
          </p>
        </div>

        {agents.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Play className="mx-auto mb-3 h-7 w-7 text-muted-foreground/20" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground/50">No agents configured.</p>
            <p className="mt-1 text-xs text-muted-foreground/30">
              <Link href="/dashboard/agents/new" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                Create an agent
              </Link>{" "}
              first.
            </p>
          </div>
        ) : (
          agents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20 group ${
                i !== agents.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted/60 text-muted-foreground/50 group-hover:bg-[#c8f135]/15 group-hover:text-[#c8f135] transition-colors">
                <Play className="h-3 w-3" />
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="font-mono text-sm font-medium text-foreground truncate">
                  {agent.name}
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  Created {formatDistanceToNow(new Date(agent.created_at))}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/25 group-hover:text-muted-foreground transition-colors" />
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
