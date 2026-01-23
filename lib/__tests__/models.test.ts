import { describe, it, expect } from "vitest";
import {
  MODELS,
  DEFAULT_MODEL,
  isValidModel,
  getModelById,
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
});
