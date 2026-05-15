import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type VitalProps = {
  label: string;
  value: string;
  Icon: LucideIcon;
  accent?: boolean;
  trend?: { pct: number; tier: "healthy" | "low" | "critical" };
};

function Vital({ label, value, Icon, accent, trend }: VitalProps) {
  const tierColor =
    trend?.tier === "healthy" ? "bg-primary" :
    trend?.tier === "low" ? "bg-amber-400" :
    trend?.tier === "critical" ? "bg-destructive" : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:py-2.5 sm:px-5 min-w-0 flex-1 first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5 relative">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border",
        accent
          ? "bg-primary/12 border-primary/25 text-primary"
          : "bg-white/[0.04] border-white/[0.06] text-muted-foreground/70",
      )}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground/55 leading-none mb-1.5 font-bold truncate">
          {label}
        </span>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={cn(
            "font-mono font-black tabular-nums leading-none truncate",
            accent ? "text-primary text-xl sm:text-2xl" : "text-foreground text-xl sm:text-2xl",
          )}>
            {value}
          </span>
        </div>
        {trend && tierColor && (
          <div className="mt-2 h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700 ease-out",
                tierColor,
                trend.tier === "healthy" && "shadow-[0_0_8px_rgba(200,241,53,0.55)]",
              )}
              style={{ width: `${Math.min(100, Math.max(2, trend.pct))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type VitalsStripProps = {
  vitals: VitalProps[];
};

export function VitalsStrip({ vitals }: VitalsStripProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-4 rounded-md glass-2 overflow-hidden anim-fade-up",
      "divide-y divide-x divide-white/[0.05] sm:divide-y-0",
    )}>
      {vitals.map((v, i) => (
        <Vital key={v.label + i} {...v} />
      ))}
    </div>
  );
}