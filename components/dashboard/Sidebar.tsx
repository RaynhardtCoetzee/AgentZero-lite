"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Play,
  BookOpen,
  CreditCard,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";

type Agent = { id: string; name: string };

type SidebarProps = {
  orgName?: string;
  userEmail?: string;
  creditsRemaining?: number;
  agentCount?: number;
  agents?: Agent[];
};

export function Sidebar({ orgName, userEmail, creditsRemaining, agentCount, agents }: SidebarProps) {
  const pathname = usePathname();
  const currentAgentId = pathname.match(/\/dashboard\/agents\/([^/?]+)/)?.[1];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initial = userEmail?.charAt(0).toUpperCase() ?? "?";
  const displayName = userEmail?.split("@")[0] ?? "";

  return (
    <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col glass-1 border-r border-white/[0.06] relative">

      {/* Logo */}
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[9px] font-black font-mono text-primary-foreground leading-none shadow-[0_0_24px_rgba(200,241,53,0.3)]">
          AZ
        </div>
        <span className="text-sm font-mono font-black tracking-tight text-sidebar-foreground uppercase">
          AgentZero
        </span>
        {orgName && (
          <span className="ml-auto max-w-[56px] truncate text-[10px] text-sidebar-foreground/30">
            {orgName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3 pt-4">

        {/* OVERVIEW */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/35">
            Overview
          </p>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive("/dashboard")} />
        </div>

        {/* AGENTS */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 px-3 pb-1">
            <p className="flex-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/35">
              Agents
            </p>
            <Link
              href="/dashboard/agents/new"
              className="flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/60 transition-colors"
              title="New agent"
            >
              <Plus className="h-3 w-3" />
            </Link>
          </div>
          <NavItem
            href="/dashboard/agents"
            icon={Bot}
            label="All Agents"
            active={isActive("/dashboard/agents") && !currentAgentId}
            badge={agentCount}
          />

          {/* Agent list - show when on agents pages */}
          {agents && agents.length > 0 && isActive("/dashboard/agents") && (
            <div className="space-y-0.5 py-1 border-t border-sidebar-border/40 mt-1 pt-2">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs pl-6 transition-colors truncate",
                    currentAgentId === agent.id
                      ? "bg-primary/15 text-sidebar-foreground border-l-2 border-primary font-medium"
                      : "text-sidebar-foreground/45 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/80"
                  )}
                  title={agent.name}
                >
                  <span className="truncate">{agent.name}</span>
                </Link>
              ))}
            </div>
          )}

          <NavItem href="/dashboard/run"      icon={Play}         label="Run"       active={isActive("/dashboard/run")} />

          <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
            <p className="flex-1 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/35">
              Knowledge
            </p>
            <Link
              href="/dashboard/knowledge/new"
              className="flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/60 transition-colors"
              title="Add knowledge"
            >
              <Plus className="h-3 w-3" />
            </Link>
          </div>
          <NavItem href="/dashboard/knowledge" icon={BookOpen}    label="Knowledge" active={isActive("/dashboard/knowledge")} />
        </div>

        {/* ACCOUNT */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/35">
            Account
          </p>
          <NavItem href="/dashboard/billing"  icon={CreditCard}   label="Billing"   active={isActive("/dashboard/billing")} />
        </div>

      </nav>

      {/* Fuel Gauge */}
      {creditsRemaining !== undefined && (
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-sidebar-foreground/45 font-bold">
              Fuel
            </span>
            <span className="font-mono text-[10px] tabular-nums font-black text-primary">
              {creditsRemaining.toLocaleString()}
              <span className="font-normal text-primary/50 text-[8px] ml-0.5">cr</span>
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                creditsRemaining > 100
                  ? "bg-primary shadow-[0_0_10px_rgba(200,241,53,0.6)]"
                  : creditsRemaining > 20
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (creditsRemaining / 1000) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono font-black text-sidebar-foreground/85">
            {initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0">
            <span className="truncate text-xs font-medium text-sidebar-foreground/90 leading-snug">
              {displayName || "—"}
            </span>
          </div>
          <SignOutButton iconOnly />
        </div>
      </div>

    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm overflow-hidden",
        "transition-[background-color,color,border-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active
          ? "bg-primary/10 text-sidebar-foreground font-medium border-l-2 border-primary pl-[10px]"
          : "text-sidebar-foreground/55 hover:bg-white/[0.04] hover:text-sidebar-foreground/90 border-l-2 border-transparent pl-[10px]"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary/8 to-transparent"
        />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-150",
          active ? "text-primary" : "group-hover:text-sidebar-foreground/80",
        )}
      />
      <span className="relative flex-1">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "relative rounded px-1.5 py-px text-[10px] font-medium tabular-nums transition-colors",
          active
            ? "bg-primary/20 text-primary"
            : "bg-white/[0.06] text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}
