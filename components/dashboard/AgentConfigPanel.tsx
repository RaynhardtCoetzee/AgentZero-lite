"use client";

import { useState, useCallback } from "react";
import { Save, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateAgent } from "@/lib/actions/agent-crud-actions";

type AgentConfigPanelProps = {
  agentId:       string;
  initialName:   string;
  initialPrompt: string | null;
};

const TABS = ["Identity", "Prompt"] as const;
type Tab = (typeof TABS)[number];

export function AgentConfigPanel({ agentId, initialName, initialPrompt }: AgentConfigPanelProps) {
  const [name, setName]                 = useState(initialName);
  const [systemPrompt, setSystemPrompt] = useState(initialPrompt ?? "");
  const [tab, setTab]                   = useState<Tab>("Identity");
  const [saved, setSaved]               = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const result = await updateAgent(agentId, {
      name: name.trim(),
      instructions: systemPrompt,
    });
    setIsSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [agentId, name, systemPrompt]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Tab strip ────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 border-b border-border/30">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-4 sm:py-3 px-3 font-mono text-[10px] sm:text-[9px] uppercase tracking-wider transition-all duration-150 border-b-2 -mb-px font-semibold ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/40 hover:text-muted-foreground/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">

        {tab === "Identity" && (
          <div className="space-y-3.5">
            <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 font-medium">Agent name</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Research Agent"
              className="w-full rounded-sm border border-border/40 bg-background px-4 sm:px-3 py-3.5 sm:py-2.5 text-base sm:text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed pt-1">
              Used in chat headers and conversation history.
            </p>
          </div>
        )}

        {tab === "Prompt" && (
          <div className="space-y-3.5">
            <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/50 font-medium">System prompt</p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={14}
              placeholder="You are a helpful assistant…"
              className="w-full resize-none rounded-sm border border-border/40 bg-background px-4 sm:px-3 py-3.5 sm:py-2.5 text-base sm:text-sm text-foreground placeholder:text-foreground/30 font-mono leading-relaxed outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
              Define the agent's persona, constraints, and default behavior.
            </p>
          </div>
        )}

      </div>

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 p-4 sm:p-5 border-t border-border/30">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "w-full flex items-center justify-center gap-3 rounded-sm py-3.5 sm:py-2.5 text-base sm:text-sm font-bold transition-all duration-150",
            saved
              ? "bg-primary/15 text-primary/90 cursor-default"
              : isSaving
                ? "bg-primary/30 text-primary-foreground/60 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
          )}
        >
          {saved
            ? <><CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4" /> Saved</>
            : isSaving
              ? <><Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" /> Saving…</>
              : <><Save className="h-5 w-5 sm:h-4 sm:w-4" /> Save</>}
        </button>
      </div>
    </div>
  );
}
