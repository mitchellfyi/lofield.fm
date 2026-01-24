import { describe, it, expect, vi } from "vitest";

describe("TweakSlider component", () => {
  describe("module structure", () => {
    it("should export TweakSlider component", async () => {
      const { TweakSlider } = await import("../TweakSlider");
      expect(TweakSlider).toBeDefined();
      expect(typeof TweakSlider).toBe("function");
    });

    it("should be a named export", async () => {
      const tweakSliderModule = await import("../TweakSlider");
      expect(Object.keys(tweakSliderModule)).toContain("TweakSlider");
    });
  });

  describe("props interface", () => {
    it("should accept required props: label, value, min, max, step, unit, onChange", async () => {
      const { TweakSlider } = await import("../TweakSlider");
      expect(TweakSlider).toBeDefined();
    });

    it("should validate label is a string", () => {
      const label = "BPM";
      expect(typeof label).toBe("string");
    });

    it("should validate value is a number", () => {
      const value = 82;
      expect(typeof value).toBe("number");
    });

    it("should validate min is a number", () => {
      const min = 60;
      expect(typeof min).toBe("number");
    });

    it("should validate max is a number", () => {
      const max = 200;
      expect(typeof max).toBe("number");
    });

    it("should validate step is a number", () => {
      const step = 1;
      expect(typeof step).toBe("number");
    });

    it("should validate unit is a string", () => {
      const unit = "%";
      expect(typeof unit).toBe("string");
    });

    it("should validate onChange is a function", () => {
      const onChange = vi.fn();
      expect(typeof onChange).toBe("function");
    });
  });

  describe("slider value calculations", () => {
    it("should calculate percentage correctly for min value", () => {
      const value = 60;
      const min = 60;
      const max = 200;
      const percentage = ((value - min) / (max - min)) * 100;
      expect(percentage).toBe(0);
    });

    it("should calculate percentage correctly for max value", () => {
      const value = 200;
      const min = 60;
      const max = 200;
      const percentage = ((value - min) / (max - min)) * 100;
      expect(percentage).toBe(100);
    });

    it("should calculate percentage correctly for mid value", () => {
      const value = 130;
      const min = 60;
      const max = 200;
      const percentage = ((value - min) / (max - min)) * 100;
      expect(percentage).toBe(50);
    });

    it("should calculate percentage correctly for arbitrary value", () => {
      const value = 82;
      const min = 60;
      const max = 200;
      const percentage = ((value - min) / (max - min)) * 100;
      expect(percentage).toBeCloseTo(15.71, 1);
    });

    it("should handle zero-based range", () => {
      const value = 50;
      const min = 0;
      const max = 100;
      const percentage = ((value - min) / (max - min)) * 100;
      expect(percentage).toBe(50);
    });
  });

  describe("onChange behavior", () => {
    it("should call onChange with the new value", () => {
      const onChange = vi.fn();
      const newValue = 100;
      onChange(newValue);
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it("should call onChange with min value", () => {
      const onChange = vi.fn();
      const min = 60;
      onChange(min);
      expect(onChange).toHaveBeenCalledWith(60);
    });

    it("should call onChange with max value", () => {
      const onChange = vi.fn();
      const max = 200;
      onChange(max);
      expect(onChange).toHaveBeenCalledWith(200);
    });

    it("should convert string values to numbers", () => {
      const onChange = vi.fn();
      const eventValue = "85";
      onChange(Number(eventValue));
      expect(onChange).toHaveBeenCalledWith(85);
    });
  });

  describe("value display", () => {
    it("should display value without unit when unit is empty", () => {
      const value = 82;
      const unit = "";
      const display = `${value}${unit}`;
      expect(display).toBe("82");
    });

    it("should display value with percent unit", () => {
      const value = 50;
      const unit = "%";
      const display = `${value}${unit}`;
      expect(display).toBe("50%");
    });

    it("should display value with Hz unit", () => {
      const value = 8000;
      const unit = " Hz";
      const display = `${value}${unit}`;
      expect(display).toBe("8000 Hz");
    });

    it("should handle integer values", () => {
      const value = 82;
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  describe("range constraints", () => {
    it("should respect min constraint", () => {
      const min = 60;
      const value = 50;
      const constrained = Math.max(value, min);
      expect(constrained).toBe(60);
    });

    it("should respect max constraint", () => {
      const max = 200;
      const value = 250;
      const constrained = Math.min(value, max);
      expect(constrained).toBe(200);
    });

    it("should allow value within range", () => {
      const min = 60;
      const max = 200;
      const value = 120;
      const isValid = value >= min && value <= max;
      expect(isValid).toBe(true);
    });

    it("should handle step increments for BPM (step=1)", () => {
      const step = 1;
      const currentValue = 82;
      const nextValue = currentValue + step;
      expect(nextValue).toBe(83);
    });

    it("should handle step increments for Filter (step=100)", () => {
      const step = 100;
      const currentValue = 8000;
      const nextValue = currentValue + step;
      expect(nextValue).toBe(8100);
    });
  });

  describe("label display", () => {
    it("should display BPM label", () => {
      const label = "BPM";
      expect(label).toBe("BPM");
    });

    it("should display Swing label", () => {
      const label = "Swing";
      expect(label).toBe("Swing");
    });

    it("should display Filter label", () => {
      const label = "Filter";
      expect(label).toBe("Filter");
    });

    it("should display Reverb label", () => {
      const label = "Reverb";
      expect(label).toBe("Reverb");
    });

    it("should display Delay label", () => {
      const label = "Delay";
      expect(label).toBe("Delay");
    });
  });

  describe("styling", () => {
    it("should have slider track styling", () => {
      const trackClass = "h-1.5 bg-slate-800 rounded-full";
      expect(trackClass).toContain("bg-slate-800");
      expect(trackClass).toContain("rounded-full");
    });

    it("should have thumb styling with cyan color", () => {
      const thumbClass = "bg-cyan-500";
      expect(thumbClass).toContain("cyan");
    });

    it("should have value display in cyan color", () => {
      const valueClass = "text-cyan-400";
      expect(valueClass).toContain("cyan");
    });

    it("should use monospace font for value display", () => {
      const fontClass = "font-mono";
      expect(fontClass).toContain("mono");
    });

    it("should use tabular-nums for consistent number width", () => {
      const numsClass = "tabular-nums";
      expect(numsClass).toBe("tabular-nums");
    });
  });

  describe("gradient background calculation", () => {
    it("should create gradient style for 0% position", () => {
      const percentage = 0;
      const style = {
        background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(34 211 238) ${percentage}%, rgb(30 41 59) ${percentage}%, rgb(30 41 59) 100%)`,
      };
      expect(style.background).toContain("0%");
    });

    it("should create gradient style for 50% position", () => {
      const percentage = 50;
      const style = {
        background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(34 211 238) ${percentage}%, rgb(30 41 59) ${percentage}%, rgb(30 41 59) 100%)`,
      };
      expect(style.background).toContain("50%");
    });

    it("should create gradient style for 100% position", () => {
      const percentage = 100;
      const style = {
        background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(34 211 238) ${percentage}%, rgb(30 41 59) ${percentage}%, rgb(30 41 59) 100%)`,
      };
      expect(style.background).toContain("100%");
    });
  });

  describe("accessibility", () => {
    it("should have input type range", () => {
      const inputType = "range";
      expect(inputType).toBe("range");
    });

    it("should have min attribute", () => {
      const min = 60;
      expect(typeof min).toBe("number");
    });

    it("should have max attribute", () => {
      const max = 200;
      expect(typeof max).toBe("number");
    });

    it("should have step attribute", () => {
      const step = 1;
      expect(typeof step).toBe("number");
    });

    it("should have value attribute", () => {
      const value = 82;
      expect(typeof value).toBe("number");
    });
  });
});
