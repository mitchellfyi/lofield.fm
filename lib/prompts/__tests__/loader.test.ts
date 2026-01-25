import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIModel } from "@/lib/models";

// We use the real fs module and test against actual prompt files
// This is an integration test approach that verifies the loader works correctly
describe("prompts/loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("loadPrompt", () => {
    it("should load system-prompt.md file", async () => {
      const { loadPrompt } = await import("../loader");

      const result = loadPrompt("system-prompt.md");

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // System prompt should contain Tone.js related content
      expect(result).toContain("Tone.js");
    });

    it("should load retry-prompt.md file", async () => {
      const { loadPrompt } = await import("../loader");

      const result = loadPrompt("retry-prompt.md");

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Retry prompt should contain the placeholder
      expect(result).toContain("{{ERRORS}}");
    });

    it("should trim whitespace from loaded prompts", async () => {
      const { loadPrompt } = await import("../loader");

      const result = loadPrompt("system-prompt.md");

      // Should not start or end with whitespace
      expect(result).toBe(result.trim());
    });

    it("should throw error for non-existent file", async () => {
      const { loadPrompt } = await import("../loader");

      expect(() => loadPrompt("nonexistent-file.md")).toThrow();
    });
  });

  describe("loadSystemPrompt", () => {
    it("should load default system prompt when no variation specified", async () => {
      const { loadSystemPrompt } = await import("../loader");

      const result = loadSystemPrompt();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("Tone.js");
    });

    it("should load default system prompt with undefined variation", async () => {
      const { loadSystemPrompt } = await import("../loader");

      const result = loadSystemPrompt(undefined);

      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
    });

    it("should load default system prompt with empty string variation", async () => {
      const { loadSystemPrompt } = await import("../loader");

      const result = loadSystemPrompt("");

      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
    });

    it("should fall back to default when variation file does not exist", async () => {
      const { loadSystemPrompt } = await import("../loader");

      const result = loadSystemPrompt("nonexistent-variation");

      // Should fall back to default prompt
      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
    });

    it("should return same content as loadPrompt for system-prompt.md", async () => {
      const { loadSystemPrompt, loadPrompt } = await import("../loader");

      const systemPrompt = loadSystemPrompt();
      const directLoad = loadPrompt("system-prompt.md");

      expect(systemPrompt).toBe(directLoad);
    });
  });

  describe("loadSystemPromptForModel", () => {
    it("should load default prompt for model without variation", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and affordable",
        costTier: "low",
        // No systemPromptVariation
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("gpt-4o-mini");

      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
      expect(mockGetModelById).toHaveBeenCalledWith("gpt-4o-mini");
    });

    it("should fall back to default for model with nonexistent variation", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "test-model",
        name: "Test Model",
        description: "Test",
        costTier: "low",
        systemPromptVariation: "nonexistent-variation",
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("test-model");

      // Should fall back to default
      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
    });

    it("should handle unknown model ID gracefully", async () => {
      const mockGetModelById = vi.fn().mockReturnValue(undefined);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("unknown-model");

      // Should return default prompt
      expect(result).toBeDefined();
      expect(result).toContain("Tone.js");
    });
  });

  describe("loadRetryPromptTemplate", () => {
    it("should load the retry prompt template", async () => {
      const { loadRetryPromptTemplate } = await import("../loader");

      const result = loadRetryPromptTemplate();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("{{ERRORS}}");
    });
  });

  describe("buildRetryPrompt", () => {
    it("should build retry prompt with single error", async () => {
      const { buildRetryPrompt } = await import("../loader");

      const result = buildRetryPrompt(["Missing required field"]);

      expect(result).toBeDefined();
      expect(result).toContain("- Missing required field");
      // Should not contain the placeholder anymore
      expect(result).not.toContain("{{ERRORS}}");
    });

    it("should build retry prompt with multiple errors", async () => {
      const { buildRetryPrompt } = await import("../loader");

      const result = buildRetryPrompt(["Error 1", "Error 2", "Error 3"]);

      expect(result).toContain("- Error 1");
      expect(result).toContain("- Error 2");
      expect(result).toContain("- Error 3");
    });

    it("should handle empty errors array", async () => {
      const { buildRetryPrompt } = await import("../loader");

      const result = buildRetryPrompt([]);

      expect(result).toBeDefined();
      // Should not contain the placeholder anymore
      expect(result).not.toContain("{{ERRORS}}");
    });

    it("should preserve error message content exactly", async () => {
      const { buildRetryPrompt } = await import("../loader");

      const result = buildRetryPrompt([
        "Field 'notes' must be an array",
        "Invalid BPM: expected 60-200, got 300",
      ]);

      expect(result).toContain("- Field 'notes' must be an array");
      expect(result).toContain("- Invalid BPM: expected 60-200, got 300");
    });
  });

  describe("backward compatibility", () => {
    it("should maintain backward compatibility - default model uses default prompt", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and affordable",
        costTier: "low",
        // Existing models have no systemPromptVariation
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel, loadSystemPrompt } = await import("../loader");

      const modelPrompt = loadSystemPromptForModel("gpt-4o-mini");
      const defaultPrompt = loadSystemPrompt();

      expect(modelPrompt).toBe(defaultPrompt);
    });

    it("should work with gpt-4o-mini model ID", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "gpt-4o-mini",
        name: "gpt-4o-mini",
        description: "Test",
        costTier: "low",
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("gpt-4o-mini");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should work with gpt-4o model ID", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "gpt-4o",
        name: "gpt-4o",
        description: "Test",
        costTier: "high",
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("gpt-4o");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should work with gpt-4-turbo model ID", async () => {
      const mockGetModelById = vi.fn().mockReturnValue({
        id: "gpt-4-turbo",
        name: "gpt-4-turbo",
        description: "Test",
        costTier: "medium",
      } as AIModel);

      vi.doMock("@/lib/models", () => ({
        getModelById: mockGetModelById,
      }));

      const { loadSystemPromptForModel } = await import("../loader");

      const result = loadSystemPromptForModel("gpt-4-turbo");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
