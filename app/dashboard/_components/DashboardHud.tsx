import { cn } from "@/lib/utils";
import { NewAgentButton } from "./NewAgentButton";
import { Badge } from "@/components/ui/badge";
import { Zap as ZapIcon, Briefcase, Activity, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Vital = {
  label: string;
  value: string;
  Icon: LucideIcon;
  badge?: string;
  valueItalic?: boolean;
  danger?: boolean;
};

type Props = {
  orgName: string;
  vitals: Vital[];
};

export function DashboardHud({ orgName, vitals }: Props) {
  return (
    <div className="shrink-0 anim-fade-up space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-sans font-bold text-2xl text-foreground leading-none tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {orgName} Workspace
          </p>
        </div>

        <Badge className="hidden sm:inline-flex items-center gap-2 bg-transparent border border-primary/50 text-primary hover:bg-transparent font-mono text-[10px] uppercase tracking-widest shrink-0 px-3 py-1.5 h-auto rounded-full">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          System Live
        </Badge>

        <NewAgentButton />
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.05] rounded-sm overflow-hidden glass-fleet">
        {vitals.map((v) => <VitalCell key={v.label} {...v} />)}
      </div>
    </div>
  );
}

function VitalCell({ label, value, Icon, badge, valueItalic, danger }: Vital) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      {/* Icon box */}
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-sm border",
        danger
          ? "bg-destructive/10 border-destructive/25 text-destructive"
          : "bg-white/[0.03] border-white/[0.07] text-muted-foreground",
      )}>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 leading-none">
          {label}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-mono font-black tabular-nums leading-none",
            danger ? "text-destructive" : "text-foreground",
            valueItalic
              ? "italic text-sm text-muted-foreground font-normal"
              : "text-2xl",
          )}>
            {value}
          </span>
          {badge && (
            <Badge
              variant="outline"
              className="font-mono text-[8px] uppercase tracking-wider border-border text-muted-foreground px-1.5 py-0.5 h-auto rounded-sm"
            >
              {badge}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function buildVitals(args: { credits: number; agentCount: number }): Vital[] {
  const { credits, agentCount } = args;
  const danger = credits < 50 && credits >= 0;

  return [
    {
      label: "Credits Available",
      value: credits.toLocaleString(),
      Icon: ZapIcon,
      danger,
    },
    {
      label: "Active Agents",
      value: String(agentCount),
      Icon: Briefcase,
    },
    {
      label: "Monthly Runs",
      value: "0",
      Icon: Activity,
      badge: "Cold Start",
    },
    {
      label: "Success Rate",
      value: "Calculating...",
      Icon: Gauge,
      valueItalic: true,
    },
  ];
}