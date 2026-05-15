// AgentZero Lite — billing layer removed
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { AgentChat } from "@/components/dashboard/AgentChat";
import { AgentConfigPanel } from "@/components/dashboard/AgentConfigPanel";
import { AgentDetailClient } from "./_components/AgentDetailClient";
import { ChevronRight } from "lucide-react";
import { getDefaultModelId } from "@/lib/ai/model-registry";

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
  return { title: `${name} — AgentZero` };
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
  const agentInstructions = (agent.instructions as string | null);
  const defaultModelId    = getDefaultModelId();

  return (
    <div className="flex h-full flex-col">

      {/* Split layout: chats/chat on left, config on right (vertical stack on mobile) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-0 lg:gap-3">

        {/* Chat panel — fills remaining space, left on desktop */}
        <div className="flex-1 min-h-0">
          <AgentDetailClient agentId={agentId} agentName={agentName} initialPrompt={agentInstructions} defaultModelId={defaultModelId} />
        </div>

        {/* Config panel — right side, hidden on mobile */}
        <div className="hidden lg:flex w-64 shrink-0 rounded-sm border border-border bg-card overflow-hidden">
          <AgentConfigPanel
            agentId={agentId}
            initialName={agentName}
            initialPrompt={agentInstructions}
          />
        </div>

      </div>

    </div>
  );
}
