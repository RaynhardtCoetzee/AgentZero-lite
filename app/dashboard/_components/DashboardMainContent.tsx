"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardMainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const path = pathname.split("?")[0].replace(/\/$/, "");
  const isInAgentChat = /^\/dashboard\/agents\/[^/]+$/.test(path);
  const isInRunConsole = path === "/dashboard/run";
  const isDashboardHome = path === "/dashboard";
  const isFullBleed = isInAgentChat || isInRunConsole;
  const isDocsCockpit = path.startsWith('/dashboard/docs');

  // Dashboard home: viewport-locked. Page manages internal scroll regions.
  if (isDashboardHome) {
    return (
      <main className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden relative px-3 pt-3 sm:px-4 sm:pt-4 md:p-6 clear-mobile-nav">
        <div className="md:h-full md:min-h-0 md:flex md:flex-col">{children}</div>
      </main>
    );
  }

  // Docs cockpit: viewport-locked canvas — no padding, no scroll, no wrapper div.
  // The wrapper div (min-h-full) would break h-full on children since min-height
  // does not establish a resolved height for percentage-based child heights.
  if (isDocsCockpit) {
    // Use position:relative so absolutely-positioned cockpit children
    // can fill this element regardless of any intermediate DOM wrappers
    // (e.g. React ViewTransition). Avoids Firefox h-full resolution issues.
    return (
      <main className="flex-1 min-h-0 overflow-hidden p-0 relative">
        {children}
      </main>
    );
  }

  return (
    <main className={cn(
      "flex-1 overflow-auto relative",
      isFullBleed
        ? "p-0"
        : "p-3 sm:p-4 md:p-6 clear-mobile-nav"
    )}>
      <div className="min-h-full">
        {children}
      </div>
    </main>
  );
}
