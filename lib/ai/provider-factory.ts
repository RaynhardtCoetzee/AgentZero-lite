/**
 * lib/ai/provider-factory.ts — Unified model interface
 *
 * Reads AI_PROVIDER at call time so the env var can be changed between
 * requests in test environments without restarting the server.
 *
 * Supported values: "openai" | "anthropic" | "deepseek"
 * Default: "openai"
 */

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

export function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? "openai";

  switch (provider) {
    case "openai":
      return openai("gpt-4o");
    case "anthropic":
      return anthropic("claude-3-7-sonnet-20250219");
    case "deepseek":
      return deepseek("deepseek-chat");
    case "groq":
      return createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile");
    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${provider}". Valid values: "openai" | "anthropic" | "deepseek" | "groq"`
      );
  }
}
