"use client";

import { useState } from "react";
import { Terminal, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusTicker } from "./StatusTicker";

type Line = { tag: string; msg: string; ok?: boolean };
type Props = { lines: Line[] };

export function TerminalDrawer({ lines }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Collapsed status bar */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 px-4 sm:px-5 py-2 rounded-sm glass-fleet",
            "hover:border-primary/20 transition-[border-color] duration-200 group",
          )}
          aria-label="Open system manifest"
        >
          <Terminal className="h-3 w-3 text-primary/50 shrink-0 group-hover:text-primary transition-colors" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/65 font-bold">
            System Manifest
          </span>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex gap-1.5 border-primary/35 text-primary bg-primary/10 font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 h-auto rounded-sm shrink-0"
          >
            <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
            Stable
          </Badge>

          <div className="flex-1 min-w-0 overflow-hidden">
            <StatusTicker messages={lines.map(({ tag, msg }) => `[${tag}] ${msg}`)} />
          </div>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex gap-1 border-border text-muted-foreground font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 h-auto rounded-sm shrink-0 group-hover:text-foreground group-hover:border-border/60 transition-colors"
          >
            <ChevronUp className="h-2.5 w-2.5" />
            Expand Logs
          </Badge>
        </button>
      </div>

      {/* Expanded modal */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[55] bg-background/70 opacity-100 starting:opacity-0 transition-opacity duration-200"
          />
          <div
            className={cn(
              "fixed left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-6 md:w-[520px] bottom-3 sm:bottom-6 mb-mobile-nav",
              "z-[60] rounded-sm overflow-hidden glass-fleet",
              "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]",
              "translate-y-0 starting:translate-y-4 opacity-100 starting:opacity-0",
              "transition-[transform,opacity] duration-300 ease-out",
            )}
          >
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
              <Terminal className="h-3 w-3 text-primary/55 shrink-0" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/85 font-bold">
                System Manifest
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/35 text-primary bg-primary/10 font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 h-auto rounded-sm"
                >
                  <span className="h-1 w-1 rounded-full bg-primary animate-pulse shrink-0" />
                  Live
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label="Close manifest"
                  className="rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="px-4 py-3 space-y-0">
              {lines.map(({ tag, msg, ok }, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-baseline gap-3 py-1.5 border-b border-border/40 last:border-0",
                    "opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-1",
                    "transition-[opacity,transform] duration-300",
                    ok && "border-primary/15",
                  )}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <span className={cn(
                    "font-mono text-[8px] uppercase tracking-widest font-bold shrink-0 w-9 text-right",
                    ok ? "text-primary/75" : "text-muted-foreground/40",
                  )}>
                    {tag}
                  </span>
                  <div className="w-px h-3 bg-border shrink-0 self-center" />
                  <span className={cn(
                    "font-mono text-[10px] leading-relaxed",
                    ok ? "text-primary/85" : "text-muted-foreground/65",
                  )}>
                    {msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}