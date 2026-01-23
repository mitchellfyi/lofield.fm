import { describe, it, expect } from "vitest";
import { extractStreamingCode, extractCodeBlocks, validateToneCode } from "../llmContract";

describe("llmContract", () => {
  describe("extractStreamingCode", () => {
    it("should extract complete code blocks", () => {
      const text = `Notes:
- Changed tempo

Code:
\`\`\`js
Tone.Transport.bpm.value = 120;
const synth = new Tone.Synth().toDestination();
\`\`\``;

      const result = extractStreamingCode(text);

      expect(result.isComplete).toBe(true);
      expect(result.code).toContain("Tone.Transport.bpm.value = 120");
      expect(result.code).toContain("new Tone.Synth()");
    });

    it("should extract incomplete/streaming code blocks", () => {
      const text = `Notes:
- Making a beat

Code:
\`\`\`js
Tone.Transport.bpm.value = 90;
const kick = new Tone.MembraneSynth()`;

      const result = extractStreamingCode(text);

      expect(result.isComplete).toBe(false);
      expect(result.code).toContain("Tone.Transport.bpm.value = 90");
      expect(result.code).toContain("new Tone.MembraneSynth()");
    });

    it("should return null for text with no code block", () => {
      const text = `Notes:
- I will create a beat for you`;

      const result = extractStreamingCode(text);

      expect(result.code).toBeNull();
      expect(result.isComplete).toBe(false);
    });

    it("should return null for empty code block just starting", () => {
      const text = `Notes:
- Creating beat

Code:
\`\`\`js
`;

      const result = extractStreamingCode(text);

      expect(result.code).toBeNull();
      expect(result.isComplete).toBe(false);
    });

    it("should handle code block with javascript language tag", () => {
      const text = `\`\`\`javascript
Tone.Transport.bpm.value = 85;
const synth = new Tone.Synth()`;

      const result = extractStreamingCode(text);

      expect(result.isComplete).toBe(false);
      expect(result.code).toContain("Tone.Transport.bpm.value = 85");
    });

    it("should handle complete code block with javascript tag", () => {
      const text = `\`\`\`javascript
Tone.Transport.bpm.value = 85;
\`\`\``;

      const result = extractStreamingCode(text);

      expect(result.isComplete).toBe(true);
      expect(result.code).toContain("Tone.Transport.bpm.value = 85");
    });

    it("should prefer complete block over partial", () => {
      // This tests that we correctly identify a complete block
      const text = `\`\`\`js
const complete = true;
\`\`\`

Some more text`;

      const result = extractStreamingCode(text);

      expect(result.isComplete).toBe(true);
      expect(result.code).toBe("const complete = true;");
    });
  });

  describe("extractCodeBlocks", () => {
    it("should extract single code block", () => {
      const text = `\`\`\`js
const x = 1;
\`\`\``;

      const blocks = extractCodeBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toBe("const x = 1;");
    });

    it("should extract multiple code blocks", () => {
      const text = `\`\`\`js
const x = 1;
\`\`\`

\`\`\`javascript
const y = 2;
\`\`\``;

      const blocks = extractCodeBlocks(text);

      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toBe("const x = 1;");
      expect(blocks[1]).toBe("const y = 2;");
    });

    it("should return empty array for no code blocks", () => {
      const text = "Just some text";

      const blocks = extractCodeBlocks(text);

      expect(blocks).toHaveLength(0);
    });
  });

  describe("validateToneCode", () => {
    it("should validate code with Tone.js usage", () => {
      const text = `\`\`\`js
Tone.Transport.bpm.value = 120;
\`\`\``;

      const result = validateToneCode(text);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject code without Tone.js", () => {
      const text = `\`\`\`js
const x = 1;
\`\`\``;

      const result = validateToneCode(text);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "missing_tone")).toBe(true);
    });

    it("should reject response with no code block", () => {
      const text = "Just some explanation";

      const result = validateToneCode(text);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "no_code_block")).toBe(true);
    });

    it("should reject response with multiple code blocks", () => {
      const text = `\`\`\`js
Tone.Transport.bpm.value = 120;
\`\`\`

\`\`\`js
const synth = new Tone.Synth();
\`\`\``;

      const result = validateToneCode(text);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === "multiple_code_blocks")).toBe(true);
    });
  });
});
