import { describe, it, expect } from "vitest";
import {
  midiToFrequency,
  midiToNoteName,
  isMIDISupported,
  type MIDINoteEvent,
  type MIDICCEvent,
} from "../useMIDI";

describe("useMIDI utilities", () => {
  describe("midiToFrequency", () => {
    it("should return 440 Hz for A4 (MIDI note 69)", () => {
      expect(midiToFrequency(69)).toBe(440);
    });

    it("should return 261.63 Hz for middle C (MIDI note 60)", () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
    });

    it("should double frequency for each octave", () => {
      const a4 = midiToFrequency(69);
      const a5 = midiToFrequency(81);
      expect(a5).toBeCloseTo(a4 * 2, 5);
    });

    it("should halve frequency for each octave down", () => {
      const a4 = midiToFrequency(69);
      const a3 = midiToFrequency(57);
      expect(a3).toBeCloseTo(a4 / 2, 5);
    });

    it("should handle extreme low notes", () => {
      const freq = midiToFrequency(0);
      expect(freq).toBeCloseTo(8.18, 1);
    });

    it("should handle extreme high notes", () => {
      const freq = midiToFrequency(127);
      expect(freq).toBeCloseTo(12543.85, 0);
    });
  });

  describe("midiToNoteName", () => {
    it("should convert A4 (69) to A4", () => {
      expect(midiToNoteName(69)).toBe("A4");
    });

    it("should convert middle C (60) to C4", () => {
      expect(midiToNoteName(60)).toBe("C4");
    });

    it("should convert C#4 (61) to C#4", () => {
      expect(midiToNoteName(61)).toBe("C#4");
    });

    it("should convert B3 (59) to B3", () => {
      expect(midiToNoteName(59)).toBe("B3");
    });

    it("should handle all semitones in an octave", () => {
      const expected = [
        "C4",
        "C#4",
        "D4",
        "D#4",
        "E4",
        "F4",
        "F#4",
        "G4",
        "G#4",
        "A4",
        "A#4",
        "B4",
      ];
      for (let i = 0; i < 12; i++) {
        expect(midiToNoteName(60 + i)).toBe(expected[i]);
      }
    });

    it("should handle negative octaves (C-1 is MIDI 0)", () => {
      expect(midiToNoteName(0)).toBe("C-1");
    });

    it("should handle high octaves", () => {
      expect(midiToNoteName(120)).toBe("C9");
    });
  });

  describe("isMIDISupported", () => {
    it("should return false in test environment (no navigator.requestMIDIAccess)", () => {
      expect(isMIDISupported()).toBe(false);
    });
  });

  describe("MIDINoteEvent interface", () => {
    it("should accept valid note on event", () => {
      const event: MIDINoteEvent = {
        type: "noteon",
        note: 60,
        velocity: 0.8,
        channel: 0,
        timestamp: 1000,
      };
      expect(event.type).toBe("noteon");
      expect(event.note).toBe(60);
      expect(event.velocity).toBe(0.8);
    });

    it("should accept valid note off event", () => {
      const event: MIDINoteEvent = {
        type: "noteoff",
        note: 60,
        velocity: 0,
        channel: 0,
        timestamp: 1000,
      };
      expect(event.type).toBe("noteoff");
      expect(event.velocity).toBe(0);
    });

    it("should validate channel range", () => {
      const event: MIDINoteEvent = {
        type: "noteon",
        note: 60,
        velocity: 0.5,
        channel: 15, // Max channel
        timestamp: 0,
      };
      expect(event.channel).toBeLessThanOrEqual(15);
      expect(event.channel).toBeGreaterThanOrEqual(0);
    });
  });

  describe("MIDICCEvent interface", () => {
    it("should accept valid CC event", () => {
      const event: MIDICCEvent = {
        type: "cc",
        controller: 1, // Mod wheel
        value: 0.5,
        channel: 0,
        timestamp: 1000,
      };
      expect(event.type).toBe("cc");
      expect(event.controller).toBe(1);
      expect(event.value).toBe(0.5);
    });

    it("should accept common CC controllers", () => {
      const modWheel: MIDICCEvent = {
        type: "cc",
        controller: 1,
        value: 0.5,
        channel: 0,
        timestamp: 0,
      };
      const volume: MIDICCEvent = {
        type: "cc",
        controller: 7,
        value: 0.5,
        channel: 0,
        timestamp: 0,
      };
      const sustain: MIDICCEvent = {
        type: "cc",
        controller: 64,
        value: 1,
        channel: 0,
        timestamp: 0,
      };

      expect(modWheel.controller).toBe(1);
      expect(volume.controller).toBe(7);
      expect(sustain.controller).toBe(64);
    });
  });

  describe("velocity normalization", () => {
    it("should normalize velocity from 0-127 to 0-1 range", () => {
      // Simulating what the hook does
      const midiVelocity = 100;
      const normalized = midiVelocity / 127;
      expect(normalized).toBeCloseTo(0.787, 2);
    });

    it("should handle minimum velocity", () => {
      const normalized = 0 / 127;
      expect(normalized).toBe(0);
    });

    it("should handle maximum velocity", () => {
      const normalized = 127 / 127;
      expect(normalized).toBe(1);
    });
  });
});

describe("MIDI message parsing", () => {
  // These tests validate the parsing logic used in useMIDI

  describe("status byte parsing", () => {
    it("should identify Note On messages (0x90-0x9F)", () => {
      const statusBytes = [0x90, 0x91, 0x9f];
      statusBytes.forEach((status) => {
        const messageType = status & 0xf0;
        expect(messageType).toBe(0x90);
      });
    });

    it("should identify Note Off messages (0x80-0x8F)", () => {
      const statusBytes = [0x80, 0x81, 0x8f];
      statusBytes.forEach((status) => {
        const messageType = status & 0xf0;
        expect(messageType).toBe(0x80);
      });
    });

    it("should identify Control Change messages (0xB0-0xBF)", () => {
      const statusBytes = [0xb0, 0xb1, 0xbf];
      statusBytes.forEach((status) => {
        const messageType = status & 0xf0;
        expect(messageType).toBe(0xb0);
      });
    });

    it("should extract channel from status byte", () => {
      const channel5 = 0x95 & 0x0f;
      expect(channel5).toBe(5);

      const channel15 = 0x8f & 0x0f;
      expect(channel15).toBe(15);

      const channel0 = 0x90 & 0x0f;
      expect(channel0).toBe(0);
    });
  });

  describe("note on with velocity 0", () => {
    it("should treat Note On with velocity 0 as Note Off", () => {
      const data = [0x90, 60, 0]; // Note On, C4, velocity 0
      const [status, , data2] = data;
      const messageType = status & 0xf0;

      // This is the logic in useMIDI
      const isNoteOff = messageType === 0x80 || (messageType === 0x90 && data2 === 0);
      expect(isNoteOff).toBe(true);
    });
  });
});
