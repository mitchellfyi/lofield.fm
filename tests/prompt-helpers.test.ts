import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseTrackDraftFromResponse,
  extractTagsFromPrompt,
} from "@/lib/prompt-helpers";

describe("prompt-helpers", () => {
  describe("buildSystemPrompt", () => {
    it("includes artist context if provided", () => {
      const prompt = buildSystemPrompt("MyArtist");
      expect(prompt).toContain('The user\'s artist name is "MyArtist"');
    });

    it("omits context note if no artist", () => {
      const prompt = buildSystemPrompt(null);
      expect(prompt).not.toContain("The user's artist name is");
    });
  });

  describe("buildUserPrompt", () => {
    it("includes controls", () => {
      const prompt = buildUserPrompt("make it bap", {
        genre: "lofi",
        bpm: 90,
        mood: { energy: 50, focus: 50, chill: 50 },
        instrumentation: ["drums"],
        length_ms: 10000,
        instrumental: true,
      });
      expect(prompt).toContain("Genre: lofi");
      expect(prompt).toContain("BPM: 90");
      expect(prompt).toContain("Energy: 50/100");
      expect(prompt).toContain("Instruments: drums");
      expect(prompt).toContain("Length: 10s");
      expect(prompt).toContain("Type: Instrumental");
    });

    it("includes previous draft", () => {
      const draft = {
        title: "Old Title",
        prompt_final: "Old Prompt",
      };
      const prompt = buildUserPrompt("tweak it", undefined, draft);
      expect(prompt).toContain("Title: Old Title");
      expect(prompt).toContain('Previous Prompt: "Old Prompt"');
    });

    it("handles new track state", () => {
      const prompt = buildUserPrompt("new track");
      expect(prompt).toContain("Previous Draft State: None (New Track)");
    });
  });

  describe("extractTagsFromPrompt", () => {
    it("finds keywords", () => {
      expect(extractTagsFromPrompt("chill lofi beats")).toEqual([
        "chill",
        "lofi",
        "beats",
      ]);
    });
  });

  describe("parseTrackDraftFromResponse", () => {
    it("extracts title and prompt", () => {
      const response = `
Sure, here is the plan.

Title: My Cool Track
Final prompt: A super cool track with drums.
`;
      const draft = parseTrackDraftFromResponse(response);
      expect(draft.title).toBe("My Cool Track");
      expect(draft.prompt_final).toBe("A super cool track with drums.");
      expect(draft.description).toBe("Sure, here is the plan.");
    });

    it("falls back to previous values", () => {
      const draftInput = {
        title: "Old Title",
        prompt_final: "Old Prompt",
      };
      const draft = parseTrackDraftFromResponse(
        "Just text",
        undefined,
        draftInput
      );
      expect(draft.title).toBe("Old Title");
      expect(draft.prompt_final).toBe("Old Prompt");
    });

    it("merges controls", () => {
      const controls = { bpm: 100 };
      const latestDraft = { bpm: 80 };
      const draft = parseTrackDraftFromResponse("resp", controls, latestDraft);
      expect(draft.bpm).toBe(100);
    });
  });
});
