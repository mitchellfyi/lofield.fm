import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  COMMON_CC,
  CC_TO_TWEAK,
  isMIDIPlayable,
  createNoteHandler,
  createCCHandler,
  MIDIAdapter,
} from "../midiAdapter";
import type { MIDINoteEvent, MIDICCEvent } from "@/lib/hooks/useMIDI";

// Mock instrument for testing
const createMockInstrument = () => ({
  triggerAttack: vi.fn(),
  triggerRelease: vi.fn(),
});

describe("MIDI Adapter", () => {
  describe("COMMON_CC constants", () => {
    it("should define mod wheel as CC 1", () => {
      expect(COMMON_CC.MOD_WHEEL).toBe(1);
    });

    it("should define volume as CC 7", () => {
      expect(COMMON_CC.VOLUME).toBe(7);
    });

    it("should define sustain pedal as CC 64", () => {
      expect(COMMON_CC.SUSTAIN).toBe(64);
    });

    it("should define all notes off as CC 123", () => {
      expect(COMMON_CC.ALL_NOTES_OFF).toBe(123);
    });
  });

  describe("CC_TO_TWEAK mapping", () => {
    it("should map mod wheel to reverbMix", () => {
      expect(CC_TO_TWEAK[1]).toBe("reverbMix");
    });

    it("should map volume CC to masterVolume", () => {
      expect(CC_TO_TWEAK[7]).toBe("masterVolume");
    });
  });

  describe("isMIDIPlayable", () => {
    it("should return true for objects with triggerAttack and triggerRelease", () => {
      const instrument = createMockInstrument();
      expect(isMIDIPlayable(instrument)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isMIDIPlayable(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isMIDIPlayable(undefined)).toBe(false);
    });

    it("should return false for objects missing triggerAttack", () => {
      const invalid = { triggerRelease: vi.fn() };
      expect(isMIDIPlayable(invalid)).toBe(false);
    });

    it("should return false for objects missing triggerRelease", () => {
      const invalid = { triggerAttack: vi.fn() };
      expect(isMIDIPlayable(invalid)).toBe(false);
    });

    it("should return false for non-function properties", () => {
      const invalid = { triggerAttack: "not a function", triggerRelease: 123 };
      expect(isMIDIPlayable(invalid)).toBe(false);
    });
  });

  describe("createNoteHandler", () => {
    let instrument: ReturnType<typeof createMockInstrument>;
    let handler: (event: MIDINoteEvent) => void;

    beforeEach(() => {
      instrument = createMockInstrument();
      handler = createNoteHandler(instrument);
    });

    it("should trigger attack on note on event", () => {
      const event: MIDINoteEvent = {
        type: "noteon",
        note: 60, // C4
        velocity: 0.8,
        channel: 0,
        timestamp: 0,
      };

      handler(event);

      expect(instrument.triggerAttack).toHaveBeenCalledWith("C4", undefined, 0.8);
    });

    it("should trigger release on note off event", () => {
      // First trigger a note on
      handler({
        type: "noteon",
        note: 60,
        velocity: 0.8,
        channel: 0,
        timestamp: 0,
      });

      // Then note off
      handler({
        type: "noteoff",
        note: 60,
        velocity: 0,
        channel: 0,
        timestamp: 100,
      });

      expect(instrument.triggerRelease).toHaveBeenCalledWith("C4");
    });

    it("should convert MIDI note number to note name", () => {
      const testCases = [
        { note: 69, expected: "A4" },
        { note: 48, expected: "C3" },
        { note: 61, expected: "C#4" },
      ];

      testCases.forEach(({ note, expected }) => {
        instrument.triggerAttack.mockClear();
        handler({
          type: "noteon",
          note,
          velocity: 0.5,
          channel: 0,
          timestamp: 0,
        });
        expect(instrument.triggerAttack).toHaveBeenCalledWith(expected, undefined, 0.5);
      });
    });

    it("should not release notes that were not held", () => {
      handler({
        type: "noteoff",
        note: 60,
        velocity: 0,
        channel: 0,
        timestamp: 0,
      });

      expect(instrument.triggerRelease).not.toHaveBeenCalled();
    });
  });

  describe("createCCHandler", () => {
    it("should call onTweakChange with mapped parameter", () => {
      const onTweakChange = vi.fn();
      const handler = createCCHandler(onTweakChange);

      const event: MIDICCEvent = {
        type: "cc",
        controller: 1, // Mod wheel -> reverbMix
        value: 0.5,
        channel: 0,
        timestamp: 0,
      };

      handler(event);

      expect(onTweakChange).toHaveBeenCalledWith("reverbMix", 50); // 0.5 * 100
    });

    it("should scale CC value to 0-100 range", () => {
      const onTweakChange = vi.fn();
      const handler = createCCHandler(onTweakChange);

      handler({
        type: "cc",
        controller: 7, // Volume -> masterVolume
        value: 1,
        channel: 0,
        timestamp: 0,
      });

      expect(onTweakChange).toHaveBeenCalledWith("masterVolume", 100);
    });

    it("should not call handler for unmapped CC", () => {
      const onTweakChange = vi.fn();
      const handler = createCCHandler(onTweakChange);

      handler({
        type: "cc",
        controller: 99, // Not mapped
        value: 0.5,
        channel: 0,
        timestamp: 0,
      });

      expect(onTweakChange).not.toHaveBeenCalled();
    });

    it("should accept custom mapping", () => {
      const onTweakChange = vi.fn();
      const customMapping = { 99: "customParam" };
      const handler = createCCHandler(onTweakChange, customMapping);

      handler({
        type: "cc",
        controller: 99,
        value: 0.75,
        channel: 0,
        timestamp: 0,
      });

      expect(onTweakChange).toHaveBeenCalledWith("customParam", 75);
    });
  });

  describe("MIDIAdapter class", () => {
    let adapter: MIDIAdapter;
    let instrument: ReturnType<typeof createMockInstrument>;

    beforeEach(() => {
      adapter = new MIDIAdapter();
      instrument = createMockInstrument();
    });

    describe("setInstrument", () => {
      it("should set instrument for a specific channel", () => {
        adapter.setInstrument(0, instrument);

        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 0,
          timestamp: 0,
        });

        expect(instrument.triggerAttack).toHaveBeenCalled();
      });

      it("should only trigger instrument on matching channel", () => {
        adapter.setInstrument(0, instrument);

        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 1, // Different channel
          timestamp: 0,
        });

        expect(instrument.triggerAttack).not.toHaveBeenCalled();
      });
    });

    describe("setGlobalInstrument", () => {
      it("should respond to all channels", () => {
        adapter.setGlobalInstrument(instrument);

        [0, 5, 15].forEach((channel) => {
          instrument.triggerAttack.mockClear();
          adapter.handleNote({
            type: "noteon",
            note: 60,
            velocity: 0.8,
            channel,
            timestamp: 0,
          });
          expect(instrument.triggerAttack).toHaveBeenCalled();
        });
      });

      it("should be overridden by channel-specific instrument", () => {
        const globalInstrument = createMockInstrument();
        const channelInstrument = createMockInstrument();

        adapter.setGlobalInstrument(globalInstrument);
        adapter.setInstrument(1, channelInstrument);

        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 1,
          timestamp: 0,
        });

        expect(channelInstrument.triggerAttack).toHaveBeenCalled();
        expect(globalInstrument.triggerAttack).not.toHaveBeenCalled();
      });
    });

    describe("removeInstrument", () => {
      it("should remove instrument from channel", () => {
        adapter.setInstrument(0, instrument);
        adapter.removeInstrument(0);

        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 0,
          timestamp: 0,
        });

        expect(instrument.triggerAttack).not.toHaveBeenCalled();
      });
    });

    describe("handleCC", () => {
      it("should handle All Notes Off (CC 123)", () => {
        adapter.setGlobalInstrument(instrument);

        // Hold a note
        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 0,
          timestamp: 0,
        });

        // Send All Notes Off
        adapter.handleCC({
          type: "cc",
          controller: 123,
          value: 0,
          channel: 0,
          timestamp: 100,
        });

        expect(instrument.triggerRelease).toHaveBeenCalled();
      });

      it("should handle sustain pedal off", () => {
        adapter.setGlobalInstrument(instrument);

        // Hold a note
        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 0,
          timestamp: 0,
        });

        // Sustain off
        adapter.handleCC({
          type: "cc",
          controller: 64,
          value: 0, // < 0.5 means off
          channel: 0,
          timestamp: 100,
        });

        expect(instrument.triggerRelease).toHaveBeenCalled();
      });

      it("should pass non-special CC to custom handler", () => {
        const ccHandler = vi.fn();
        adapter.setCCHandler(ccHandler);

        const event: MIDICCEvent = {
          type: "cc",
          controller: 1, // Mod wheel
          value: 0.5,
          channel: 0,
          timestamp: 0,
        };

        adapter.handleCC(event);

        expect(ccHandler).toHaveBeenCalledWith(event);
      });
    });

    describe("releaseAll", () => {
      it("should release all held notes", () => {
        adapter.setGlobalInstrument(instrument);

        // Hold multiple notes
        [60, 64, 67].forEach((note) => {
          adapter.handleNote({
            type: "noteon",
            note,
            velocity: 0.8,
            channel: 0,
            timestamp: 0,
          });
        });

        adapter.releaseAll();

        expect(instrument.triggerRelease).toHaveBeenCalledTimes(3);
      });
    });

    describe("dispose", () => {
      it("should release all notes and clear state", () => {
        adapter.setGlobalInstrument(instrument);

        adapter.handleNote({
          type: "noteon",
          note: 60,
          velocity: 0.8,
          channel: 0,
          timestamp: 0,
        });

        adapter.dispose();

        // Should have released the note
        expect(instrument.triggerRelease).toHaveBeenCalled();

        // Further notes should not trigger
        instrument.triggerAttack.mockClear();
        adapter.handleNote({
          type: "noteon",
          note: 72,
          velocity: 0.8,
          channel: 0,
          timestamp: 100,
        });
        expect(instrument.triggerAttack).not.toHaveBeenCalled();
      });
    });
  });
});
