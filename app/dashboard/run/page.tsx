import type { Metadata } from "next";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { QuickLaunchForm } from "./_components/QuickLaunchForm";

export const metadata: Metadata = { title: "Quick Launch — AgentZero" };

export default async function RunPage() {
  const agents = await getOrgAgents();
  return <QuickLaunchForm agents={agents} />;
}
