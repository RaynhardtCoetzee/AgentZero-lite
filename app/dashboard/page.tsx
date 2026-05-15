import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getOrgAgents } from "@/lib/actions/agent-crud-actions";
import { DashboardHud, buildVitals } from "./_components/DashboardHud";
import { AgentFleet, type FleetAgentStat } from "./_components/AgentFleet";
import { TerminalDrawer } from "./_components/TerminalDrawer";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Dashboard — AgentZero" };

// ─── Hud (server) — combines header + vitals ─────────────────────────────────

async function HudSection() {
  const session = await auth();
  const orgId   = session?.user?.orgId;
  const userId  = session?.user?.id;

  let orgName    = "workspace";
  let agentCount = 0;
  let credits    = 0;

  if (orgId) {
    const [orgRes, agentRes] = await Promise.all([
      adminClient.from("organisations").select("name").eq("id", orgId).single(),
      adminClient.from("agents").select("id", { count: "exact", head: true }).eq("organisation_id", orgId),
    ]);
    if (orgRes.data?.name) orgName = orgRes.data.name as string;
    agentCount = agentRes.count ?? 0;
  }

  if (userId) {
    const { data } = await adminClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();
    credits = (data?.credits_remaining as number) ?? 0;
  }

  return <DashboardHud orgName={orgName} vitals={buildVitals({ credits, agentCount })} />;
}

// ─── Fleet (server) — fetches agents + per-agent stats ───────────────────────

async function fetchAgentStats(agentIds: string[], orgId: string): Promise<Map<string, FleetAgentStat>> {
  const map = new Map<string, FleetAgentStat>();
  if (agentIds.length === 0) return map;

  const [{ data: convs }, { data: msgs }] = await Promise.all([
    adminClient
      .from("conversations")
      .select("id, agent_id, updated_at")
      .eq("organisation_id", orgId)
      .in("agent_id", agentIds),
    adminClient
      .from("conversation_messages")
      .select("conversation_id, conversations!inner(agent_id, organisation_id)")
      .eq("conversations.organisation_id", orgId)
      .in("conversations.agent_id", agentIds),
  ]);

  const convMap = new Map<string, { agentId: string; updatedAt: string }>();
  for (const c of convs ?? []) {
    convMap.set(c.id as string, {
      agentId: c.agent_id as string,
      updatedAt: c.updated_at as string,
    });
  }

  for (const id of agentIds) map.set(id, { conversations: 0, messages: 0, lastActiveAt: null });

  for (const c of convs ?? []) {
    const stat = map.get(c.agent_id as string);
    if (!stat) continue;
    stat.conversations += 1;
    const updatedAt = c.updated_at as string;
    if (!stat.lastActiveAt || updatedAt > stat.lastActiveAt) stat.lastActiveAt = updatedAt;
  }

  for (const m of msgs ?? []) {
    const conv = convMap.get(m.conversation_id as string);
    if (!conv) continue;
    const stat = map.get(conv.agentId);
    if (stat) stat.messages += 1;
  }

  return map;
}

async function FleetSection() {
  const session = await auth();
  const orgId = session?.user?.orgId ?? "";
  const agents = await getOrgAgents();
  const agentStats = orgId ? await fetchAgentStats(agents.map((a) => a.id), orgId) : new Map<string, FleetAgentStat>();

  return <AgentFleet agents={agents} agentStats={agentStats} />;
}

// ─── Terminal (server) — collects manifest lines for the drawer ──────────────

async function TerminalSection() {
  let credits    = 0;
  let agentCount = 0;
  let orgId: string | undefined;

  try {
    const session = await auth();
    orgId          = session?.user?.orgId;
    const userId   = session?.user?.id;

    const [agentRes, creditRes] = await Promise.allSettled([
      orgId
        ? adminClient.from("agents").select("id", { count: "exact", head: true }).eq("organisation_id", orgId)
        : Promise.resolve({ count: 0 }),
      userId
        ? adminClient.from("user_credits").select("credits_remaining").eq("user_id", userId).single()
        : Promise.resolve({ data: null }),
    ]);

    if (agentRes.status === "fulfilled") agentCount = (agentRes.value as { count: number | null }).count ?? 0;
    if (creditRes.status === "fulfilled") {
      const row = (creditRes.value as { data: { credits_remaining: number } | null }).data;
      credits = row?.credits_remaining ?? 0;
    }
  } catch {
    // never break the Suspense boundary
  }

  const lines: { tag: string; msg: string; ok?: boolean }[] = [
    { tag: "BOOT",  msg: `agentzero/runtime v16.2.1 • turbopack` },
    { tag: "AUTH",  msg: `session valid • auth.js v5 • tenant: ${orgId?.slice(0, 8) ?? "—"}…` },
    { tag: "FLEET", msg: `${agentCount} agent${agentCount !== 1 ? "s" : ""} online • isolation: active` },
    { tag: "FUEL",  msg: `${credits.toLocaleString()} credits remaining` },
    { tag: "VEC",   msg: `pgvector index hot • supabase` },
    { tag: "OK",    msg: `all systems nominal`, ok: true },
  ];

  return <TerminalDrawer lines={lines} />;
}

// ─── Page — viewport-locked bento layout ─────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 md:h-full md:min-h-0">

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-md shrink-0" />}>
        <HudSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="flex-1 w-full rounded-md min-h-0" />}>
        <FleetSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-10 w-full rounded-md shrink-0" />}>
        <TerminalSection />
      </Suspense>

    </div>
  );
}
