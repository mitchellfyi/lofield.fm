/**
 * AI Model configuration for the chat API
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  costTier: "low" | "medium" | "high";
  /** Cost per 1K input tokens in USD */
  inputCostPer1kTokens?: number;
  /** Cost per 1K output tokens in USD */
  outputCostPer1kTokens?: number;
}

export const MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and affordable, great for most tasks",
    costTier: "low",
    inputCostPer1kTokens: 0.00015, // $0.15 per 1M tokens
    outputCostPer1kTokens: 0.0006, // $0.60 per 1M tokens
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable, best for complex music generation",
    costTier: "high",
    inputCostPer1kTokens: 0.0025, // $2.50 per 1M tokens
    outputCostPer1kTokens: 0.01, // $10.00 per 1M tokens
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Powerful with large context window",
    costTier: "medium",
    inputCostPer1kTokens: 0.01, // $10.00 per 1M tokens
    outputCostPer1kTokens: 0.03, // $30.00 per 1M tokens
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

/**
 * Format model cost for display
 * Returns a string like "$0.00015 / $0.0006 per 1K tokens" (input/output)
 * Returns null if model has no cost data
 */
export function formatModelCost(model: AIModel): string | null {
  if (model.inputCostPer1kTokens === undefined || model.outputCostPer1kTokens === undefined) {
    return null;
  }

  const formatCost = (cost: number): string => {
    if (cost >= 0.01) {
      return `$${cost.toFixed(2)}`;
    }
    // For very small costs, show more precision
    return `$${cost.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
  };

  const inputCost = formatCost(model.inputCostPer1kTokens);
  const outputCost = formatCost(model.outputCostPer1kTokens);

  return `${inputCost} / ${outputCost} per 1K tokens`;
}
