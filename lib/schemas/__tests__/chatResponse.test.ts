import { describe, it, expect } from "vitest";
import { chatResponseSchema, type ChatResponse } from "../chatResponse";

describe("chatResponseSchema", () => {
  describe("valid responses", () => {
    it("should accept a response with notes and code", () => {
      const response: ChatResponse = {
        notes: ["Added a kick drum", "Set tempo to 120 BPM"],
        code: "Tone.Transport.bpm.value = 120;",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    it("should accept a response with single note", () => {
      const response: ChatResponse = {
        notes: ["Created a simple synth"],
        code: "const synth = new Tone.Synth().toDestination();",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    it("should accept a response with maximum 3 notes", () => {
      const response: ChatResponse = {
        notes: ["Note 1", "Note 2", "Note 3"],
        code: "Tone.Transport.start();",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    it("should accept empty notes array", () => {
      const response = {
        notes: [],
        code: "Tone.Transport.bpm.value = 90;",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    it("should accept multi-line code", () => {
      const response = {
        notes: ["Complex beat"],
        code: `Tone.Transport.bpm.value = 120;
const synth = new Tone.Synth().toDestination();
const seq = new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, "8n", time);
}, ["C4", "E4", "G4"]).start(0);`,
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid responses", () => {
    it("should reject response without notes", () => {
      const response = {
        code: "Tone.Transport.start();",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject response without code", () => {
      const response = {
        notes: ["Made a beat"],
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject response with more than 3 notes", () => {
      const response = {
        notes: ["Note 1", "Note 2", "Note 3", "Note 4"],
        code: "Tone.Transport.start();",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject response with empty code", () => {
      const response = {
        notes: ["Made a beat"],
        code: "",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject null values", () => {
      const response = {
        notes: null,
        code: null,
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject notes array with non-string elements", () => {
      const response = {
        notes: [1, 2, 3],
        code: "Tone.Transport.start();",
      };

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject completely empty object", () => {
      const response = {};

      const result = chatResponseSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it("should reject non-object input", () => {
      expect(chatResponseSchema.safeParse("string").success).toBe(false);
      expect(chatResponseSchema.safeParse(123).success).toBe(false);
      expect(chatResponseSchema.safeParse(null).success).toBe(false);
      expect(chatResponseSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct types from parse result", () => {
      const response = {
        notes: ["Test"],
        code: "const x = 1;",
      };

      const result = chatResponseSchema.parse(response);

      // TypeScript should infer these types correctly
      const notes: string[] = result.notes;
      const code: string = result.code;

      expect(notes).toEqual(["Test"]);
      expect(code).toBe("const x = 1;");
    });
  });
});
