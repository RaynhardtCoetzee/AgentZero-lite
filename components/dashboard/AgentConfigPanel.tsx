"use client";

/**
 * components/dashboard/AgentConfigPanel.tsx
 *
 * Left panel of the Agent Detail split layout.
 * Displays editable fields for name, system prompt, model, and tool toggles.
 * Persists config locally until backend updateAgent() is wired — fields are
 * fully interactive but saves are client-state only for now.
 */

import { useState, useCallback } from "react";
import { Globe, Mail, Database, Code2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── Tools ────────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: "web_search", label: "Web Search", icon: Globe },
  { id: "email",      label: "Email",      icon: Mail },
  { id: "database",   label: "Database",   icon: Database },
  { id: "code_exec",  label: "Code Exec",  icon: Code2 },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "gpt-4o",        label: "GPT-4o" },
  { id: "claude-3-7",    label: "Claude 3.7" },
  { id: "deepseek-chat", label: "DeepSeek" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

type AgentConfigPanelProps = {
  agentId:   string;
  agentName: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AgentConfigPanel({ agentName }: AgentConfigPanelProps) {
  const [name, setName]               = useState(agentName);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant. Answer questions clearly and concisely."
  );
  const [model, setModel]             = useState("gpt-4o");
  const [enabledTools, setEnabledTools] = useState<Set<ToolId>>(
    new Set(["web_search", "email", "database", "code_exec"])
  );
  const [saved, setSaved]             = useState(false);

  const toggleTool = useCallback((toolId: ToolId) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    // Config saved to component state — updateAgent() will be wired when available
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">

      {/* Section label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Config
        </span>
      </div>

      {/* Agent name */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-name" className="text-xs text-muted-foreground">
          Name
        </Label>
        <Input
          id="agent-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 bg-background text-sm"
        />
      </div>

      {/* System prompt */}
      <div className="space-y-1.5">
        <Label htmlFor="system-prompt" className="text-xs text-muted-foreground">
          System Prompt
        </Label>
        <Textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={5}
          className="resize-none bg-background text-sm leading-relaxed"
        />
      </div>

      {/* Model selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Model</Label>
        <div className="flex flex-col gap-1">
          {MODELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setModel(id)}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                model === id
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-border/70 hover:text-foreground"
              )}
            >
              <span className="font-medium">{label}</span>
              {model === id && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tool toggles */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tools</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {TOOLS.map(({ id, label, icon: Icon }) => {
            const enabled = enabledTools.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTool(id)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  enabled
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-border/70"
                )}
              >
                <Icon className={cn(
                  "h-3 w-3 shrink-0",
                  enabled ? "text-primary" : "text-muted-foreground/50"
                )} />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="mt-auto pt-2">
        <Button
          size="sm"
          onClick={handleSave}
          className={cn("w-full gap-1.5 text-xs", saved && "bg-emerald-600 hover:bg-emerald-600")}
        >
          {saved
            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
            : <><Save className="h-3.5 w-3.5" /> Save Config</>
          }
        </Button>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
          Persistent config requires backend updateAgent()
        </p>
      </div>
    </div>
  );
}
