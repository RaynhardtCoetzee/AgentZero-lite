"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Zap, ChevronRight } from "lucide-react";
import type { Agent } from "@/lib/actions/agent-crud-actions";

export function QuickLaunchForm({ agents }: { agents: Agent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    agents.length === 1 ? agents[0].id : null
  );
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedId) textareaRef.current?.focus();
  }, [selectedId]);

  function handleLaunch() {
    if (!selectedId) return;
    const params = new URLSearchParams({ view: "chat" });
    if (message.trim()) params.set("prompt", message.trim());
    router.push(`/dashboard/agents/${selectedId}?${params.toString()}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleLaunch();
    }
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
        <Zap className="h-10 w-10 text-muted-foreground/20" strokeWidth={1.25} />
        <div className="space-y-2">
          <p className="font-mono font-black uppercase tracking-wider text-foreground/50">No agents deployed</p>
          <p className="font-mono text-[10px] text-muted-foreground/35 uppercase tracking-wide">
            Build an agent before launching.
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary/90 active:scale-95 transition-all duration-200"
        >
          <Zap className="h-3.5 w-3.5" />
          New Agent
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-2xl">

      <div
        className="opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-3 transition-[opacity,transform] duration-300"
        style={{ transitionDelay: '0ms' }}
      >
        <h1 className="font-mono font-black uppercase tracking-wider text-3xl sm:text-4xl text-foreground">
          Quick Launch
        </h1>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground/45 uppercase tracking-wide">
          Pick an agent, type your task, go.
        </p>
      </div>

      {/* Step 1 — Agent */}
      <div
        className="space-y-3 opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-3 transition-[opacity,transform] duration-300"
        style={{ transitionDelay: '80ms' }}
      >
        <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/35 font-medium">
          01 — Select Agent
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {agents.map(agent => {
            const active = selectedId === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={cn(
                  "relative flex items-center gap-3 rounded-[2px] border px-4 py-3.5 text-left transition-all duration-200 overflow-hidden",
                  active
                    ? "border-primary/40 bg-primary/[8%] text-foreground"
                    : "border-border/30 bg-card/70 text-foreground/55 hover:border-border/50 hover:text-foreground/75"
                )}
              >
                {/* Architectural top line — sole active indicator */}
                <div className={cn(
                  "absolute top-0 left-0 h-[2px] w-full transition-all duration-200",
                  active ? "bg-primary" : "bg-transparent"
                )} />
                <span className="font-mono text-sm font-medium truncate flex-1">{agent.name}</span>
                {active && (
                  <ChevronRight className="h-3.5 w-3.5 text-primary/50 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Task */}
      <div
        className="space-y-3 opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-3 transition-[opacity,transform] duration-300"
        style={{ transitionDelay: '160ms' }}
      >
        <p className={cn(
          "font-mono text-[8px] uppercase tracking-widest font-medium transition-colors duration-200",
          selectedId ? "text-muted-foreground/35" : "text-muted-foreground/18"
        )}>
          02 — Task <span className="text-muted-foreground/25 normal-case tracking-normal font-normal">(optional)</span>
        </p>
        <div className={cn(
          "rounded-[2px] border bg-card/70 transition-all duration-200",
          selectedId
            ? "border-border/40 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/15"
            : "border-border/20 opacity-30 pointer-events-none"
        )}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={!selectedId}
            placeholder="What do you need done?"
            rows={3}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-foreground placeholder:text-foreground/25 outline-none font-light leading-relaxed"
          />
          <div className="px-4 pb-2.5">
            <span className="font-mono text-[9px] text-muted-foreground/20 select-none">
              ⏎ launch  ·  ⇧⏎ newline
            </span>
          </div>
        </div>
      </div>

      {/* Launch */}
      <button
        type="button"
        onClick={handleLaunch}
        disabled={!selectedId}
        style={{ transitionDelay: selectedId ? '0ms' : '240ms' }}
        className={cn(
          "flex items-center gap-2.5 px-5 py-2.5 rounded-[2px] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 opacity-100 translate-y-0 starting:opacity-0 starting:translate-y-2",
          selectedId
            ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            : "bg-muted/20 text-muted-foreground/25 cursor-not-allowed"
        )}
      >
        <Zap className="h-4 w-4" />
        Launch
      </button>

    </div>
  );
}
