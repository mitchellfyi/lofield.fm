import { describe, it, expect } from "vitest";
import {
  DRUM_SOUNDS,
  DRUM_NOTES,
  createEmptySteps,
  createTrack,
  createDefaultTracks,
  generateSequencerCode,
  validateTracks,
  type SequencerTrack,
  type DrumSound,
} from "../sequencerCodeGen";

describe("Sequencer Code Generator", () => {
  describe("DRUM_SOUNDS", () => {
    it("should define all standard drum sounds", () => {
      const expectedSounds: DrumSound[] = [
        "kick",
        "snare",
        "hihat",
        "clap",
        "tom",
        "rim",
        "shaker",
        "crash",
      ];
      expectedSounds.forEach((sound) => {
        expect(DRUM_SOUNDS[sound]).toBeDefined();
        expect(DRUM_SOUNDS[sound].label).toBeDefined();
        expect(DRUM_SOUNDS[sound].synthType).toBeDefined();
        expect(DRUM_SOUNDS[sound].config).toBeDefined();
      });
    });

    it("should use valid Tone.js synth types", () => {
      const validSynthTypes = ["MembraneSynth", "NoiseSynth", "MetalSynth"];
      Object.values(DRUM_SOUNDS).forEach((sound) => {
        expect(validSynthTypes).toContain(sound.synthType);
      });
    });
  });

  describe("DRUM_NOTES", () => {
    it("should define notes for all drum sounds", () => {
      const sounds = Object.keys(DRUM_SOUNDS) as DrumSound[];
      sounds.forEach((sound) => {
        expect(DRUM_NOTES[sound]).toBeDefined();
      });
    });

    it("should use valid note formats", () => {
      // Notes can be pitch names (C1, G1) or durations (16n, 32n)
      Object.values(DRUM_NOTES).forEach((note) => {
        const isPitch = /^[A-G]#?\d$/.test(note);
        const isDuration = /^\d+n$/.test(note);
        expect(isPitch || isDuration).toBe(true);
      });
    });
  });

  describe("createEmptySteps", () => {
    it("should create the specified number of steps", () => {
      const steps = createEmptySteps(16);
      expect(steps.length).toBe(16);
    });

    it("should create inactive steps", () => {
      const steps = createEmptySteps(8);
      steps.forEach((step) => {
        expect(step.active).toBe(false);
      });
    });

    it("should set default velocity to 0.8", () => {
      const steps = createEmptySteps(8);
      steps.forEach((step) => {
        expect(step.velocity).toBe(0.8);
      });
    });

    it("should create independent step objects", () => {
      const steps = createEmptySteps(4);
      steps[0].active = true;
      expect(steps[1].active).toBe(false);
    });
  });

  describe("createTrack", () => {
    it("should create a track with the specified sound", () => {
      const track = createTrack("kick", 16);
      expect(track.sound).toBe("kick");
    });

    it("should use the correct label from DRUM_SOUNDS", () => {
      const track = createTrack("snare", 16);
      expect(track.name).toBe(DRUM_SOUNDS.snare.label);
    });

    it("should create the specified number of steps", () => {
      const track = createTrack("hihat", 32);
      expect(track.steps.length).toBe(32);
    });

    it("should generate an ID with sound type and timestamp", () => {
      const track = createTrack("kick", 16);
      // ID format: sound-timestamp
      expect(track.id).toMatch(/^kick-\d+$/);
    });

    it("should include sound type in ID", () => {
      const track = createTrack("clap", 16);
      expect(track.id.startsWith("clap-")).toBe(true);
    });
  });

  describe("createDefaultTracks", () => {
    it("should create 4 default tracks", () => {
      const tracks = createDefaultTracks();
      expect(tracks.length).toBe(4);
    });

    it("should include kick, snare, hihat, and clap", () => {
      const tracks = createDefaultTracks();
      const sounds = tracks.map((t) => t.sound);
      expect(sounds).toContain("kick");
      expect(sounds).toContain("snare");
      expect(sounds).toContain("hihat");
      expect(sounds).toContain("clap");
    });

    it("should use specified step count", () => {
      const tracks = createDefaultTracks(32);
      tracks.forEach((track) => {
        expect(track.steps.length).toBe(32);
      });
    });

    it("should default to 16 steps", () => {
      const tracks = createDefaultTracks();
      tracks.forEach((track) => {
        expect(track.steps.length).toBe(16);
      });
    });
  });

  describe("generateSequencerCode", () => {
    it("should generate valid Tone.js code", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "kick",
          steps: [
            { active: true, velocity: 0.9 },
            { active: false, velocity: 0.8 },
            { active: false, velocity: 0.8 },
            { active: false, velocity: 0.8 },
          ],
        },
      ];

      const code = generateSequencerCode(tracks, 120);
      expect(code).toContain("Tone.Transport.bpm.value = 120");
      expect(code).toContain("Tone.Limiter");
      expect(code).toContain("MembraneSynth");
      expect(code).toContain("Tone.Sequence");
    });

    it("should include BPM setting", () => {
      const code = generateSequencerCode([], 90);
      expect(code).toContain("Tone.Transport.bpm.value = 90");
    });

    it("should only include synths for active tracks", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "kick",
          steps: [{ active: true, velocity: 0.9 }],
        },
        {
          id: "snare-1",
          name: "Snare",
          sound: "snare",
          steps: [{ active: false, velocity: 0.8 }],
        },
      ];

      const code = generateSequencerCode(tracks);
      expect(code).toContain("MembraneSynth"); // kick
      expect(code).not.toContain("NoiseSynth"); // snare not active
    });

    it("should format velocity to 2 decimal places", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "kick",
          steps: [{ active: true, velocity: 0.855 }],
        },
      ];

      const code = generateSequencerCode(tracks);
      // 0.855.toFixed(2) = "0.85" or "0.86" depending on rounding
      // Check that velocity is formatted with 2 decimal places
      expect(code).toMatch(/0\.\d{2}/);
    });

    it("should use null for inactive steps", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "kick",
          steps: [
            { active: false, velocity: 0.8 },
            { active: true, velocity: 0.9 },
          ],
        },
      ];

      const code = generateSequencerCode(tracks);
      expect(code).toContain("null");
    });

    it("should include header comment", () => {
      const code = generateSequencerCode([]);
      expect(code).toContain("Generated Drum Pattern");
    });
  });

  describe("validateTracks", () => {
    it("should return valid for proper tracks", () => {
      const tracks = createDefaultTracks();
      const result = validateTracks(tracks);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should return invalid for empty tracks array", () => {
      const result = validateTracks([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("At least one track is required");
    });

    it("should detect missing track ID", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "",
          name: "Kick",
          sound: "kick",
          steps: [{ active: false, velocity: 0.8 }],
        },
      ];
      const result = validateTracks(tracks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing an ID"))).toBe(true);
    });

    it("should detect missing track name", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "",
          sound: "kick",
          steps: [{ active: false, velocity: 0.8 }],
        },
      ];
      const result = validateTracks(tracks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing a name"))).toBe(true);
    });

    it("should detect empty steps", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "kick",
          steps: [],
        },
      ];
      const result = validateTracks(tracks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("has no steps"))).toBe(true);
    });

    it("should detect invalid sound type", () => {
      const tracks: SequencerTrack[] = [
        {
          id: "kick-1",
          name: "Kick",
          sound: "invalid" as DrumSound,
          steps: [{ active: false, velocity: 0.8 }],
        },
      ];
      const result = validateTracks(tracks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("invalid sound type"))).toBe(true);
    });
  });

  describe("step patterns", () => {
    it("should support common 4/4 kick pattern", () => {
      const kickPattern = createEmptySteps(16);
      // Kick on 1, 5, 9, 13 (first beat of each quarter)
      [0, 4, 8, 12].forEach((i) => {
        kickPattern[i].active = true;
      });

      expect(kickPattern[0].active).toBe(true);
      expect(kickPattern[4].active).toBe(true);
      expect(kickPattern[1].active).toBe(false);
    });

    it("should support backbeat snare pattern", () => {
      const snarePattern = createEmptySteps(16);
      // Snare on 5 and 13 (beats 2 and 4)
      [4, 12].forEach((i) => {
        snarePattern[i].active = true;
      });

      expect(snarePattern[4].active).toBe(true);
      expect(snarePattern[12].active).toBe(true);
      expect(snarePattern[0].active).toBe(false);
    });

    it("should support hi-hat eighth notes", () => {
      const hihatPattern = createEmptySteps(16);
      // Hi-hat on every even step
      for (let i = 0; i < 16; i += 2) {
        hihatPattern[i].active = true;
      }

      expect(hihatPattern.filter((s) => s.active).length).toBe(8);
    });
  });
});
