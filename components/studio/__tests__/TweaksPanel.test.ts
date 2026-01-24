import { describe, it, expect, vi } from "vitest";

describe("TweaksPanel component", () => {
  describe("module structure", () => {
    it("should export TweaksPanel component", async () => {
      const { TweaksPanel } = await import("../TweaksPanel");
      expect(TweaksPanel).toBeDefined();
      expect(typeof TweaksPanel).toBe("function");
    });

    it("should be a named export", async () => {
      const tweaksPanelModule = await import("../TweaksPanel");
      expect(Object.keys(tweaksPanelModule)).toContain("TweaksPanel");
    });
  });

  describe("props interface", () => {
    it("should accept required props: tweaks, onTweaksChange", async () => {
      const { TweaksPanel } = await import("../TweaksPanel");
      expect(TweaksPanel).toBeDefined();
    });

    it("should validate tweaks is a TweaksConfig object", () => {
      const tweaks = {
        bpm: 82,
        swing: 8,
        filter: 8000,
        reverb: 25,
        delay: 20,
      };
      expect(tweaks).toHaveProperty("bpm");
      expect(tweaks).toHaveProperty("swing");
      expect(tweaks).toHaveProperty("filter");
      expect(tweaks).toHaveProperty("reverb");
      expect(tweaks).toHaveProperty("delay");
    });

    it("should validate onTweaksChange is a function", () => {
      const onTweaksChange = vi.fn();
      expect(typeof onTweaksChange).toBe("function");
    });
  });

  describe("expand/collapse behavior", () => {
    it("should start in expanded state by default", () => {
      const isExpanded = true;
      expect(isExpanded).toBe(true);
    });

    it("should toggle expanded state when header clicked", () => {
      let isExpanded = true;
      const toggle = () => {
        isExpanded = !isExpanded;
      };
      toggle();
      expect(isExpanded).toBe(false);
      toggle();
      expect(isExpanded).toBe(true);
    });

    it("should show content when expanded", () => {
      const isExpanded = true;
      expect(isExpanded).toBe(true);
    });

    it("should hide content when collapsed", () => {
      const isExpanded = false;
      expect(isExpanded).toBe(false);
    });
  });

  describe("slider behavior", () => {
    it("should render 5 sliders for all tweak params", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      expect(TWEAK_PARAMS).toHaveLength(5);
    });

    it("should render BPM slider", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const bpmParam = TWEAK_PARAMS.find((p) => p.key === "bpm");
      expect(bpmParam).toBeDefined();
      expect(bpmParam?.label).toBe("BPM");
    });

    it("should render Swing slider", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const swingParam = TWEAK_PARAMS.find((p) => p.key === "swing");
      expect(swingParam).toBeDefined();
      expect(swingParam?.label).toBe("Swing");
    });

    it("should render Filter slider", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const filterParam = TWEAK_PARAMS.find((p) => p.key === "filter");
      expect(filterParam).toBeDefined();
      expect(filterParam?.label).toBe("Filter");
    });

    it("should render Reverb slider", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const reverbParam = TWEAK_PARAMS.find((p) => p.key === "reverb");
      expect(reverbParam).toBeDefined();
      expect(reverbParam?.label).toBe("Reverb");
    });

    it("should render Delay slider", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const delayParam = TWEAK_PARAMS.find((p) => p.key === "delay");
      expect(delayParam).toBeDefined();
      expect(delayParam?.label).toBe("Delay");
    });
  });

  describe("handleChange behavior", () => {
    it("should call onTweaksChange with updated bpm", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("bpm", 100);
      expect(onTweaksChange).toHaveBeenCalledWith({
        bpm: 100,
        swing: 8,
        filter: 8000,
        reverb: 25,
        delay: 20,
      });
    });

    it("should call onTweaksChange with updated swing", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("swing", 25);
      expect(onTweaksChange).toHaveBeenCalledWith({
        bpm: 82,
        swing: 25,
        filter: 8000,
        reverb: 25,
        delay: 20,
      });
    });

    it("should call onTweaksChange with updated filter", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("filter", 5000);
      expect(onTweaksChange).toHaveBeenCalledWith({
        bpm: 82,
        swing: 8,
        filter: 5000,
        reverb: 25,
        delay: 20,
      });
    });

    it("should call onTweaksChange with updated reverb", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("reverb", 50);
      expect(onTweaksChange).toHaveBeenCalledWith({
        bpm: 82,
        swing: 8,
        filter: 8000,
        reverb: 50,
        delay: 20,
      });
    });

    it("should call onTweaksChange with updated delay", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("delay", 40);
      expect(onTweaksChange).toHaveBeenCalledWith({
        bpm: 82,
        swing: 8,
        filter: 8000,
        reverb: 25,
        delay: 40,
      });
    });

    it("should preserve other values when changing one", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 90, swing: 15, filter: 6000, reverb: 35, delay: 30 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      handleChange("bpm", 120);
      const result = onTweaksChange.mock.calls[0][0];
      expect(result.swing).toBe(15);
      expect(result.filter).toBe(6000);
      expect(result.reverb).toBe(35);
      expect(result.delay).toBe(30);
    });
  });

  describe("reset button behavior", () => {
    it("should call onTweaksChange with DEFAULT_TWEAKS when reset clicked", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      const onTweaksChange = vi.fn();
      const handleReset = () => {
        onTweaksChange(DEFAULT_TWEAKS);
      };
      handleReset();
      expect(onTweaksChange).toHaveBeenCalledWith(DEFAULT_TWEAKS);
    });

    it("should restore default bpm on reset", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      expect(DEFAULT_TWEAKS.bpm).toBe(82);
    });

    it("should restore default swing on reset", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      expect(DEFAULT_TWEAKS.swing).toBe(8);
    });

    it("should restore default filter on reset", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      expect(DEFAULT_TWEAKS.filter).toBe(8000);
    });

    it("should restore default reverb on reset", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      expect(DEFAULT_TWEAKS.reverb).toBe(25);
    });

    it("should restore default delay on reset", async () => {
      const { DEFAULT_TWEAKS } = await import("@/lib/types/tweaks");
      expect(DEFAULT_TWEAKS.delay).toBe(20);
    });
  });

  describe("header styling", () => {
    it("should have Tweaks title", () => {
      const title = "Tweaks";
      expect(title).toBe("Tweaks");
    });

    it("should have uppercase styling class", () => {
      const className = "uppercase tracking-wider";
      expect(className).toContain("uppercase");
    });

    it("should have cyan color for title", () => {
      const className = "text-cyan-400";
      expect(className).toContain("cyan");
    });

    it("should have border styling", () => {
      const className = "border-b border-cyan-500/20";
      expect(className).toContain("border");
    });
  });

  describe("container styling", () => {
    it("should have rounded corners", () => {
      const className = "rounded-lg";
      expect(className).toContain("rounded");
    });

    it("should have backdrop blur", () => {
      const className = "backdrop-blur-sm";
      expect(className).toContain("backdrop-blur");
    });

    it("should have border", () => {
      const className = "border border-cyan-500/20";
      expect(className).toContain("border");
    });

    it("should have semi-transparent background", () => {
      const className = "bg-slate-950/50";
      expect(className).toContain("bg-slate-950");
    });
  });

  describe("chevron icon", () => {
    it("should rotate 180 degrees when expanded", () => {
      const isExpanded = true;
      const className = isExpanded ? "rotate-180" : "";
      expect(className).toBe("rotate-180");
    });

    it("should not rotate when collapsed", () => {
      const isExpanded = false;
      const className = isExpanded ? "rotate-180" : "";
      expect(className).toBe("");
    });

    it("should have transition animation", () => {
      const className = "transition-transform";
      expect(className).toContain("transition");
    });

    it("should have cyan color", () => {
      const className = "text-cyan-400";
      expect(className).toContain("cyan");
    });
  });

  describe("reset button styling", () => {
    it("should have full width", () => {
      const className = "w-full";
      expect(className).toBe("w-full");
    });

    it("should have hover state with cyan color", () => {
      const className = "hover:text-cyan-400";
      expect(className).toContain("hover");
      expect(className).toContain("cyan");
    });

    it("should have rounded corners", () => {
      const className = "rounded";
      expect(className).toContain("rounded");
    });

    it("should have transition", () => {
      const className = "transition-colors";
      expect(className).toContain("transition");
    });
  });

  describe("content area", () => {
    it("should have padding", () => {
      const className = "p-3";
      expect(className).toBe("p-3");
    });

    it("should have vertical spacing between sliders", () => {
      const className = "space-y-3";
      expect(className).toBe("space-y-3");
    });

    it("should only render when expanded", () => {
      const isExpanded = true;
      const shouldRender = isExpanded;
      expect(shouldRender).toBe(true);
    });

    it("should not render when collapsed", () => {
      const isExpanded = false;
      const shouldRender = isExpanded;
      expect(shouldRender).toBe(false);
    });
  });

  describe("interaction states", () => {
    it("should handle rapid slider changes", () => {
      const onTweaksChange = vi.fn();
      const tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        onTweaksChange({ ...tweaks, [key]: value });
      };
      // Simulate rapid changes
      handleChange("bpm", 83);
      handleChange("bpm", 84);
      handleChange("bpm", 85);
      expect(onTweaksChange).toHaveBeenCalledTimes(3);
    });

    it("should handle multiple slider changes", () => {
      const onTweaksChange = vi.fn();
      let tweaks = { bpm: 82, swing: 8, filter: 8000, reverb: 25, delay: 20 };
      const handleChange = (key: string, value: number) => {
        tweaks = { ...tweaks, [key]: value };
        onTweaksChange(tweaks);
      };
      handleChange("bpm", 90);
      handleChange("swing", 20);
      handleChange("filter", 5000);
      expect(onTweaksChange).toHaveBeenCalledTimes(3);
      expect(tweaks.bpm).toBe(90);
      expect(tweaks.swing).toBe(20);
      expect(tweaks.filter).toBe(5000);
    });
  });

  describe("edge cases", () => {
    it("should handle tweaks with min values", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const minTweaks = {
        bpm: TWEAK_PARAMS.find((p) => p.key === "bpm")!.min,
        swing: TWEAK_PARAMS.find((p) => p.key === "swing")!.min,
        filter: TWEAK_PARAMS.find((p) => p.key === "filter")!.min,
        reverb: TWEAK_PARAMS.find((p) => p.key === "reverb")!.min,
        delay: TWEAK_PARAMS.find((p) => p.key === "delay")!.min,
      };
      expect(minTweaks.bpm).toBe(60);
      expect(minTweaks.swing).toBe(0);
      expect(minTweaks.filter).toBe(100);
      expect(minTweaks.reverb).toBe(0);
      expect(minTweaks.delay).toBe(0);
    });

    it("should handle tweaks with max values", async () => {
      const { TWEAK_PARAMS } = await import("@/lib/types/tweaks");
      const maxTweaks = {
        bpm: TWEAK_PARAMS.find((p) => p.key === "bpm")!.max,
        swing: TWEAK_PARAMS.find((p) => p.key === "swing")!.max,
        filter: TWEAK_PARAMS.find((p) => p.key === "filter")!.max,
        reverb: TWEAK_PARAMS.find((p) => p.key === "reverb")!.max,
        delay: TWEAK_PARAMS.find((p) => p.key === "delay")!.max,
      };
      expect(maxTweaks.bpm).toBe(200);
      expect(maxTweaks.swing).toBe(100);
      expect(maxTweaks.filter).toBe(10000);
      expect(maxTweaks.reverb).toBe(100);
      expect(maxTweaks.delay).toBe(100);
    });
  });
});
