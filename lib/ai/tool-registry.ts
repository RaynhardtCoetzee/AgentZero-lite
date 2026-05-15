/**
 * lib/ai/tool-registry.ts — User-visible tool metadata registry
 *
 * Single source of truth for tools surfaced in the UI.
 * `knowledgeSearchTool` is deliberately omitted — it runs as invisible RAG
 * plumbing and is wired directly into the agent runtime.
 */

import { Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolMetadata = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const TOOL_REGISTRY: ToolMetadata[] = [
  {
    id: "web_search",
    label: "Web Search",
    description: "Search the web using Tavily and return relevant results.",
    icon: Globe,
  },
];

export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === id);
}

export function getAllTools(): ToolMetadata[] {
  return TOOL_REGISTRY;
}
