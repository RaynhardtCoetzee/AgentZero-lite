/**
 * lib/ai/tool-logs.ts — Tool name → UI label mapping
 *
 * Single source of truth for human-readable tool log messages.
 * Keys must match the tool names registered in agent-actions.ts exactly.
 */

export const TOOL_LABELS: Record<string, string> = {
  webSearchTool:       "Searching the web...",
  knowledgeSearchTool: "Searching knowledge base...",
};

export const FALLBACK_TOOL_LABEL = "Working...";

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? FALLBACK_TOOL_LABEL;
}
