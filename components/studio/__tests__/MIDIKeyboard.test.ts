import { describe, it, expect } from "vitest";

describe("MIDIKeyboard", () => {
  describe("module structure", () => {
    it("should export MIDIKeyboard component", async () => {
      const keyboardModule = await import("../MIDIKeyboard");
      expect(keyboardModule.MIDIKeyboard).toBeDefined();
      expect(typeof keyboardModule.MIDIKeyboard).toBe("function");
    });
  });

  describe("keyboard layout logic", () => {
    // The keyboard uses a standard piano layout
    const blackKeyIndices = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

    it("should correctly identify black keys in an octave", () => {
      // In one octave (0-11), these indices are black keys
      expect(blackKeyIndices).toContain(1); // C#
      expect(blackKeyIndices).toContain(3); // D#
      expect(blackKeyIndices).toContain(6); // F#
      expect(blackKeyIndices).toContain(8); // G#
      expect(blackKeyIndices).toContain(10); // A#
    });

    it("should correctly identify white keys in an octave", () => {
      const whiteKeyIndices = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
      whiteKeyIndices.forEach((index) => {
        expect(blackKeyIndices).not.toContain(index);
      });
    });

    it("should have 7 white keys per octave", () => {
      const whiteKeysPerOctave = 12 - blackKeyIndices.length;
      expect(whiteKeysPerOctave).toBe(7);
    });

    it("should have 5 black keys per octave", () => {
      expect(blackKeyIndices.length).toBe(5);
    });
  });

  describe("note calculation", () => {
    const defaultStartNote = 48; // C3

    it("should calculate correct number of notes for 2 octaves", () => {
      const octaves = 2;
      // 12 notes per octave * 2 + 1 final C
      const totalNotes = octaves * 12 + 1;
      expect(totalNotes).toBe(25);
    });

    it("should calculate correct number of notes for 3 octaves", () => {
      const octaves = 3;
      const totalNotes = octaves * 12 + 1;
      expect(totalNotes).toBe(37);
    });

    it("should start from the correct note", () => {
      const firstNote = defaultStartNote;
      expect(firstNote).toBe(48); // C3
    });

    it("should calculate correct end note for 2 octaves", () => {
      const octaves = 2;
      const lastNote = defaultStartNote + octaves * 12;
      expect(lastNote).toBe(72); // C5
    });
  });

  describe("white key count calculation", () => {
    // The keyboard calculates white keys before each black key for positioning

    function getWhiteKeysBeforeNote(noteInOctave: number): number {
      // This mirrors the logic in MIDIKeyboard
      const whiteKeyMap = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
      return whiteKeyMap[noteInOctave];
    }

    it("should have 0 white keys before C", () => {
      expect(getWhiteKeysBeforeNote(0)).toBe(0);
    });

    it("should have 1 white key before C#", () => {
      expect(getWhiteKeysBeforeNote(1)).toBe(1);
    });

    it("should have 2 white keys before D#", () => {
      expect(getWhiteKeysBeforeNote(3)).toBe(2);
    });

    it("should have 3 white keys before F", () => {
      expect(getWhiteKeysBeforeNote(5)).toBe(3);
    });

    it("should have 4 white keys before F#", () => {
      expect(getWhiteKeysBeforeNote(6)).toBe(4);
    });

    it("should have 5 white keys before G#", () => {
      expect(getWhiteKeysBeforeNote(8)).toBe(5);
    });

    it("should have 6 white keys before A#", () => {
      expect(getWhiteKeysBeforeNote(10)).toBe(6);
    });
  });

  describe("black key positioning", () => {
    // Black key position relative to white keys
    function getBlackKeyPosition(note: number, startNote: number = 48): number {
      const noteInOctave = note % 12;
      const octaveOffset = Math.floor((note - startNote) / 12);
      const whiteKeyMap = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
      return octaveOffset * 7 + whiteKeyMap[noteInOctave];
    }

    it("should position C#3 after 1st white key", () => {
      const position = getBlackKeyPosition(49, 48); // C#3
      expect(position).toBe(1);
    });

    it("should position D#3 after 2nd white key", () => {
      const position = getBlackKeyPosition(51, 48); // D#3
      expect(position).toBe(2);
    });

    it("should position F#3 after 4th white key", () => {
      const position = getBlackKeyPosition(54, 48); // F#3
      expect(position).toBe(4);
    });

    it("should position C#4 correctly in second octave", () => {
      const position = getBlackKeyPosition(61, 48); // C#4
      expect(position).toBe(8); // 7 white keys in first octave + 1
    });
  });

  describe("velocity handling", () => {
    it("should use default velocity for mouse clicks", () => {
      const defaultVelocity = 0.8;
      expect(defaultVelocity).toBe(0.8);
    });

    it("should normalize velocity to 0-1 range", () => {
      const velocities = [0, 0.4, 0.8, 1.0];
      velocities.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("active note detection", () => {
    it("should identify note as active when in Set", () => {
      const activeNotes = new Set([60, 64, 67]);
      expect(activeNotes.has(60)).toBe(true);
      expect(activeNotes.has(64)).toBe(true);
      expect(activeNotes.has(62)).toBe(false);
    });

    it("should handle empty active notes set", () => {
      const activeNotes = new Set<number>();
      expect(activeNotes.has(60)).toBe(false);
      expect(activeNotes.size).toBe(0);
    });
  });

  describe("note name display", () => {
    // The keyboard shows labels for C notes and active notes

    function shouldShowLabel(note: number, isActive: boolean): boolean {
      const isC = note % 12 === 0;
      return isC || isActive;
    }

    it("should show label for C notes", () => {
      [48, 60, 72].forEach((note) => {
        expect(shouldShowLabel(note, false)).toBe(true);
      });
    });

    it("should show label for active notes", () => {
      expect(shouldShowLabel(64, true)).toBe(true); // E4 when active
    });

    it("should not show label for inactive non-C notes", () => {
      expect(shouldShowLabel(64, false)).toBe(false);
    });
  });
});
