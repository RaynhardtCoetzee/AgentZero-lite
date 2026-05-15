"use client";

import { useState, useEffect } from "react";
import { AgentKanban } from "./AgentKanban";
import { AgentDetailClient } from "../[agentId]/_components/AgentDetailClient";
import { NewAgentButton } from "@/app/dashboard/_components/NewAgentButton";
import { Bot } from "lucide-react";
import type { Agent } from "@/lib/actions/agent-crud-actions";

type Props = {
  agents: Agent[];
  defaultModelId: string;
};

export function AgentsPageContent({ agents, defaultModelId }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!selectedAgent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedAgent(null);
    };
    document.addEventListener("keydown", handler);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedAgent]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3">
        <h1 className="font-mono font-black uppercase tracking-tight text-lg sm:text-2xl text-foreground">
          Agents
        </h1>
        <NewAgentButton />
      </div>

      {agents.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-4 sm:px-6 py-16 sm:py-20 text-center">
          <Bot
            className="mx-auto mb-4 h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground/20"
            strokeWidth={1.25}
          />
          <p className="text-base sm:text-lg text-muted-foreground/60 font-medium">No agents yet.</p>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground/40">
            Click &quot;New Agent&quot; to create your first agent.
          </p>
        </div>
      ) : (
        <AgentKanban agents={agents} onSelectAgent={setSelectedAgent} />
      )}

      {selectedAgent && (
        <>
          {/* Backdrop — sits above MobileBottomNav (z-50) so the nav is fully covered */}
          <div
            className="fixed inset-0 z-[55] bg-background/70 opacity-100 starting:opacity-0 transition-opacity duration-200"
            onClick={() => setSelectedAgent(null)}
          />

          {/* Workspace panel — slides in from right, above nav so its input bar isn't covered */}
          <div className="fixed right-0 top-0 z-[60] h-dvh w-full md:w-3/4 xl:w-3/5 flex flex-col border-l border-border bg-background translate-x-0 starting:translate-x-full transition-transform duration-300 ease-out">
            <AgentDetailClient
              agentId={selectedAgent.id}
              agentName={selectedAgent.name}
              initialPrompt={selectedAgent.instructions}
              defaultModelId={defaultModelId}
            />
          </div>
        </>
      )}
    </div>
  );
}
