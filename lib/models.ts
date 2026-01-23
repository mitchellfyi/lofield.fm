/**
 * AI Model configuration for the chat API
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  costTier: "low" | "medium" | "high";
}

export const MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and affordable, great for most tasks",
    costTier: "low",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable, best for complex music generation",
    costTier: "high",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Powerful with large context window",
    costTier: "medium",
  },
];

export const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Check if a model ID is valid (in the allowed list)
 */
export function isValidModel(modelId: string): boolean {
  return MODELS.some((model) => model.id === modelId);
}

/**
 * Get a model by its ID
 */
export function getModelById(modelId: string): AIModel | undefined {
  return MODELS.find((model) => model.id === modelId);
}
