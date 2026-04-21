import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Usage — AgentZero" };

// ─── Credit overview ──────────────────────────────────────────────────────────

async function CreditOverview() {
  const session = await auth();
  const userId  = session?.user?.id;

  let creditsRemaining = 0;
  let creditsUsed      = 0;

  if (userId) {
    const { data } = await adminClient
      .from("user_credits")
      .select("credits_remaining, credits_used")
      .eq("user_id", userId)
      .single();
    if (data) {
      creditsRemaining = (data.credits_remaining as number) ?? 0;
      creditsUsed      = (data.credits_used as number)      ?? 0;
    }
  }

  const total    = creditsRemaining + creditsUsed;
  const usedPct  = total > 0 ? Math.round((creditsUsed / total) * 100) : 0;
  const approxRuns = Math.floor(creditsRemaining / 50);

  return (
    <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
      {[
        { label: "credits_remaining", value: creditsRemaining.toLocaleString(), sub: `≈ ${approxRuns} runs`, accent: true },
        { label: "credits_used",      value: creditsUsed.toLocaleString(),      sub: `of ${total.toLocaleString()} total`, accent: false },
        { label: "utilization",       value: `${usedPct}%`,                     sub: `${100 - usedPct}% remaining`, accent: false },
      ].map(({ label, value, sub, accent }) => (
        <div key={label} className="flex flex-col gap-3 bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
            {label}
          </p>
          <p className={accent
            ? "font-mono text-3xl font-black tabular-nums text-[#c8f135]"
            : "font-mono text-3xl font-black tabular-nums text-foreground"
          }>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground/40">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Usage bar chart (CSS-only) ───────────────────────────────────────────────

async function UsageChart() {
  await auth();
  const now  = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return {
      date:    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      credits: 0,
    };
  });

  return (
    <div className="rounded-sm border border-border bg-card p-5 space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
        Credits Used — Last 14 Days
      </p>
      <div className="flex items-end gap-1 h-20">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center group">
            <div
              className="w-full rounded-sm bg-muted/40 group-hover:bg-[#c8f135]/30 transition-colors"
              style={{ height: `${Math.max((d.credits / 100) * 100, 6)}%` }}
              title={`${d.date}: ${d.credits} cr`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="font-mono text-[10px] text-muted-foreground/30">{days[0]?.date}</span>
        <span className="font-mono text-[10px] text-muted-foreground/30">{days[days.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Usage history ────────────────────────────────────────────────────────────

function UsageHistory() {
  return (
    <div className="rounded-sm border border-dashed border-border bg-card px-4 py-12 text-center">
      <Zap className="mx-auto mb-3 h-6 w-6 text-muted-foreground/20" strokeWidth={1.25} />
      <p className="text-sm text-muted-foreground/40">No usage history yet.</p>
      <p className="mt-1 text-xs text-muted-foreground/25">
        Usage events appear here once your agents run.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsagePage() {
  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="font-mono font-black uppercase tracking-tight text-foreground">Usage</h1>
        </div>
        <Link
          href="/dashboard/settings"
          className="rounded-sm border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground/60 hover:text-foreground hover:border-border/70 transition-colors"
        >
          Account settings
        </Link>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-3 gap-px border border-border bg-border">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-28 rounded-none" />)}
        </div>
      }>
        <CreditOverview />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-36 w-full rounded-sm" />}>
        <UsageChart />
      </Suspense>

      <section className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">History</p>
        <UsageHistory />
      </section>

    </div>
  );
}
