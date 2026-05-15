/**
 * lib/ai/provider-factory.ts — Unified model interface
 *
 * V1 ships DeepSeek only. Multi-provider support will return post-launch
 * once user demand is validated.
 */

import { deepseek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";

export function getModel(modelId?: string): LanguageModel {
  return deepseek(modelId ?? "deepseek-chat");
}
