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
      "grid grid-cols-2 sm:flex sm:h-14 shrink-0 sm:items-center",
      "glass-1 rounded-md sm:rounded-none sm:border-x-0 sm:border-t-0 border-b border-white/[0.06]",
      "sm:px-4 px-3 py-2 sm:py-0 sm:overflow-x-auto gap-y-2 gap-x-0",
    )}>
      {STATS.map(({ label, value, icon: Icon }, i) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2.5 sm:px-4 px-2 py-1 sm:py-0 sm:shrink-0",
            i !== 0 && "sm:border-l sm:border-white/[0.06]"
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-white/[0.04] border border-white/[0.06]">
            <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[8px] uppercase tracking-widest leading-none text-muted-foreground/55 whitespace-nowrap">
              {label}
            </span>
            <span className="text-sm font-mono font-black tabular-nums text-foreground mt-1 leading-none">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
