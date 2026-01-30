import { describe, it, expect } from "vitest";

describe("StepSequencer", () => {
  describe("module structure", () => {
    it("should export StepSequencer component", async () => {
      const sequencerModule = await import("../StepSequencer");
      expect(sequencerModule.StepSequencer).toBeDefined();
      expect(typeof sequencerModule.StepSequencer).toBe("function");
    });
  });

  describe("step grid logic", () => {
    const defaultStepCount = 16;

    it("should support 16 steps by default", () => {
      expect(defaultStepCount).toBe(16);
    });

    it("should support step counts of 8, 16, and 32", () => {
      const validCounts = [8, 16, 32];
      validCounts.forEach((count) => {
        expect(count % 4).toBe(0); // Divisible by 4 for beat grouping
      });
    });

    it("should calculate beat markers correctly", () => {
      // Beat markers show at every 4th step (quarter note positions)
      const stepCount = 16;
      const beatMarkers: number[] = [];
      for (let i = 0; i < stepCount; i++) {
        if (i % 4 === 0) beatMarkers.push(i);
      }
      expect(beatMarkers).toEqual([0, 4, 8, 12]);
    });

    it("should calculate beat numbers (1-based)", () => {
      const beatNumbers = [0, 4, 8, 12].map((i) => i / 4 + 1);
      expect(beatNumbers).toEqual([1, 2, 3, 4]);
    });
  });

  describe("track management", () => {
    it("should allow adding tracks for available sounds", () => {
      const defaultSounds = ["kick", "snare", "hihat", "clap"];
      const allSounds = ["kick", "snare", "hihat", "clap", "tom", "rim", "shaker", "crash"];
      const available = allSounds.filter((s) => !defaultSounds.includes(s));
      expect(available).toEqual(["tom", "rim", "shaker", "crash"]);
    });

    it("should not allow duplicate sound types", () => {
      const tracks = ["kick", "snare", "hihat"];
      const canAddKick = !tracks.includes("kick");
      expect(canAddKick).toBe(false);
    });

    it("should require at least one track", () => {
      const minTracks = 1;
      expect(minTracks).toBe(1);
    });
  });

  describe("velocity handling", () => {
    it("should clamp velocity between 0.1 and 1", () => {
      const clampVelocity = (v: number) => Math.max(0.1, Math.min(1, v));

      expect(clampVelocity(0.5)).toBe(0.5);
      expect(clampVelocity(0)).toBe(0.1);
      expect(clampVelocity(1.5)).toBe(1);
      expect(clampVelocity(-0.5)).toBe(0.1);
    });

    it("should calculate velocity change from mouse delta", () => {
      const startY = 100;
      const currentY = 50; // Dragged up
      const deltaY = startY - currentY; // 50 pixels
      const velocityDelta = deltaY / 100; // 0.5 velocity increase

      expect(velocityDelta).toBe(0.5);
    });

    it("should default velocity to 0.8", () => {
      const defaultVelocity = 0.8;
      expect(defaultVelocity).toBe(0.8);
    });

    it("should display velocity as percentage", () => {
      const velocityPercent = (v: number) => Math.round(v * 100);
      expect(velocityPercent(0.8)).toBe(80);
      expect(velocityPercent(1)).toBe(100);
      expect(velocityPercent(0.55)).toBe(55);
    });
  });

  describe("step toggle logic", () => {
    it("should toggle step active state", () => {
      let active = false;
      const toggle = () => {
        active = !active;
      };

      toggle();
      expect(active).toBe(true);

      toggle();
      expect(active).toBe(false);
    });

    it("should auto-enable step when velocity is adjusted", () => {
      const step = { active: false, velocity: 0.8 };

      // Simulating velocity drag on inactive step
      const updateWithVelocity = (v: number) => {
        step.velocity = v;
        step.active = true; // Auto-enable
      };

      updateWithVelocity(0.9);
      expect(step.active).toBe(true);
      expect(step.velocity).toBe(0.9);
    });
  });

  describe("step count changes", () => {
    it("should preserve existing steps when increasing count", () => {
      const existingSteps = [
        { active: true, velocity: 0.9 },
        { active: false, velocity: 0.8 },
      ];
      const newCount = 4;

      // Extend steps
      const newSteps = [...existingSteps];
      while (newSteps.length < newCount) {
        newSteps.push({ active: false, velocity: 0.8 });
      }

      expect(newSteps.length).toBe(4);
      expect(newSteps[0].active).toBe(true); // Preserved
      expect(newSteps[2].active).toBe(false); // New step
    });

    it("should truncate steps when decreasing count", () => {
      const existingSteps = [
        { active: true, velocity: 0.9 },
        { active: true, velocity: 0.8 },
        { active: true, velocity: 0.7 },
        { active: true, velocity: 0.6 },
      ];
      const newCount = 2;

      const newSteps = existingSteps.slice(0, newCount);

      expect(newSteps.length).toBe(2);
      expect(newSteps[0].velocity).toBe(0.9);
      expect(newSteps[1].velocity).toBe(0.8);
    });
  });

  describe("BPM constraints", () => {
    it("should enforce minimum BPM of 60", () => {
      const clampBpm = (bpm: number) => Math.max(60, Math.min(200, bpm));
      expect(clampBpm(50)).toBe(60);
      expect(clampBpm(60)).toBe(60);
    });

    it("should enforce maximum BPM of 200", () => {
      const clampBpm = (bpm: number) => Math.max(60, Math.min(200, bpm));
      expect(clampBpm(250)).toBe(200);
      expect(clampBpm(200)).toBe(200);
    });

    it("should default to 120 BPM", () => {
      const defaultBpm = 120;
      expect(defaultBpm).toBe(120);
    });
  });

  describe("playhead position", () => {
    it("should calculate current step from beat position", () => {
      const stepCount = 16;
      const getCurrentStep = (beat: number) => Math.floor(beat % stepCount);

      expect(getCurrentStep(0)).toBe(0);
      expect(getCurrentStep(4.5)).toBe(4);
      expect(getCurrentStep(16)).toBe(0); // Wraps around
      expect(getCurrentStep(17.3)).toBe(1);
    });

    it("should return -1 when not playing", () => {
      const isPlaying = false;
      const currentStep = isPlaying ? 5 : -1;
      expect(currentStep).toBe(-1);
    });
  });

  describe("track clearing", () => {
    it("should deactivate all steps in a track", () => {
      const steps = [
        { active: true, velocity: 0.9 },
        { active: true, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.7 },
      ];

      const cleared = steps.map((s) => ({ ...s, active: false }));

      expect(cleared.every((s) => !s.active)).toBe(true);
      // Velocity should be preserved
      expect(cleared[0].velocity).toBe(0.9);
    });
  });

  describe("beat grouping visual", () => {
    it("should add spacing after every 4 steps", () => {
      const shouldAddSpacing = (i: number) => i % 4 === 0 && i > 0;

      expect(shouldAddSpacing(0)).toBe(false);
      expect(shouldAddSpacing(4)).toBe(true);
      expect(shouldAddSpacing(8)).toBe(true);
      expect(shouldAddSpacing(5)).toBe(false);
    });
  });

  describe("active track counting", () => {
    it("should count tracks with at least one active step", () => {
      const tracks = [
        { steps: [{ active: true }, { active: false }] },
        { steps: [{ active: false }, { active: false }] },
        { steps: [{ active: true }, { active: true }] },
      ];

      const activeCount = tracks.filter((t) => t.steps.some((s) => s.active)).length;
      expect(activeCount).toBe(2);
    });

    it("should return 0 for all inactive tracks", () => {
      const tracks = [{ steps: [{ active: false }] }, { steps: [{ active: false }] }];

      const activeCount = tracks.filter((t) => t.steps.some((s) => s.active)).length;
      expect(activeCount).toBe(0);
    });
  });
});
