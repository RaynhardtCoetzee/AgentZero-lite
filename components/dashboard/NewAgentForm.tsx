"use client";

/**
 * components/dashboard/NewAgentForm.tsx — Minimal V1 agent creation form
 *
 * V1: name + instructions only. No template picker, no model selector,
 * no tool toggles. Web search runs by default; knowledge search runs
 * invisibly via the RAG pipeline.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAgent } from "@/lib/actions/agent-crud-actions";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 mb-3.5 font-medium">
      {children}
    </p>
  );
}

export function NewAgentForm() {
  const router = useRouter();
  const [agentName, setAgentName]       = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [isCreating, setIsCreating]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    const result = await createAgent(agentName || "New Agent", systemPrompt);
    if (result.success) {
      router.push(`/dashboard/agents/${result.id}`);
    } else {
      setError(result.error);
      setIsCreating(false);
    }
  }, [router, agentName, systemPrompt]);

  return (
    <div className="space-y-9 max-w-2xl">

      <section>
        <SectionLabel>Agent Name</SectionLabel>
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="My Agent"
          className="tap-target w-full rounded-md glass-2 px-4 sm:px-3 py-3.5 sm:py-2.5 text-base sm:text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(200,241,53,0.10)] transition-[border-color,box-shadow] duration-200"
        />
      </section>

      <section>
        <SectionLabel>System Prompt</SectionLabel>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          placeholder="You are a helpful AI assistant…"
          className="w-full rounded-md glass-2 px-4 sm:px-3 py-3.5 sm:py-2.5 text-base sm:text-sm text-foreground placeholder:text-foreground/30 font-mono leading-relaxed resize-none outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(200,241,53,0.10)] transition-[border-color,box-shadow] duration-200"
        />
      </section>

      {error && (
        <p className="font-mono text-xs text-destructive">{error}</p>
      )}

      <div className="flex flex-col gap-3 pt-4">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className={cn(
            "tap-target flex items-center justify-center gap-3 rounded-sm px-4 py-4 sm:py-2.5 w-full text-base sm:text-sm font-bold press",
            "transition-[background-color,box-shadow] duration-150",
            isCreating
              ? "bg-primary/30 text-primary-foreground/60 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_24px_-8px_rgba(200,241,53,0.55)] hover:shadow-[0_0_32px_-6px_rgba(200,241,53,0.7)]",
          )}
        >
          {isCreating
            ? <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
            : <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />}
          {isCreating ? "Creating…" : "Create Agent"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          disabled={isCreating}
          className="font-mono text-sm sm:text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-colors duration-200 disabled:opacity-40 py-2"
        >
          Cancel
        </button>
      </div>

    </div>
  );
}
