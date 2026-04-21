import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { adminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { LayoutDashboard, Bot, Play, BookOpen, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mobile navigation ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard",           icon: LayoutDashboard },
  { label: "Agents",    href: "/dashboard/agents",     icon: Bot },
  { label: "Run",       href: "/dashboard/run",        icon: Play },
  { label: "Knowledge", href: "/dashboard/knowledge",  icon: BookOpen },
  { label: "Settings",  href: "/dashboard/settings",   icon: Settings },
] as const;

function MobileHeader() {
  return (
    <header className="flex md:hidden h-12 shrink-0 items-center gap-2.5 border-b border-border bg-background px-4">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#c8f135] text-[8px] font-black font-mono text-black leading-none">
        AZ
      </div>
      <span className="text-xs font-mono font-black tracking-tight uppercase text-foreground">
        AgentZero
      </span>
    </header>
  );
}

function MobileBottomNav() {
  return (
    <nav className="flex md:hidden shrink-0 border-t border-border bg-background">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2",
            "text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          <Icon className="size-5" />
          <span className="text-[10px]">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

type ShellData = {
  orgName?: string;
  userEmail?: string;
  creditsRemaining?: number;
  agentCount?: number;
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
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
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

  if (orgId) {
    const [orgRes, agentRes] = await Promise.all([
      adminClient.from("organisations").select("name").eq("id", orgId).single(),
      adminClient.from("agents").select("id", { count: "exact", head: true }).eq("organisation_id", orgId),
    ]);
    if (orgRes.data?.name) orgName = orgRes.data.name as string;
    agentCount = agentRes.count ?? 0;
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
    <DashboardShell shellData={{ orgName, userEmail: session.user?.email ?? undefined, creditsRemaining, agentCount }}>
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
