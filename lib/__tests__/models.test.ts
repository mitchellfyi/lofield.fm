import { describe, it, expect } from "vitest";
import {
  MODELS,
  DEFAULT_MODEL,
  isValidModel,
  getModelById,
  formatModelCost,
  type AIModel,
} from "../models";

describe("models", () => {
  describe("MODELS", () => {
    it("should contain at least one model", () => {
      expect(MODELS.length).toBeGreaterThan(0);
    });

    it("should have unique IDs", () => {
      const ids = MODELS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required fields for each model", () => {
      MODELS.forEach((model: AIModel) => {
        expect(model.id).toBeDefined();
        expect(typeof model.id).toBe("string");
        expect(model.id.length).toBeGreaterThan(0);

        expect(model.name).toBeDefined();
        expect(typeof model.name).toBe("string");
        expect(model.name.length).toBeGreaterThan(0);

        expect(model.description).toBeDefined();
        expect(typeof model.description).toBe("string");

        expect(model.costTier).toBeDefined();
        expect(["low", "medium", "high"]).toContain(model.costTier);
      });
    });

    it("should include gpt-4o-mini, gpt-4o, and gpt-4-turbo", () => {
      const ids = MODELS.map((m) => m.id);
      expect(ids).toContain("gpt-4o-mini");
      expect(ids).toContain("gpt-4o");
      expect(ids).toContain("gpt-4-turbo");
    });

    it("should have inputCostPer1kTokens for all models", () => {
      MODELS.forEach((model: AIModel) => {
        expect(model.inputCostPer1kTokens).toBeDefined();
        expect(typeof model.inputCostPer1kTokens).toBe("number");
        expect(model.inputCostPer1kTokens).toBeGreaterThan(0);
      });
    });

    it("should have outputCostPer1kTokens for all models", () => {
      MODELS.forEach((model: AIModel) => {
        expect(model.outputCostPer1kTokens).toBeDefined();
        expect(typeof model.outputCostPer1kTokens).toBe("number");
        expect(model.outputCostPer1kTokens).toBeGreaterThan(0);
      });
    });

    it("should have output cost greater than or equal to input cost", () => {
      // Output tokens are typically more expensive than input tokens
      MODELS.forEach((model: AIModel) => {
        expect(model.outputCostPer1kTokens).toBeGreaterThanOrEqual(model.inputCostPer1kTokens!);
      });
    });
  });

  describe("DEFAULT_MODEL", () => {
    it("should be gpt-4o-mini", () => {
      expect(DEFAULT_MODEL).toBe("gpt-4o-mini");
    });

    it("should be in the MODELS list", () => {
      expect(isValidModel(DEFAULT_MODEL)).toBe(true);
    });
  });

  describe("isValidModel", () => {
    it("should return true for valid model IDs", () => {
      expect(isValidModel("gpt-4o-mini")).toBe(true);
      expect(isValidModel("gpt-4o")).toBe(true);
      expect(isValidModel("gpt-4-turbo")).toBe(true);
    });

    it("should return false for invalid model IDs", () => {
      expect(isValidModel("invalid-model")).toBe(false);
      expect(isValidModel("")).toBe(false);
      expect(isValidModel("GPT-4o-mini")).toBe(false); // case-sensitive
      expect(isValidModel("gpt-3.5-turbo")).toBe(false);
    });

    it("should return false for non-string inputs", () => {
      // Type assertions for testing edge cases
      expect(isValidModel(undefined as unknown as string)).toBe(false);
      expect(isValidModel(null as unknown as string)).toBe(false);
      expect(isValidModel(123 as unknown as string)).toBe(false);
    });
  });

  describe("getModelById", () => {
    it("should return the correct model for valid IDs", () => {
      const mini = getModelById("gpt-4o-mini");
      expect(mini).toBeDefined();
      expect(mini?.id).toBe("gpt-4o-mini");
      expect(mini?.name).toBe("GPT-4o Mini");
      expect(mini?.costTier).toBe("low");

      const gpt4o = getModelById("gpt-4o");
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.id).toBe("gpt-4o");
      expect(gpt4o?.costTier).toBe("high");

      const turbo = getModelById("gpt-4-turbo");
      expect(turbo).toBeDefined();
      expect(turbo?.id).toBe("gpt-4-turbo");
      expect(turbo?.costTier).toBe("medium");
    });

    it("should return undefined for invalid IDs", () => {
      expect(getModelById("invalid-model")).toBeUndefined();
      expect(getModelById("")).toBeUndefined();
      expect(getModelById("GPT-4o-mini")).toBeUndefined(); // case-sensitive
    });

    it("should return undefined for non-string inputs", () => {
      expect(getModelById(undefined as unknown as string)).toBeUndefined();
      expect(getModelById(null as unknown as string)).toBeUndefined();
    });
  });

  describe("formatModelCost", () => {
    it("should return formatted string for model with cost data", () => {
      const mini = getModelById("gpt-4o-mini");
      expect(mini).toBeDefined();
      const formatted = formatModelCost(mini!);
      expect(formatted).not.toBeNull();
      expect(formatted).toContain("per 1K tokens");
      expect(formatted).toContain("/");
      expect(formatted).toContain("$");
    });

    it("should format gpt-4o-mini cost correctly", () => {
      const mini = getModelById("gpt-4o-mini");
      const formatted = formatModelCost(mini!);
      // Note: 0.00015.toFixed(4) rounds to "0.0001" due to floating point
      expect(formatted).toBe("$0.0001 / $0.0006 per 1K tokens");
    });

    it("should format gpt-4o cost correctly", () => {
      const gpt4o = getModelById("gpt-4o");
      const formatted = formatModelCost(gpt4o!);
      // $0.0025 / $0.01 per 1K tokens
      expect(formatted).toBe("$0.0025 / $0.01 per 1K tokens");
    });

    it("should format gpt-4-turbo cost correctly", () => {
      const turbo = getModelById("gpt-4-turbo");
      const formatted = formatModelCost(turbo!);
      // $0.01 / $0.03 per 1K tokens
      expect(formatted).toBe("$0.01 / $0.03 per 1K tokens");
    });

    it("should return null for model without cost data", () => {
      const modelWithoutCost: AIModel = {
        id: "test-model",
        name: "Test Model",
        description: "A test model",
        costTier: "low",
      };
      expect(formatModelCost(modelWithoutCost)).toBeNull();
    });

    it("should return null for model with only input cost", () => {
      const modelWithPartialCost: AIModel = {
        id: "test-model",
        name: "Test Model",
        description: "A test model",
        costTier: "low",
        inputCostPer1kTokens: 0.001,
      };
      expect(formatModelCost(modelWithPartialCost)).toBeNull();
    });

    it("should return null for model with only output cost", () => {
      const modelWithPartialCost: AIModel = {
        id: "test-model",
        name: "Test Model",
        description: "A test model",
        costTier: "low",
        outputCostPer1kTokens: 0.002,
      };
      expect(formatModelCost(modelWithPartialCost)).toBeNull();
    });

    it("should format all MODELS successfully", () => {
      MODELS.forEach((model) => {
        const formatted = formatModelCost(model);
        expect(formatted).not.toBeNull();
        expect(formatted).toMatch(/^\$[\d.]+ \/ \$[\d.]+ per 1K tokens$/);
      });
    });
  });
});
