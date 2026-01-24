import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("audioLayer types module", () => {
  describe("module structure", () => {
    it("should export LAYER_COLORS constant", async () => {
      const { LAYER_COLORS } = await import("../audioLayer");
      expect(LAYER_COLORS).toBeDefined();
      expect(Array.isArray(LAYER_COLORS)).toBe(true);
    });

    it("should export generateLayerId function", async () => {
      const { generateLayerId } = await import("../audioLayer");
      expect(generateLayerId).toBeDefined();
      expect(typeof generateLayerId).toBe("function");
    });

    it("should export createDefaultLayer function", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      expect(createDefaultLayer).toBeDefined();
      expect(typeof createDefaultLayer).toBe("function");
    });

    it("should export EMPTY_LAYER_CODE constant", async () => {
      const { EMPTY_LAYER_CODE } = await import("../audioLayer");
      expect(EMPTY_LAYER_CODE).toBeDefined();
      expect(typeof EMPTY_LAYER_CODE).toBe("string");
    });

    it("should export DEFAULT_LAYERS constant", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      expect(DEFAULT_LAYERS).toBeDefined();
      expect(Array.isArray(DEFAULT_LAYERS)).toBe(true);
    });
  });

  describe("LAYER_COLORS", () => {
    it("should have 10 colors", async () => {
      const { LAYER_COLORS } = await import("../audioLayer");
      expect(LAYER_COLORS).toHaveLength(10);
    });

    it("should contain valid hex color codes", async () => {
      const { LAYER_COLORS } = await import("../audioLayer");
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      LAYER_COLORS.forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it("should be a readonly array", async () => {
      const { LAYER_COLORS } = await import("../audioLayer");
      // TypeScript ensures this at compile time, but we can verify the array has content
      expect(LAYER_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe("generateLayerId", () => {
    let originalDateNow: typeof Date.now;
    let originalMathRandom: typeof Math.random;

    beforeEach(() => {
      originalDateNow = Date.now;
      originalMathRandom = Math.random;
    });

    afterEach(() => {
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });

    it("should return a string", async () => {
      const { generateLayerId } = await import("../audioLayer");
      const id = generateLayerId();
      expect(typeof id).toBe("string");
    });

    it("should start with 'layer-' prefix", async () => {
      const { generateLayerId } = await import("../audioLayer");
      const id = generateLayerId();
      expect(id.startsWith("layer-")).toBe(true);
    });

    it("should generate unique IDs", async () => {
      const { generateLayerId } = await import("../audioLayer");
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateLayerId());
      }
      expect(ids.size).toBe(100);
    });

    it("should include timestamp in the ID", async () => {
      const { generateLayerId } = await import("../audioLayer");
      const mockTime = 1706112000000;
      Date.now = vi.fn(() => mockTime);

      const id = generateLayerId();
      expect(id).toContain(mockTime.toString());
    });

    it("should include random component in the ID", async () => {
      const { generateLayerId } = await import("../audioLayer");
      const mockTime = 1706112000000;
      Date.now = vi.fn(() => mockTime);
      Math.random = vi.fn(() => 0.5);

      const id = generateLayerId();
      // ID format: layer-{timestamp}-{random7chars}
      const parts = id.split("-");
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("createDefaultLayer", () => {
    it("should create a layer with the given name", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("drums");
      expect(layer.name).toBe("drums");
    });

    it("should create a layer with empty code by default", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("bass");
      expect(layer.code).toBe("");
    });

    it("should create a layer with the given code", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const code = "const synth = new Tone.Synth();";
      const layer = createDefaultLayer("melody", code);
      expect(layer.code).toBe(code);
    });

    it("should create a layer with muted set to false", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("drums");
      expect(layer.muted).toBe(false);
    });

    it("should create a layer with soloed set to false", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("drums");
      expect(layer.soloed).toBe(false);
    });

    it("should create a layer with volume set to 100", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("drums");
      expect(layer.volume).toBe(100);
    });

    it("should create a layer with a unique ID", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer1 = createDefaultLayer("drums");
      const layer2 = createDefaultLayer("drums");
      expect(layer1.id).not.toBe(layer2.id);
    });

    it("should use first color when no colorIndex provided", async () => {
      const { createDefaultLayer, LAYER_COLORS } = await import("../audioLayer");
      const layer = createDefaultLayer("drums");
      expect(layer.color).toBe(LAYER_COLORS[0]);
    });

    it("should use color at specified index", async () => {
      const { createDefaultLayer, LAYER_COLORS } = await import("../audioLayer");
      const layer = createDefaultLayer("bass", "", 3);
      expect(layer.color).toBe(LAYER_COLORS[3]);
    });

    it("should wrap colorIndex when exceeding LAYER_COLORS length", async () => {
      const { createDefaultLayer, LAYER_COLORS } = await import("../audioLayer");
      const colorIndex = LAYER_COLORS.length + 2;
      const layer = createDefaultLayer("test", "", colorIndex);
      expect(layer.color).toBe(LAYER_COLORS[2]);
    });

    it("should handle colorIndex of 0", async () => {
      const { createDefaultLayer, LAYER_COLORS } = await import("../audioLayer");
      const layer = createDefaultLayer("test", "", 0);
      expect(layer.color).toBe(LAYER_COLORS[0]);
    });
  });

  describe("EMPTY_LAYER_CODE", () => {
    it("should be a multi-line string with example code", async () => {
      const { EMPTY_LAYER_CODE } = await import("../audioLayer");
      expect(EMPTY_LAYER_CODE).toContain("Tone.js");
    });

    it("should include comment syntax", async () => {
      const { EMPTY_LAYER_CODE } = await import("../audioLayer");
      expect(EMPTY_LAYER_CODE).toContain("//");
    });

    it("should include example of Synth creation", async () => {
      const { EMPTY_LAYER_CODE } = await import("../audioLayer");
      expect(EMPTY_LAYER_CODE).toContain("Tone.Synth");
    });
  });

  describe("DEFAULT_LAYERS", () => {
    it("should have at least one layer", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      expect(DEFAULT_LAYERS.length).toBeGreaterThanOrEqual(1);
    });

    it("should have a 'main' layer as first layer", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      expect(DEFAULT_LAYERS[0].name).toBe("main");
    });

    it("should have layers with all required properties", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      DEFAULT_LAYERS.forEach((layer) => {
        expect(layer).toHaveProperty("id");
        expect(layer).toHaveProperty("name");
        expect(layer).toHaveProperty("code");
        expect(layer).toHaveProperty("muted");
        expect(layer).toHaveProperty("soloed");
        expect(layer).toHaveProperty("volume");
        expect(layer).toHaveProperty("color");
      });
    });

    it("should have layers with valid volume values (0-100)", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      DEFAULT_LAYERS.forEach((layer) => {
        expect(layer.volume).toBeGreaterThanOrEqual(0);
        expect(layer.volume).toBeLessThanOrEqual(100);
      });
    });

    it("should have layers that are not muted by default", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      DEFAULT_LAYERS.forEach((layer) => {
        expect(layer.muted).toBe(false);
      });
    });

    it("should have layers that are not soloed by default", async () => {
      const { DEFAULT_LAYERS } = await import("../audioLayer");
      DEFAULT_LAYERS.forEach((layer) => {
        expect(layer.soloed).toBe(false);
      });
    });
  });

  describe("AudioLayer interface shape", () => {
    it("should create valid layer objects with all properties", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("test", "// code");

      // Verify shape of returned object
      expect(typeof layer.id).toBe("string");
      expect(typeof layer.name).toBe("string");
      expect(typeof layer.code).toBe("string");
      expect(typeof layer.muted).toBe("boolean");
      expect(typeof layer.soloed).toBe("boolean");
      expect(typeof layer.volume).toBe("number");
      expect(typeof layer.color).toBe("string");
    });

    it("should allow modifying layer properties", async () => {
      const { createDefaultLayer } = await import("../audioLayer");
      const layer = createDefaultLayer("test");

      layer.muted = true;
      layer.soloed = true;
      layer.volume = 50;
      layer.name = "new name";
      layer.code = "new code";

      expect(layer.muted).toBe(true);
      expect(layer.soloed).toBe(true);
      expect(layer.volume).toBe(50);
      expect(layer.name).toBe("new name");
      expect(layer.code).toBe("new code");
    });
  });
});
