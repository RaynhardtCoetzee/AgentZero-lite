/**
 * lib/ai/tool-logs.ts — Tool name → UI label mapping
 *
 * Single source of truth for human-readable tool log messages.
 * Imported by AgentChat (display) and can be imported by any future
 * component that needs to render tool activity (notifications, history, etc).
 *
 * Keys must match the tool names registered in agent-actions.ts exactly.
 */

export const TOOL_LABELS: Record<string, string> = {
  webSearchTool:     "Searching Google...",
  emailAutomateTool: "Writing email...",
  dbReadTool:        "Reading database...",
  dbWriteTool:       "Reading database...",
};

export const FALLBACK_TOOL_LABEL = "Working...";

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? FALLBACK_TOOL_LABEL;
}
