import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  isTutorialCompleted,
  markTutorialCompleted,
  resetTutorial,
  type TutorialStep,
} from "../steps";

describe("Tutorial Steps", () => {
  describe("TUTORIAL_STEPS", () => {
    it("should have at least one step", () => {
      expect(TUTORIAL_STEPS.length).toBeGreaterThan(0);
    });

    it("should have unique ids for all steps", () => {
      const ids = TUTORIAL_STEPS.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required properties on all steps", () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.position).toBeDefined();
        expect(["top", "bottom", "left", "right", "center"]).toContain(step.position);
      }
    });

    it("should start with a welcome step", () => {
      expect(TUTORIAL_STEPS[0].id).toBe("welcome");
      expect(TUTORIAL_STEPS[0].position).toBe("center");
    });

    it("should end with a completion step", () => {
      const lastStep = TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1];
      expect(lastStep.id).toBe("complete");
      expect(lastStep.position).toBe("center");
    });

    it("should have valid target selectors for steps with targets", () => {
      const stepsWithTargets = TUTORIAL_STEPS.filter((step) => step.targetSelector);
      expect(stepsWithTargets.length).toBeGreaterThan(0);

      for (const step of stepsWithTargets) {
        // Target selectors should be valid CSS attribute selectors
        expect(step.targetSelector).toMatch(/\[data-tutorial="[\w-]+"\]/);
      }
    });

    it("should have actions only for steps that need UI changes", () => {
      const validActions = ["show-chat", "show-code", "show-controls"];
      const stepsWithActions = TUTORIAL_STEPS.filter((step) => step.action);

      for (const step of stepsWithActions) {
        expect(validActions).toContain(step.action);
      }
    });
  });

  describe("localStorage functions", () => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();

    beforeEach(() => {
      // Setup localStorage mock
      Object.defineProperty(globalThis, "localStorage", {
        value: localStorageMock,
        writable: true,
      });
      localStorageMock.clear();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe("isTutorialCompleted", () => {
      it("should return false when tutorial is not completed", () => {
        localStorageMock.getItem.mockReturnValue(null);
        expect(isTutorialCompleted()).toBe(false);
      });

      it("should return true when tutorial is completed", () => {
        localStorageMock.getItem.mockReturnValue("true");
        expect(isTutorialCompleted()).toBe(true);
      });

      it("should check the correct localStorage key", () => {
        isTutorialCompleted();
        expect(localStorageMock.getItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY);
      });
    });

    describe("markTutorialCompleted", () => {
      it("should set localStorage to true", () => {
        markTutorialCompleted();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY, "true");
      });
    });

    describe("resetTutorial", () => {
      it("should remove the localStorage key", () => {
        resetTutorial();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY);
      });
    });
  });

  describe("step interface validation", () => {
    it("should allow minimal valid step", () => {
      const minimalStep: TutorialStep = {
        id: "test",
        title: "Test Step",
        description: "Test description",
        position: "center",
      };
      expect(minimalStep.id).toBe("test");
      expect(minimalStep.targetSelector).toBeUndefined();
      expect(minimalStep.action).toBeUndefined();
    });

    it("should allow step with all optional properties", () => {
      const fullStep: TutorialStep = {
        id: "full-test",
        title: "Full Test Step",
        description: "Full test description",
        targetSelector: '[data-tutorial="test"]',
        position: "top",
        action: "show-chat",
        waitForInteraction: true,
      };
      expect(fullStep.targetSelector).toBe('[data-tutorial="test"]');
      expect(fullStep.action).toBe("show-chat");
      expect(fullStep.waitForInteraction).toBe(true);
    });
  });
});
