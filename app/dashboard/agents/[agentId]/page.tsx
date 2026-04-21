import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { RunPanel } from "@/components/dashboard/RunPanel";
import { ChevronRight } from "lucide-react";

type Props = { params: Promise<{ agentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agentId } = await params;
  const session = await auth();
  const { data } = await adminClient
    .from("agents")
    .select("name")
    .eq("id", agentId)
    .eq("organisation_id", session?.user?.orgId ?? "")
    .single();
  const name = (data?.name as string) ?? "Agent";
  return { title: `Run ${name} — AgentZero` };
}

export default async function AgentPage({ params }: Props) {
  const { agentId } = await params;
  const session = await auth();
  const orgId   = session?.user?.orgId ?? "";

  const { data: agent } = await adminClient
    .from("agents")
    .select("id, name, instructions")
    .eq("id", agentId)
    .eq("organisation_id", orgId)
    .single();

  if (!agent) notFound();

  const agentName         = agent.name as string;
  const agentInstructions = (agent.instructions as string | null) ?? "";

  return (
    <div className="flex h-full flex-col gap-4">

      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href="/dashboard/agents"
          className="font-mono text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Run agent
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
        <span className="font-mono text-xs text-foreground/70">{agentName}</span>
      </div>

      {/* Run panel — fills remaining space */}
      <div className="flex-1 min-h-0">
        <RunPanel agentId={agentId} agentName={agentName} initialInstructions={agentInstructions} />
      </div>

    </div>
  );
}
