import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { MobileBottomNav } from "./_components/MobileBottomNav";
import { DashboardMainContent } from "./_components/DashboardMainContent";
import { LayoutDashboard, Bot, Play, BookOpen, CreditCard, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mobile navigation ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard",            icon: LayoutDashboard },
  { label: "Agents",    href: "/dashboard/agents",     icon: Bot             },
  { label: "Run",       href: "/dashboard/run",        icon: Play            },
  { label: "Knowledge", href: "/dashboard/knowledge",  icon: BookOpen        },
  { label: "Billing",   href: "/dashboard/billing",    icon: CreditCard      },
] as const;



// ─── Shell ────────────────────────────────────────────────────────────────────

type Agent = { id: string; name: string };

type ShellData = {
  orgName?: string;
  userEmail?: string;
  creditsRemaining?: number;
  agentCount?: number;
  agents?: Agent[];
};

function DashboardShell({
  children,
  shellData,
}: {
  children: React.ReactNode;
  shellData: ShellData;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        orgName={shellData.orgName}
        userEmail={shellData.userEmail}
        creditsRemaining={shellData.creditsRemaining}
        agentCount={shellData.agentCount}
        agents={shellData.agents}
      />
      <div className="flex min-w-0 flex-1 flex-col relative">
        {/* Ambient light — radial emerald atmosphere (design spec) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="ambient-light absolute inset-0 opacity-60" />
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 -left-40 h-[400px] w-[400px] rounded-full bg-primary/[3%] blur-[100px]" />
        </div>

        {/* Dot grid — depth layer */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.75" cy="0.75" r="0.75" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Top bar — mobile logo + desktop credits/isolation header */}
        <div className="shrink-0 flex items-center justify-between px-4 md:px-6 min-h-12 border-b border-white/[0.06] relative z-10 glass-1 safe-pt">
          {/* Mobile: logo mark */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-primary text-[8px] font-black font-mono text-primary-foreground leading-none">AZ</div>
            <span className="font-mono text-[10px] font-black uppercase tracking-tight text-foreground">AgentZero</span>
          </div>
          {/* Desktop: left spacer so status group sits on the right */}
          <div className="hidden md:block" />

          {/* Status group — shown on both breakpoints */}
          <div className="flex items-center gap-3">
            {shellData.creditsRemaining !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline font-mono text-[8px] uppercase tracking-widest text-muted-foreground/35">Credits</span>
                <span className="font-mono text-xs tabular-nums font-black text-primary">
                  {shellData.creditsRemaining.toLocaleString()}
                  <span className="font-normal text-primary/50 text-[9px] ml-0.5">cr</span>
                </span>
              </div>
            )}
            <div className="h-3.5 w-px bg-border/40" />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] border border-primary/40 bg-primary/10 backdrop-blur-sm">
              <Lock className="h-2.5 w-2.5 text-primary shrink-0" />
              <span className="font-mono text-[7px] uppercase tracking-widest text-primary font-bold">Isolated</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        <DashboardMainContent>
          <PageTransition>{children}</PageTransition>
        </DashboardMainContent>
        <MobileBottomNav />
      </div>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  let orgName: string | undefined;
  let creditsRemaining: number | undefined;
  let agentCount: number | undefined;

  const orgId  = session.user?.orgId;
  const userId = session.user?.id;

  let agents: Agent[] | undefined;

  if (orgId) {
    const [orgRes, agentRes] = await Promise.all([
      adminClient.from("organisations").select("name").eq("id", orgId).single(),
      adminClient.from("agents").select("id, name").eq("organisation_id", orgId).order("created_at", { ascending: false }),
    ]);
    if (orgRes.data?.name) orgName = orgRes.data.name as string;
    if (agentRes.data) {
      agents = agentRes.data as Agent[];
      agentCount = agents.length;
    }
  }

  if (userId) {
    const { data: creditData } = await adminClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();
    if (creditData?.credits_remaining !== undefined) {
      creditsRemaining = creditData.credits_remaining as number;
    }
  }

  return (
    <DashboardShell shellData={{ orgName, userEmail: session.user?.email ?? undefined, creditsRemaining, agentCount, agents }}>
      {children}
    </DashboardShell>
  );
}

// ─── Guard skeleton ───────────────────────────────────────────────────────────

function GuardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background animate-pulse">
      <div className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-border">
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="h-3 w-20 rounded-sm bg-muted" />
        </div>
        <div className="flex flex-col gap-1 p-3 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-7 rounded-sm bg-muted" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 p-6 space-y-4">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<GuardSkeleton />}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
