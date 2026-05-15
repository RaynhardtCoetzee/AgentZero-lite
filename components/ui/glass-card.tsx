import * as React from "react";
import { cn } from "@/lib/utils";

type Tier = "1" | "2" | "3";

interface GlassCardProps extends React.ComponentProps<"div"> {
  tier?: Tier;
  interactive?: boolean;
  sheen?: boolean;
}

function GlassCard({
  className,
  tier = "2",
  interactive = false,
  sheen = true,
  ...props
}: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      data-tier={tier}
      className={cn(
        "rounded-lg",
        tier === "1" && "glass-1",
        tier === "2" && "glass-2",
        tier === "3" && "glass-3",
        sheen && "glass-sheen",
        interactive && "glass-hover press cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

function GlassCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-header"
      className={cn(
        "flex items-start justify-between gap-3 px-4 pt-3.5 pb-2",
        className,
      )}
      {...props}
    />
  );
}

function GlassCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-title"
      className={cn(
        "font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground/70",
        className,
      )}
      {...props}
    />
  );
}

function GlassCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-content"
      className={cn("px-4 pb-4", className)}
      {...props}
    />
  );
}

function GlassCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-card-footer"
      className={cn(
        "flex items-center gap-2 border-t border-white/5 px-4 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardFooter,
};
