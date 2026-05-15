/**
 * lib/ai/model-registry.ts — Model metadata registry
 *
 * V1 ships with a single model (DeepSeek). Additional models will be added
 * post-launch based on user feedback.
 */

export type ModelMetadata = {
  id: string;
  label: string;
  provider: "deepseek";
};

export const MODEL_REGISTRY: ModelMetadata[] = [
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat",
    provider: "deepseek",
  },
];

export function getModelById(id: string): ModelMetadata | undefined {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

export function getAllModels(): ModelMetadata[] {
  return MODEL_REGISTRY;
}

export function getDefaultModelId(): string {
  return MODEL_REGISTRY[0].id;
}
