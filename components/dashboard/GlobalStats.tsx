/**
 * components/dashboard/GlobalStats.tsx
 *
 * Server Component — NOT a cache boundary itself.
 * The expensive DB queries are isolated in fetchStatsByIds() which carries
 * its own "use cache" + 60s cacheLife. auth() (which reads headers()) is
 * called here in the component body, outside any cache scope, and the
 * extracted IDs are passed into the cached fetcher as arguments.
 *
 * Cache key = serialised (orgId, userId) — per-user, 60s TTL.
 */

import { cacheLife } from "next/cache";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { Zap, Bot, MessageSquare, Clock } from "lucide-react";

// ─── Cached DB fetcher ────────────────────────────────────────────────────────
// "use cache" lives here only. No dynamic data (headers/cookies) is read.
// Next.js derives the cache key from (orgId, userId).

async function fetchStatsByIds(orgId: string, userId: string) {
  "use cache";
  cacheLife({ revalidate: 60 });

  let totalAgents = 0;
  let creditsRemaining = 0;

  if (orgId) {
    const { count } = await adminClient
      .from("agents")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId);
    totalAgents = count ?? 0;
  }

  if (userId) {
    const { data } = await adminClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();
    creditsRemaining = (data?.credits_remaining as number) ?? 0;
  }

  return { totalAgents, creditsRemaining };
}

// ─── Component (regular Server Component — no cache boundary) ─────────────────

export async function GlobalStats() {
  const session = await auth();
  const orgId  = session?.user?.orgId ?? "";
  const userId = session?.user?.id    ?? "";

  const { totalAgents, creditsRemaining } = await fetchStatsByIds(orgId, userId);

  const STATS = [
    { label: "Total Agents",        value: String(totalAgents),            icon: Bot         },
    { label: "Credits Remaining",   value: creditsRemaining.toLocaleString(), icon: Zap      },
    { label: "Messages This Month", value: "—",                            icon: MessageSquare },
    { label: "Avg Response Time",   value: "—",                            icon: Clock       },
  ] as const;

  return (
    <div className={cn(
      "flex h-12 shrink-0 items-center",
      "border-b border-border bg-card px-4 overflow-x-auto"
    )}>
      {STATS.map(({ label, value, icon: Icon }, i) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2 px-4 shrink-0",
            i !== 0 && "border-l border-border"
          )}
        >
          <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground whitespace-nowrap">
              {label}
            </span>
            <span className="text-xs font-medium tabular-nums text-foreground">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
