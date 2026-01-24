import { describe, it, expect } from "vitest";

describe("TweaksInjector module", () => {
  describe("module structure", () => {
    it("should export tweaksToComment function", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      expect(tweaksToComment).toBeDefined();
      expect(typeof tweaksToComment).toBe("function");
    });

    it("should export extractTweaks function", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      expect(extractTweaks).toBeDefined();
      expect(typeof extractTweaks).toBe("function");
    });

    it("should export injectTweaks function", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      expect(injectTweaks).toBeDefined();
      expect(typeof injectTweaks).toBe("function");
    });

    it("should export tweaksNeedUpdate function", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      expect(tweaksNeedUpdate).toBeDefined();
      expect(typeof tweaksNeedUpdate).toBe("function");
    });
  });

  describe("tweaksToComment", () => {
    it("should produce valid JSON comment", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const comment = tweaksToComment(tweaks);
      expect(comment).toMatch(/^\/\/\s*TWEAKS:/);
    });

    it("should include all tweak values", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      const tweaks = { bpm: 90, swing: 15, filter: 6000, reverb: 40, delay: 30 };
      const comment = tweaksToComment(tweaks);
      expect(comment).toContain('"bpm":90');
      expect(comment).toContain('"swing":15');
      expect(comment).toContain('"filter":6000');
      expect(comment).toContain('"reverb":40');
      expect(comment).toContain('"delay":30');
    });

    it("should produce parseable JSON", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      const tweaks = { bpm: 100, swing: 20, filter: 5000, reverb: 50, delay: 35 };
      const comment = tweaksToComment(tweaks);
      const jsonMatch = comment.match(/TWEAKS:\s*(\{[^}]+\})/);
      expect(jsonMatch).not.toBeNull();
      const parsed = JSON.parse(jsonMatch![1]);
      expect(parsed).toEqual(tweaks);
    });

    it("should handle edge case values", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      const tweaks = { bpm: 60, swing: 0, filter: 100, reverb: 0, delay: 0 };
      const comment = tweaksToComment(tweaks);
      expect(comment).toContain('"bpm":60');
      expect(comment).toContain('"swing":0');
    });

    it("should handle max values", async () => {
      const { tweaksToComment } = await import("../tweaksInjector");
      const tweaks = { bpm: 200, swing: 100, filter: 10000, reverb: 100, delay: 100 };
      const comment = tweaksToComment(tweaks);
      expect(comment).toContain('"bpm":200');
      expect(comment).toContain('"swing":100');
    });
  });

  describe("extractTweaks", () => {
    it("should parse TWEAKS comment correctly", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":90,"swing":15,"filter":6000,"reverb":40,"delay":30}
Tone.Transport.bpm.value = 90;`;
      const tweaks = extractTweaks(code);
      expect(tweaks).not.toBeNull();
      expect(tweaks?.bpm).toBe(90);
      expect(tweaks?.swing).toBe(15);
      expect(tweaks?.filter).toBe(6000);
      expect(tweaks?.reverb).toBe(40);
      expect(tweaks?.delay).toBe(30);
    });

    it("should return null if no tweaks comment found", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const code = `Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;`;
      const tweaks = extractTweaks(code);
      expect(tweaks).toBeNull();
    });

    it("should return null for malformed JSON", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const code = `// TWEAKS: {malformed json}
Tone.Transport.bpm.value = 82;`;
      const tweaks = extractTweaks(code);
      expect(tweaks).toBeNull();
    });

    it("should merge with defaults for partial tweaks", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      const code = `// TWEAKS: {"bpm":90}
Tone.Transport.bpm.value = 90;`;
      const tweaks = extractTweaks(code);
      expect(tweaks).not.toBeNull();
      expect(tweaks?.bpm).toBe(90);
      expect(tweaks?.swing).toBe(DEFAULT_TWEAKS.swing);
      expect(tweaks?.filter).toBe(DEFAULT_TWEAKS.filter);
    });

    it("should handle tweaks comment in middle of code", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const code = `// Some comment
// TWEAKS: {"bpm":95,"swing":10,"filter":7000,"reverb":30,"delay":25}
Tone.Transport.bpm.value = 95;`;
      const tweaks = extractTweaks(code);
      expect(tweaks?.bpm).toBe(95);
    });

    it("should handle extra whitespace in comment", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const code = `//   TWEAKS:   {"bpm":85,"swing":12,"filter":7500,"reverb":35,"delay":22}
Tone.Transport.bpm.value = 85;`;
      const tweaks = extractTweaks(code);
      expect(tweaks?.bpm).toBe(85);
    });

    it("should reject non-number values in tweaks", async () => {
      const { extractTweaks } = await import("../tweaksInjector");
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      const code = `// TWEAKS: {"bpm":"fast","swing":10,"filter":7000,"reverb":30,"delay":25}
Tone.Transport.bpm.value = 82;`;
      const tweaks = extractTweaks(code);
      // Should fall back to default for non-number value
      expect(tweaks?.bpm).toBe(DEFAULT_TWEAKS.bpm);
      expect(tweaks?.swing).toBe(10);
    });
  });

  describe("injectTweaks", () => {
    const sampleCode = `Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;
const masterLowpass = new Tone.Filter(8000, "lowpass");
const masterReverb = new Tone.Reverb({ decay: 1.5, wet: 0.25 });
tapeDelay.wet.value = 0.20;`;

    it("should add tweaks code block", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 90, swing: 15, filter: 6000, reverb: 40, delay: 30 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toMatch(/^\/\/\s*TWEAKS:/);
    });

    it("should update BPM value", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 120, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("Tone.Transport.bpm.value = 120");
    });

    it("should update swing value (converting to 0-1 range)", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 50, filter: 8000, reverb: 25, delay: 20 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("Tone.Transport.swing = 0.50");
    });

    it("should update filter frequency", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 8, filter: 5000, reverb: 25, delay: 20 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("const masterLowpass = new Tone.Filter(5000");
    });

    it("should update reverb wet value (converting to 0-1 range)", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 60, delay: 20 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("wet: 0.60");
    });

    it("should update delay wet value (converting to 0-1 range)", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 45 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("tapeDelay.wet.value = 0.45");
    });

    it("should handle code with existing tweaks comment", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const codeWithTweaks = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
${sampleCode}`;
      const tweaks = { bpm: 100, swing: 20, filter: 6000, reverb: 35, delay: 30 };
      const result = injectTweaks(codeWithTweaks, tweaks);

      // Should only have one TWEAKS comment
      const matches = result.match(/\/\/\s*TWEAKS:/g);
      expect(matches).toHaveLength(1);
      expect(result).toContain('"bpm":100');
    });

    it("should preserve code structure", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const result = injectTweaks(sampleCode, tweaks);

      // Should still have the basic structure
      expect(result).toContain("Tone.Transport.bpm.value");
      expect(result).toContain("Tone.Transport.swing");
      expect(result).toContain("masterLowpass");
      expect(result).toContain("masterReverb");
      expect(result).toContain("tapeDelay");
    });

    it("should handle edge case values", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 60, swing: 0, filter: 100, reverb: 0, delay: 0 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("Tone.Transport.bpm.value = 60");
      expect(result).toContain("Tone.Transport.swing = 0.00");
      expect(result).toContain("tapeDelay.wet.value = 0.00");
    });

    it("should handle max values", async () => {
      const { injectTweaks } = await import("../tweaksInjector");
      const tweaks = { bpm: 200, swing: 100, filter: 10000, reverb: 100, delay: 100 };
      const result = injectTweaks(sampleCode, tweaks);
      expect(result).toContain("Tone.Transport.bpm.value = 200");
      expect(result).toContain("Tone.Transport.swing = 1.00");
      expect(result).toContain("wet: 1.00");
      expect(result).toContain("tapeDelay.wet.value = 1.00");
    });
  });

  describe("tweaksNeedUpdate", () => {
    it("should return true if no tweaks in code", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });

    it("should return false if tweaks match", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(false);
    });

    it("should return true if bpm differs", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 90, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });

    it("should return true if swing differs", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 15, filter: 8000, reverb: 25, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });

    it("should return true if filter differs", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 8, filter: 6000, reverb: 25, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });

    it("should return true if reverb differs", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 50, delay: 20 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });

    it("should return true if delay differs", async () => {
      const { tweaksNeedUpdate } = await import("../tweaksInjector");
      const code = `// TWEAKS: {"bpm":82,"swing":8,"filter":8000,"reverb":25,"delay":20}
Tone.Transport.bpm.value = 82;`;
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 40 };
      expect(tweaksNeedUpdate(code, tweaks)).toBe(true);
    });
  });

  describe("roundtrip integrity", () => {
    it("should preserve tweaks through inject/extract cycle", async () => {
      const { injectTweaks, extractTweaks } = await import("../tweaksInjector");
      const originalCode = `Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;
const masterLowpass = new Tone.Filter(8000, "lowpass");
const masterReverb = new Tone.Reverb({ decay: 1.5, wet: 0.25 });
tapeDelay.wet.value = 0.20;`;
      const tweaks = { bpm: 95, swing: 22, filter: 5500, reverb: 42, delay: 35 };

      const injected = injectTweaks(originalCode, tweaks);
      const extracted = extractTweaks(injected);

      expect(extracted).toEqual(tweaks);
    });

    it("should handle multiple inject cycles", async () => {
      const { injectTweaks, extractTweaks } = await import("../tweaksInjector");
      const originalCode = `Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;
const masterLowpass = new Tone.Filter(8000, "lowpass");
const masterReverb = new Tone.Reverb({ decay: 1.5, wet: 0.25 });
tapeDelay.wet.value = 0.20;`;

      const tweaks1 = { bpm: 80, swing: 10, filter: 6000, reverb: 30, delay: 25 };
      const tweaks2 = { bpm: 100, swing: 20, filter: 7000, reverb: 40, delay: 35 };

      const injected1 = injectTweaks(originalCode, tweaks1);
      const injected2 = injectTweaks(injected1, tweaks2);
      const extracted = extractTweaks(injected2);

      expect(extracted).toEqual(tweaks2);

      // Should still only have one TWEAKS comment
      const matches = injected2.match(/\/\/\s*TWEAKS:/g);
      expect(matches).toHaveLength(1);
    });
  });
});
