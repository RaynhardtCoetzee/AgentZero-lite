"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Play,
  BookOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";

type SidebarProps = {
  orgName?: string;
  userEmail?: string;
  creditsRemaining?: number;
  agentCount?: number;
};

export function Sidebar({ orgName, userEmail, creditsRemaining, agentCount }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initial = userEmail?.charAt(0).toUpperCase() ?? "?";
  const displayName = userEmail?.split("@")[0] ?? "";

  return (
    <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">

      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#c8f135] text-[9px] font-black font-mono text-black leading-none">
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
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/25">
            Overview
          </p>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive("/dashboard")} />
        </div>

        {/* AGENTS */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/25">
            Agents
          </p>
          <NavItem
            href="/dashboard/agents"
            icon={Bot}
            label="Agents"
            active={isActive("/dashboard/agents")}
            badge={agentCount}
          />
          <NavItem href="/dashboard/run"      icon={Play}         label="Run"       active={isActive("/dashboard/run")} />
          <NavItem href="/dashboard/knowledge" icon={BookOpen}    label="Knowledge" active={isActive("/dashboard/knowledge")} />
        </div>

        {/* ACCOUNT */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/25">
            Account
          </p>
          <NavItem href="/dashboard/settings" icon={Settings}     label="Settings"  active={isActive("/dashboard/settings")} />
        </div>

      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground">
            {initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0">
            <span className="truncate text-xs font-medium text-sidebar-foreground leading-snug">
              {displayName || "—"}
            </span>
            {creditsRemaining !== undefined && (
              <span className="text-[10px] tabular-nums text-sidebar-foreground/35 leading-snug">
                {creditsRemaining.toLocaleString()} cr
              </span>
            )}
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
        "flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
          : "text-sidebar-foreground/45 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/80"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="rounded px-1.5 py-px text-[10px] font-medium tabular-nums bg-sidebar-foreground/8 text-sidebar-foreground/40">
          {badge}
        </span>
      )}
    </Link>
  );
}
