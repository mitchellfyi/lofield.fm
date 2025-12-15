import { describe, it, expect } from "vitest";
import { validateGenerationParams, checkPromptSafety } from "@/lib/validation";

describe("validateGenerationParams", () => {
  it("validates length constraints", () => {
    expect(validateGenerationParams({ length_ms: 2000 }).valid).toBe(false);
    expect(validateGenerationParams({ length_ms: 3001 }).valid).toBe(true);
    expect(validateGenerationParams({ length_ms: 300001 }).valid).toBe(false);
  });

  it("validates bpm", () => {
    expect(validateGenerationParams({ bpm: 30 }).valid).toBe(false);
    expect(validateGenerationParams({ bpm: 80 }).valid).toBe(true);
    expect(validateGenerationParams({ bpm: 230 }).valid).toBe(false);
  });

  it("validates mood", () => {
    expect(
      validateGenerationParams({
        mood: { energy: 50, focus: 50, chill: 50 },
      }).valid
    ).toBe(true);

    expect(
      validateGenerationParams({
        mood: { energy: 101, focus: 50, chill: 50 },
      }).valid
    ).toBe(false);
  });
});

describe("checkPromptSafety", () => {
  it("flags artist style references", () => {
    const result = checkPromptSafety("in the style of J Dilla");
    expect(result.safe).toBe(false);
    expect(result.warnings[0]).toContain('Detected "in the style of J Dilla"');
  });

  it("flags direct artist comparisons", () => {
    const result = checkPromptSafety("sounds like Nujabes");
    expect(result.safe).toBe(false);
    expect(result.warnings[0]).toContain(
      'Detected artist reference: "sounds like Nujabes"'
    );
  });

  it("allows safe prompts", () => {
    const result = checkPromptSafety("lo-fi hip hop beat with piano");
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
