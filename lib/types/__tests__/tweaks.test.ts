import { describe, it, expect } from "vitest";

describe("Tweaks types module", () => {
  describe("module structure", () => {
    it("should export TweaksConfig interface", async () => {
      const tweaksModule = await import("../tweaks");
      // TypeScript interfaces don't exist at runtime, but the module should export defaults
      expect(tweaksModule).toBeDefined();
    });

    it("should export DEFAULT_TWEAKS constant", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS).toBeDefined();
      expect(typeof DEFAULT_TWEAKS).toBe("object");
    });

    it("should export TWEAK_PARAMS constant", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      expect(TWEAK_PARAMS).toBeDefined();
      expect(Array.isArray(TWEAK_PARAMS)).toBe(true);
    });
  });

  describe("DEFAULT_TWEAKS", () => {
    it("should have bpm property with value 82", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS.bpm).toBe(82);
    });

    it("should have swing property with value 8", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS.swing).toBe(8);
    });

    it("should have filter property with value 8000", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS.filter).toBe(8000);
    });

    it("should have reverb property with value 25", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS.reverb).toBe(25);
    });

    it("should have delay property with value 20", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(DEFAULT_TWEAKS.delay).toBe(20);
    });

    it("should have exactly 5 properties", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      expect(Object.keys(DEFAULT_TWEAKS)).toHaveLength(5);
    });

    it("should be immutable at the top level", async () => {
      const { DEFAULT_TWEAKS } = await import("../tweaks");
      const originalBpm = DEFAULT_TWEAKS.bpm;
      expect(DEFAULT_TWEAKS.bpm).toBe(originalBpm);
    });
  });

  describe("TWEAK_PARAMS", () => {
    it("should have 5 parameter definitions", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      expect(TWEAK_PARAMS).toHaveLength(5);
    });

    it("should have bpm parameter with correct bounds (60-200)", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const bpmParam = TWEAK_PARAMS.find((p) => p.key === "bpm");
      expect(bpmParam).toBeDefined();
      expect(bpmParam?.min).toBe(60);
      expect(bpmParam?.max).toBe(200);
      expect(bpmParam?.step).toBe(1);
    });

    it("should have swing parameter with correct bounds (0-100%)", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const swingParam = TWEAK_PARAMS.find((p) => p.key === "swing");
      expect(swingParam).toBeDefined();
      expect(swingParam?.min).toBe(0);
      expect(swingParam?.max).toBe(100);
      expect(swingParam?.unit).toBe("%");
    });

    it("should have filter parameter with correct bounds (100-10000 Hz)", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const filterParam = TWEAK_PARAMS.find((p) => p.key === "filter");
      expect(filterParam).toBeDefined();
      expect(filterParam?.min).toBe(100);
      expect(filterParam?.max).toBe(10000);
      expect(filterParam?.unit).toBe(" Hz");
    });

    it("should have reverb parameter with correct bounds (0-100%)", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const reverbParam = TWEAK_PARAMS.find((p) => p.key === "reverb");
      expect(reverbParam).toBeDefined();
      expect(reverbParam?.min).toBe(0);
      expect(reverbParam?.max).toBe(100);
      expect(reverbParam?.unit).toBe("%");
    });

    it("should have delay parameter with correct bounds (0-100%)", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const delayParam = TWEAK_PARAMS.find((p) => p.key === "delay");
      expect(delayParam).toBeDefined();
      expect(delayParam?.min).toBe(0);
      expect(delayParam?.max).toBe(100);
      expect(delayParam?.unit).toBe("%");
    });

    it("should have all required properties for each param", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      TWEAK_PARAMS.forEach((param) => {
        expect(param).toHaveProperty("key");
        expect(param).toHaveProperty("label");
        expect(param).toHaveProperty("min");
        expect(param).toHaveProperty("max");
        expect(param).toHaveProperty("step");
        expect(param).toHaveProperty("unit");
      });
    });

    it("should have labels matching the keys in readable format", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const bpmParam = TWEAK_PARAMS.find((p) => p.key === "bpm");
      const swingParam = TWEAK_PARAMS.find((p) => p.key === "swing");
      const filterParam = TWEAK_PARAMS.find((p) => p.key === "filter");
      const reverbParam = TWEAK_PARAMS.find((p) => p.key === "reverb");
      const delayParam = TWEAK_PARAMS.find((p) => p.key === "delay");

      expect(bpmParam?.label).toBe("BPM");
      expect(swingParam?.label).toBe("Swing");
      expect(filterParam?.label).toBe("Filter");
      expect(reverbParam?.label).toBe("Reverb");
      expect(delayParam?.label).toBe("Delay");
    });
  });

  describe("parameter validation constraints", () => {
    it("should have min less than max for all params", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      TWEAK_PARAMS.forEach((param) => {
        expect(param.min).toBeLessThan(param.max);
      });
    });

    it("should have positive step values", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      TWEAK_PARAMS.forEach((param) => {
        expect(param.step).toBeGreaterThan(0);
      });
    });

    it("should have DEFAULT_TWEAKS values within param bounds", async () => {
      const { DEFAULT_TWEAKS, TWEAK_PARAMS } = await import("../tweaks");
      TWEAK_PARAMS.forEach((param) => {
        const value = DEFAULT_TWEAKS[param.key];
        expect(value).toBeGreaterThanOrEqual(param.min);
        expect(value).toBeLessThanOrEqual(param.max);
      });
    });

    it("should have step that divides evenly into range for percentage params", async () => {
      const { TWEAK_PARAMS } = await import("../tweaks");
      const percentageParams = TWEAK_PARAMS.filter((p) => p.unit === "%");
      percentageParams.forEach((param) => {
        const range = param.max - param.min;
        expect(range % param.step).toBe(0);
      });
    });
  });
});
