import { describe, it, expect } from "vitest";

describe("TutorialOverlay", () => {
  describe("module structure", () => {
    it("should export TutorialOverlay component", async () => {
      const overlayModule = await import("../TutorialOverlay");
      expect(overlayModule.TutorialOverlay).toBeDefined();
      expect(typeof overlayModule.TutorialOverlay).toBe("function");
    });

    it("should be a named export", async () => {
      const overlayModule = await import("../TutorialOverlay");
      expect(Object.keys(overlayModule)).toContain("TutorialOverlay");
    });
  });

  describe("tooltip position calculation", () => {
    // Test the position calculation logic
    // This mirrors the internal calculatePosition function

    interface TooltipPosition {
      top: number;
      left: number;
      arrow: "top" | "bottom" | "left" | "right" | "none";
    }

    function calculatePosition(
      target: DOMRect | null,
      position: "top" | "bottom" | "left" | "right" | "center",
      tooltipWidth: number,
      tooltipHeight: number
    ): TooltipPosition {
      const padding = 16;
      const arrowSize = 8;
      const windowWidth = 1024;
      const windowHeight = 768;

      // Center position (no target)
      if (!target || position === "center") {
        return {
          top: windowHeight / 2 - tooltipHeight / 2,
          left: windowWidth / 2 - tooltipWidth / 2,
          arrow: "none",
        };
      }

      let top = 0;
      let left = 0;
      let arrow: TooltipPosition["arrow"] = "none";

      switch (position) {
        case "top":
          top = target.top - tooltipHeight - padding - arrowSize;
          left = target.left + target.width / 2 - tooltipWidth / 2;
          arrow = "bottom";
          break;
        case "bottom":
          top = target.bottom + padding + arrowSize;
          left = target.left + target.width / 2 - tooltipWidth / 2;
          arrow = "top";
          break;
        case "left":
          top = target.top + target.height / 2 - tooltipHeight / 2;
          left = target.left - tooltipWidth - padding - arrowSize;
          arrow = "right";
          break;
        case "right":
          top = target.top + target.height / 2 - tooltipHeight / 2;
          left = target.right + padding + arrowSize;
          arrow = "left";
          break;
      }

      // Clamp to viewport
      top = Math.max(padding, Math.min(windowHeight - tooltipHeight - padding, top));
      left = Math.max(padding, Math.min(windowWidth - tooltipWidth - padding, left));

      return { top, left, arrow };
    }

    it("should center tooltip when no target is provided", () => {
      const result = calculatePosition(null, "center", 320, 200);
      expect(result.top).toBe(284); // (768 - 200) / 2
      expect(result.left).toBe(352); // (1024 - 320) / 2
      expect(result.arrow).toBe("none");
    });

    it("should center tooltip for center position regardless of target", () => {
      const target = {
        top: 100,
        left: 100,
        width: 50,
        height: 50,
        bottom: 150,
        right: 150,
      } as DOMRect;
      const result = calculatePosition(target, "center", 320, 200);
      expect(result.arrow).toBe("none");
      expect(result.top).toBe(284);
    });

    it("should position tooltip above target for top position", () => {
      const target = {
        top: 300,
        left: 400,
        width: 100,
        height: 50,
        bottom: 350,
        right: 500,
      } as DOMRect;
      const result = calculatePosition(target, "top", 320, 200);
      expect(result.arrow).toBe("bottom"); // Arrow points down to target
      expect(result.top).toBeLessThan(target.top);
    });

    it("should position tooltip below target for bottom position", () => {
      const target = {
        top: 100,
        left: 400,
        width: 100,
        height: 50,
        bottom: 150,
        right: 500,
      } as DOMRect;
      const result = calculatePosition(target, "bottom", 320, 200);
      expect(result.arrow).toBe("top"); // Arrow points up to target
      expect(result.top).toBeGreaterThan(target.bottom);
    });

    it("should position tooltip to the left of target for left position", () => {
      const target = {
        top: 300,
        left: 600,
        width: 100,
        height: 50,
        bottom: 350,
        right: 700,
      } as DOMRect;
      const result = calculatePosition(target, "left", 200, 100);
      expect(result.arrow).toBe("right"); // Arrow points right to target
      expect(result.left + 200).toBeLessThan(target.left);
    });

    it("should position tooltip to the right of target for right position", () => {
      const target = {
        top: 300,
        left: 100,
        width: 100,
        height: 50,
        bottom: 350,
        right: 200,
      } as DOMRect;
      const result = calculatePosition(target, "right", 200, 100);
      expect(result.arrow).toBe("left"); // Arrow points left to target
      expect(result.left).toBeGreaterThan(target.right);
    });

    it("should clamp tooltip to viewport bounds", () => {
      // Target near edge of screen
      const target = { top: 10, left: 10, width: 50, height: 50, bottom: 60, right: 60 } as DOMRect;
      const result = calculatePosition(target, "top", 320, 200);

      // Should be clamped to minimum padding
      expect(result.top).toBeGreaterThanOrEqual(16);
      expect(result.left).toBeGreaterThanOrEqual(16);
    });

    it("should center tooltip horizontally on target for top/bottom positions", () => {
      const target = {
        top: 300,
        left: 400,
        width: 100,
        height: 50,
        bottom: 350,
        right: 500,
      } as DOMRect;
      const tooltipWidth = 200;
      const result = calculatePosition(target, "bottom", tooltipWidth, 100);

      // Tooltip should be centered on target
      const targetCenter = target.left + target.width / 2;
      const tooltipCenter = result.left + tooltipWidth / 2;
      expect(tooltipCenter).toBeCloseTo(targetCenter, 0);
    });

    it("should center tooltip vertically on target for left/right positions", () => {
      const target = {
        top: 300,
        left: 400,
        width: 100,
        height: 100,
        bottom: 400,
        right: 500,
      } as DOMRect;
      const tooltipHeight = 80;
      const result = calculatePosition(target, "right", 200, tooltipHeight);

      // Tooltip should be centered on target
      const targetCenter = target.top + target.height / 2;
      const tooltipCenter = result.top + tooltipHeight / 2;
      expect(tooltipCenter).toBeCloseTo(targetCenter, 0);
    });
  });

  describe("step navigation logic", () => {
    const TUTORIAL_STEPS_COUNT = 7; // From the actual implementation

    it("should identify first step correctly", () => {
      const isFirstStep = (currentStep: number) => currentStep === 0;
      expect(isFirstStep(0)).toBe(true);
      expect(isFirstStep(1)).toBe(false);
    });

    it("should identify last step correctly", () => {
      const isLastStep = (currentStep: number) => currentStep === TUTORIAL_STEPS_COUNT - 1;
      expect(isLastStep(TUTORIAL_STEPS_COUNT - 1)).toBe(true);
      expect(isLastStep(0)).toBe(false);
      expect(isLastStep(TUTORIAL_STEPS_COUNT - 2)).toBe(false);
    });

    it("should navigate forward correctly", () => {
      let currentStep = 0;
      const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS_COUNT - 1) {
          currentStep += 1;
        }
      };

      handleNext();
      expect(currentStep).toBe(1);

      // Go to last step
      currentStep = TUTORIAL_STEPS_COUNT - 2;
      handleNext();
      expect(currentStep).toBe(TUTORIAL_STEPS_COUNT - 1);

      // Should not exceed last step
      handleNext();
      expect(currentStep).toBe(TUTORIAL_STEPS_COUNT - 1);
    });

    it("should navigate backward correctly", () => {
      let currentStep = 3;
      const handlePrev = () => {
        if (currentStep > 0) {
          currentStep -= 1;
        }
      };

      handlePrev();
      expect(currentStep).toBe(2);

      // Go to first step
      currentStep = 1;
      handlePrev();
      expect(currentStep).toBe(0);

      // Should not go below first step
      handlePrev();
      expect(currentStep).toBe(0);
    });
  });

  describe("highlight rect calculation", () => {
    it("should add padding to target rect", () => {
      const targetRect = { top: 100, left: 200, width: 150, height: 50 };
      const padding = 8;

      const highlightRect = {
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      };

      expect(highlightRect.top).toBe(92);
      expect(highlightRect.left).toBe(192);
      expect(highlightRect.width).toBe(166);
      expect(highlightRect.height).toBe(66);
    });
  });
});
