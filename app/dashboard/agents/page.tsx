import type { Metadata } from "next";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { getDefaultModelId } from "@/lib/ai/model-registry";
import { AgentsPageContent } from "./_components/AgentsPageContent";

export const metadata: Metadata = { title: "Agents — AgentZero" };

export default async function AgentsPage() {
  const [agents, defaultModelId] = await Promise.all([
    getOrgAgents(),
    Promise.resolve(getDefaultModelId()),
  ]);

  return <AgentsPageContent agents={agents} defaultModelId={defaultModelId} />;
}
