"use client";

/**
 * components/dashboard/NewAgentForm.tsx
 *
 * Template picker, name input, model selector, tool toggles.
 * Calls createAgent() Server Action on submit, then navigates to the detail page.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Globe,
  Mail,
  FlaskConical,
  Layers,
  Database,
  Code2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgent } from "@/lib/actions/agent-crud-actions";

// ─── Templates ────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
};

const TEMPLATES: Template[] = [
  {
    id: "support",
    label: "Support Triage",
    description: "Classify and route incoming support tickets automatically.",
    icon: Layers,
  },
  {
    id: "research",
    label: "Research Summarizer",
    description: "Search the web and synthesise key findings into a summary.",
    icon: Globe,
  },
  {
    id: "email",
    label: "Email Composer",
    description: "Draft contextual emails using your database and documents.",
    icon: Mail,
  },
  {
    id: "blank",
    label: "Blank Agent",
    description: "Start with a clean slate and configure everything yourself.",
    icon: Bot,
  },
];

// ─── Models ───────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "gpt-4o",          label: "GPT-4o",       provider: "openai" },
  { id: "claude-3-7",      label: "Claude 3.7",   provider: "anthropic" },
  { id: "deepseek-chat",   label: "DeepSeek",     provider: "deepseek" },
] as const;

// ─── Tools ────────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: "web_search",  label: "Web Search",   icon: Globe },
  { id: "email",       label: "Email",         icon: Mail },
  { id: "database",    label: "Database",      icon: Database },
  { id: "code_exec",   label: "Code Exec",     icon: Code2 },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

// ─── Component ────────────────────────────────────────────────────────────────

export function NewAgentForm() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");
  const [agentName, setAgentName]               = useState("");
  const [selectedModel, setSelectedModel]       = useState<string>("gpt-4o");
  const [enabledTools, setEnabledTools]         = useState<Set<ToolId>>(
    new Set(["web_search", "email", "database", "code_exec"])
  );
  const [isCreating, setIsCreating]             = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const toggleTool = useCallback((toolId: ToolId) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    const result = await createAgent();
    if (result.success) {
      router.push(`/dashboard/agents/${result.id}`);
    } else {
      setError(result.error);
      setIsCreating(false);
    }
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Template picker */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Template
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelectedTemplate(id);
                if (!agentName) setAgentName(label);
              }}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-md border p-3 text-left transition-colors",
                selectedTemplate === id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/30"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  selectedTemplate === id ? "text-primary" : "text-muted-foreground"
                )} />
                {selectedTemplate === id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  selectedTemplate === id ? "text-foreground" : "text-foreground/70"
                )}>
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Agent name */}
      <div className="space-y-1.5">
        <Label htmlFor="agent-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Agent Name
        </Label>
        <Input
          id="agent-name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="My Agent"
          className="h-9 bg-card text-sm"
        />
      </div>

      {/* Model selector */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Model
        </legend>
        <div className="flex gap-2">
          {MODELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedModel(id)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                selectedModel === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Tool toggles */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tools
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map(({ id, label, icon: Icon }) => {
            const enabled = enabledTools.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTool(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                  enabled
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border/80"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", enabled ? "text-primary" : "text-muted-foreground")} />
                <span className="font-medium">{label}</span>
                <span className={cn(
                  "ml-auto h-1.5 w-1.5 rounded-full shrink-0",
                  enabled ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          Tool availability depends on your environment configuration.
        </p>
      </fieldset>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="gap-1.5"
        >
          {isCreating
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ChevronRight className="h-3.5 w-3.5" />}
          {isCreating ? "Creating…" : "Create Agent"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          disabled={isCreating}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
