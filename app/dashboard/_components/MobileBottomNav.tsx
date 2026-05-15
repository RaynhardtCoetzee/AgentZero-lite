"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, Play, BookOpen, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard",            icon: LayoutDashboard },
  { label: "Agents",    href: "/dashboard/agents",     icon: Bot             },
  { label: "Run",       href: "/dashboard/run",        icon: Play            },
  { label: "Knowledge", href: "/dashboard/knowledge",  icon: BookOpen        },
  { label: "Billing",   href: "/dashboard/billing",    icon: CreditCard      },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide nav on agent chat pages and the run console
  const path = pathname.split("?")[0].replace(/\/$/, "");
  const isInAgentChat = /^\/dashboard\/agents\/[^/]+$/.test(path);
  const isInRunConsole = path === "/dashboard/run";
  if (isInAgentChat || isInRunConsole) return null;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const activeIdx = NAV_ITEMS.findIndex(({ href }) => isActive(href));
  const itemPct = 100 / NAV_ITEMS.length;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-end glass-2 safe-pb",
        "border-t border-white/[0.06]",
        "[--liquid-ease:cubic-bezier(0.68,-0.32,0.27,1.32)]",
      )}
      role="navigation"
      aria-label="Primary"
    >
      {/* Hairline highlight on top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Liquid indicator — single sliding pill behind the active non-FAB item */}
      {activeIdx >= 0 && NAV_ITEMS[activeIdx].href !== "/dashboard/run" && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-full transition-[transform,width] duration-[420ms] ease-[var(--liquid-ease)]"
          style={{
            width: `${itemPct}%`,
            transform: `translate3d(${activeIdx * 100}%, 0, 0)`,
          }}
        >
          {/* Top capsule — accent bar that slides */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-primary shadow-[0_0_12px_rgba(200,241,53,0.65)]" />
          {/* Soft glow halo behind active */}
          <div className="absolute inset-x-2 top-0 h-full bg-gradient-to-t from-transparent via-primary/6 to-primary/10" />
        </div>
      )}

      {NAV_ITEMS.map(({ label, href, icon: Icon }, idx) => {
        const active = isActive(href);
        const isRun = href === "/dashboard/run";

        if (isRun) {
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="tap-target flex flex-1 flex-col items-center gap-1 pb-2.5 pt-1 relative justify-center press"
            >
              <div className="absolute -top-3 h-14 w-14 rounded-full bg-primary/15 blur-xl" aria-hidden />
              <div className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-md -mt-5",
                "transition-[background-color,border-color,box-shadow,transform] duration-[420ms] ease-[var(--liquid-ease)]",
                active
                  ? "bg-primary text-black border border-primary shadow-[0_8px_28px_-8px_rgba(200,241,53,0.55)] scale-105"
                  : "bg-primary/15 border border-primary/40 text-primary",
              )}>
                <Icon className="size-5" />
              </div>
              <span className={cn(
                "text-[10px] tracking-wide transition-colors duration-150 mt-0.5",
                active ? "font-bold text-primary" : "text-primary/70",
              )}>
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "tap-target flex flex-1 flex-col items-center gap-1 py-2.5 relative justify-center press",
              "transition-colors duration-150",
              active ? "text-primary" : "text-muted-foreground/55 hover:text-foreground",
            )}
            data-active={active}
          >
            <Icon
              className={cn(
                "size-[18px] transition-transform duration-[420ms] ease-[var(--liquid-ease)]",
                active && "scale-110",
              )}
            />
            <span className={cn(
              "text-[10px] tracking-wide transition-all duration-150",
              active ? "font-bold" : "font-medium",
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}