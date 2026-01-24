import { describe, it, expect } from "vitest";
import type { AudioLayer } from "@/lib/types/audioLayer";

describe("layerCombiner module", () => {
  describe("module structure", () => {
    it("should export applySoloLogic function", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      expect(applySoloLogic).toBeDefined();
      expect(typeof applySoloLogic).toBe("function");
    });

    it("should export applyMuteWrapper function", async () => {
      const { applyMuteWrapper } = await import("../layerCombiner");
      expect(applyMuteWrapper).toBeDefined();
      expect(typeof applyMuteWrapper).toBe("function");
    });

    it("should export volumeToDb function", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      expect(volumeToDb).toBeDefined();
      expect(typeof volumeToDb).toBe("function");
    });

    it("should export injectLayerVolume function", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      expect(injectLayerVolume).toBeDefined();
      expect(typeof injectLayerVolume).toBe("function");
    });

    it("should export generateLayerHeader function", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      expect(generateLayerHeader).toBeDefined();
      expect(typeof generateLayerHeader).toBe("function");
    });

    it("should export combineLayers function", async () => {
      const { combineLayers } = await import("../layerCombiner");
      expect(combineLayers).toBeDefined();
      expect(typeof combineLayers).toBe("function");
    });

    it("should export extractLayerNames function", async () => {
      const { extractLayerNames } = await import("../layerCombiner");
      expect(extractLayerNames).toBeDefined();
      expect(typeof extractLayerNames).toBe("function");
    });
  });

  describe("applySoloLogic", () => {
    const createTestLayer = (overrides: Partial<AudioLayer> = {}): AudioLayer => ({
      id: "test-id",
      name: "test",
      code: "// test code",
      muted: false,
      soloed: false,
      volume: 100,
      color: "#ffffff",
      ...overrides,
    });

    it("should return layers unchanged when no layer is soloed", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums" }), createTestLayer({ name: "bass" })];

      const result = applySoloLogic(layers);

      expect(result).toEqual(layers);
    });

    it("should mute non-soloed layers when one layer is soloed", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", soloed: true }),
        createTestLayer({ name: "bass", soloed: false }),
        createTestLayer({ name: "melody", soloed: false }),
      ];

      const result = applySoloLogic(layers);

      expect(result[0].muted).toBe(false); // drums - soloed, not muted
      expect(result[1].muted).toBe(true); // bass - not soloed, muted
      expect(result[2].muted).toBe(true); // melody - not soloed, muted
    });

    it("should keep multiple soloed layers unmuted", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", soloed: true }),
        createTestLayer({ name: "bass", soloed: true }),
        createTestLayer({ name: "melody", soloed: false }),
      ];

      const result = applySoloLogic(layers);

      expect(result[0].muted).toBe(false); // drums - soloed
      expect(result[1].muted).toBe(false); // bass - soloed
      expect(result[2].muted).toBe(true); // melody - not soloed
    });

    it("should preserve already-muted state on soloed layers", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", soloed: true, muted: true }),
        createTestLayer({ name: "bass", soloed: false }),
      ];

      const result = applySoloLogic(layers);

      expect(result[0].muted).toBe(true); // drums - soloed but already muted
      expect(result[1].muted).toBe(true); // bass - not soloed
    });

    it("should handle empty layers array", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const result = applySoloLogic([]);
      expect(result).toEqual([]);
    });

    it("should handle single layer that is soloed", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", soloed: true })];

      const result = applySoloLogic(layers);

      expect(result[0].muted).toBe(false);
    });

    it("should not mutate original layers array", async () => {
      const { applySoloLogic } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", soloed: true }),
        createTestLayer({ name: "bass" }),
      ];
      const originalMuted = layers[1].muted;

      applySoloLogic(layers);

      expect(layers[1].muted).toBe(originalMuted);
    });
  });

  describe("applyMuteWrapper", () => {
    it("should wrap code in comment block", async () => {
      const { applyMuteWrapper } = await import("../layerCombiner");
      const code = "const synth = new Tone.Synth();";
      const layerName = "drums";

      const result = applyMuteWrapper(code, layerName);

      expect(result).toContain("/* === MUTED: drums ===");
      expect(result).toContain("=== END MUTED === */");
      expect(result).toContain(code);
    });

    it("should preserve multi-line code", async () => {
      const { applyMuteWrapper } = await import("../layerCombiner");
      const code = `const synth = new Tone.Synth();
synth.toDestination();
synth.triggerAttackRelease("C4", "8n");`;

      const result = applyMuteWrapper(code, "test");

      expect(result).toContain(code);
    });

    it("should handle empty code", async () => {
      const { applyMuteWrapper } = await import("../layerCombiner");
      const result = applyMuteWrapper("", "empty");

      expect(result).toContain("MUTED: empty");
    });

    it("should handle special characters in layer name", async () => {
      const { applyMuteWrapper } = await import("../layerCombiner");
      const result = applyMuteWrapper("code", "layer/1");

      expect(result).toContain("MUTED: layer/1");
    });
  });

  describe("volumeToDb", () => {
    it("should return 0 dB for 100% volume", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      expect(volumeToDb(100)).toBe(0);
    });

    it("should return -60 dB for 0% volume", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      expect(volumeToDb(0)).toBe(-60);
    });

    it("should return approximately -6 dB for 50% volume", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      const result = volumeToDb(50);
      expect(result).toBeCloseTo(-6.02, 1);
    });

    it("should return approximately -12 dB for 25% volume", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      const result = volumeToDb(25);
      expect(result).toBeCloseTo(-12.04, 1);
    });

    it("should handle negative volume as 0", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      expect(volumeToDb(-10)).toBe(-60);
    });

    it("should clamp volume above 100 to 0 dB", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      expect(volumeToDb(150)).toBe(0);
    });

    it("should use logarithmic scaling", async () => {
      const { volumeToDb } = await import("../layerCombiner");
      // Each halving of volume should be approximately -6dB
      const v100 = volumeToDb(100);
      const v50 = volumeToDb(50);
      const v25 = volumeToDb(25);

      expect(v50 - v100).toBeCloseTo(-6, 0);
      expect(v25 - v50).toBeCloseTo(-6, 0);
    });
  });

  describe("injectLayerVolume", () => {
    it("should return unchanged code for 100% volume", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      const code = "const synth = new Tone.Synth();";
      const result = injectLayerVolume(code, 100, "test");

      expect(result).toBe(code);
    });

    it("should prepend volume comment for non-100% volume", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      const code = "const synth = new Tone.Synth();";
      const result = injectLayerVolume(code, 50, "drums");

      expect(result).toContain("// LAYER_VOLUME:");
      expect(result).toContain("50%");
      expect(result).toContain('"drums"');
      expect(result).toContain(code);
    });

    it("should include dB value in comment", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      const result = injectLayerVolume("code", 50, "test");

      expect(result).toMatch(/-6\.\d+dB/); // approximately -6dB
    });

    it("should preserve original code after comment", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      const code = "line1\nline2\nline3";
      const result = injectLayerVolume(code, 75, "test");

      const lines = result.split("\n");
      expect(lines[0]).toContain("LAYER_VOLUME");
      expect(lines.slice(1).join("\n")).toBe(code);
    });

    it("should handle 0% volume", async () => {
      const { injectLayerVolume } = await import("../layerCombiner");
      const result = injectLayerVolume("code", 0, "silent");

      expect(result).toContain("-60.0dB");
      expect(result).toContain("0%");
    });
  });

  describe("generateLayerHeader", () => {
    const createTestLayer = (overrides: Partial<AudioLayer> = {}): AudioLayer => ({
      id: "test-id",
      name: "test",
      code: "// code",
      muted: false,
      soloed: false,
      volume: 100,
      color: "#ffffff",
      ...overrides,
    });

    it("should include layer name in header", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ name: "drums" });
      const result = generateLayerHeader(layer);

      expect(result).toContain("LAYER: drums");
    });

    it("should include [MUTED] for muted layers", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ name: "drums", muted: true });
      const result = generateLayerHeader(layer);

      expect(result).toContain("[MUTED]");
    });

    it("should include [SOLO] for soloed layers", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ name: "drums", soloed: true });
      const result = generateLayerHeader(layer);

      expect(result).toContain("[SOLO]");
    });

    it("should include volume percentage for non-100 volume", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ name: "drums", volume: 75 });
      const result = generateLayerHeader(layer);

      expect(result).toContain("(75%)");
    });

    it("should not include volume for 100% volume", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ name: "drums", volume: 100 });
      const result = generateLayerHeader(layer);

      expect(result).not.toContain("100%");
    });

    it("should include decorative lines", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer();
      const result = generateLayerHeader(layer);

      expect(result).toContain("═══");
    });

    it("should prioritize [MUTED] over [SOLO] when both are set", async () => {
      const { generateLayerHeader } = await import("../layerCombiner");
      const layer = createTestLayer({ muted: true, soloed: true });
      const result = generateLayerHeader(layer);

      expect(result).toContain("[MUTED]");
      expect(result).not.toContain("[SOLO]");
    });
  });

  describe("combineLayers", () => {
    const createTestLayer = (overrides: Partial<AudioLayer> = {}): AudioLayer => ({
      id: "test-id",
      name: "test",
      code: "const x = 1;",
      muted: false,
      soloed: false,
      volume: 100,
      color: "#ffffff",
      ...overrides,
    });

    it("should return empty string for empty layers array", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const result = combineLayers([]);
      expect(result).toBe("");
    });

    it("should include all layer codes in output", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "drums code" }),
        createTestLayer({ name: "bass", code: "bass code" }),
      ];

      const result = combineLayers(layers);

      expect(result).toContain("drums code");
      expect(result).toContain("bass code");
    });

    it("should skip layers with empty code", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "drums code" }),
        createTestLayer({ name: "empty", code: "" }),
        createTestLayer({ name: "bass", code: "bass code" }),
      ];

      const result = combineLayers(layers);

      expect(result).toContain("drums code");
      expect(result).toContain("bass code");
      expect(result).not.toContain("LAYER: empty");
    });

    it("should wrap muted layer code in comment block", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", code: "drums code", muted: true })];

      const result = combineLayers(layers);

      expect(result).toContain("/* === MUTED: drums ===");
      expect(result).toContain("=== END MUTED === */");
    });

    it("should not wrap unmuted layer code in comment block", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", code: "drums code", muted: false })];

      const result = combineLayers(layers);

      expect(result).not.toContain("/* === MUTED:");
    });

    it("should apply solo logic before combining", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "drums code", soloed: true }),
        createTestLayer({ name: "bass", code: "bass code", soloed: false }),
      ];

      const result = combineLayers(layers);

      // drums should be active (not wrapped)
      expect(result).toContain("LAYER: drums");
      expect(result).not.toContain("MUTED: drums");

      // bass should be muted (wrapped)
      expect(result).toContain("MUTED: bass");
    });

    it("should inject volume for non-100% volume layers", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", code: "drums code", volume: 50 })];

      const result = combineLayers(layers);

      expect(result).toContain("LAYER_VOLUME:");
      expect(result).toContain("50%");
    });

    it("should not inject volume for 100% volume layers", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", code: "drums code", volume: 100 })];

      const result = combineLayers(layers);

      expect(result).not.toContain("LAYER_VOLUME:");
    });

    it("should include layer headers", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "drums code" }),
        createTestLayer({ name: "bass", code: "bass code" }),
      ];

      const result = combineLayers(layers);

      expect(result).toContain("LAYER: drums");
      expect(result).toContain("LAYER: bass");
    });

    it("should separate layers with blank lines", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "drums code" }),
        createTestLayer({ name: "bass", code: "bass code" }),
      ];

      const result = combineLayers(layers);

      expect(result).toContain("\n\n");
    });

    it("should handle layers with whitespace-only code", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({ name: "drums", code: "   \n  \t  " }),
        createTestLayer({ name: "bass", code: "bass code" }),
      ];

      const result = combineLayers(layers);

      expect(result).not.toContain("LAYER: drums");
      expect(result).toContain("LAYER: bass");
    });

    it("should trim code before combining", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [createTestLayer({ name: "drums", code: "  code  \n  " })];

      const result = combineLayers(layers);

      expect(result).toContain("code");
    });
  });

  describe("extractLayerNames", () => {
    it("should extract layer names from combined code", async () => {
      const { extractLayerNames, combineLayers } = await import("../layerCombiner");
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "code",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
        {
          id: "2",
          name: "bass",
          code: "code",
          muted: false,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const combined = combineLayers(layers);
      const names = extractLayerNames(combined);

      expect(names).toContain("drums");
      expect(names).toContain("bass");
    });

    it("should return empty array for code without layer markers", async () => {
      const { extractLayerNames } = await import("../layerCombiner");
      const result = extractLayerNames("const x = 1;");
      expect(result).toEqual([]);
    });

    it("should return empty array for empty string", async () => {
      const { extractLayerNames } = await import("../layerCombiner");
      const result = extractLayerNames("");
      expect(result).toEqual([]);
    });

    it("should extract names from muted layers", async () => {
      const { extractLayerNames, combineLayers } = await import("../layerCombiner");
      const layers: AudioLayer[] = [
        {
          id: "1",
          name: "drums",
          code: "code",
          muted: true,
          soloed: false,
          volume: 100,
          color: "#fff",
        },
      ];

      const combined = combineLayers(layers);
      const names = extractLayerNames(combined);

      expect(names).toContain("drums");
    });

    it("should handle layer names with spaces", async () => {
      const { extractLayerNames } = await import("../layerCombiner");
      const code = "// LAYER: drum kit\ncode";
      const names = extractLayerNames(code);

      expect(names).toContain("drum kit");
    });
  });

  describe("integration scenarios", () => {
    const createTestLayer = (overrides: Partial<AudioLayer> = {}): AudioLayer => ({
      id: "test-id",
      name: "test",
      code: "const x = 1;",
      muted: false,
      soloed: false,
      volume: 100,
      color: "#ffffff",
      ...overrides,
    });

    it("should handle complex multi-track scenario", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({
          id: "1",
          name: "drums",
          code: "// kick pattern",
          muted: false,
          soloed: false,
          volume: 100,
        }),
        createTestLayer({
          id: "2",
          name: "bass",
          code: "// bass line",
          muted: false,
          soloed: true,
          volume: 80,
        }),
        createTestLayer({
          id: "3",
          name: "melody",
          code: "// melody",
          muted: true,
          soloed: false,
          volume: 100,
        }),
        createTestLayer({
          id: "4",
          name: "fx",
          code: "// effects",
          muted: false,
          soloed: false,
          volume: 50,
        }),
      ];

      const result = combineLayers(layers);

      // drums should be muted (not soloed when bass is soloed)
      expect(result).toContain("MUTED: drums");

      // bass should be active with volume
      expect(result).toContain("LAYER: bass");
      expect(result).toContain("80%");

      // melody was already muted
      expect(result).toContain("MUTED: melody");

      // fx should be muted (not soloed)
      expect(result).toContain("MUTED: fx");
    });

    it("should produce executable code structure", async () => {
      const { combineLayers } = await import("../layerCombiner");
      const layers = [
        createTestLayer({
          name: "drums",
          code: `const kick = new Tone.MembraneSynth().toDestination();
new Tone.Loop((time) => kick.triggerAttackRelease("C1", "8n", time), "4n").start(0);`,
        }),
        createTestLayer({
          name: "bass",
          code: `const bass = new Tone.Synth().toDestination();
new Tone.Sequence((time, note) => bass.triggerAttackRelease(note, "8n", time), ["C2", "E2"]).start(0);`,
        }),
      ];

      const result = combineLayers(layers);

      // Should have proper structure
      expect(result).toContain("LAYER: drums");
      expect(result).toContain("LAYER: bass");
      expect(result).toContain("MembraneSynth");
      expect(result).toContain("Sequence");
    });
  });
});
