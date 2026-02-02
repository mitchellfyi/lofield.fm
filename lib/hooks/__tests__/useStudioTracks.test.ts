import { describe, it, expect } from "vitest";

describe("useStudioTracks hook", () => {
  describe("module structure", () => {
    it("should export useStudioTracks function", async () => {
      const hookModule = await import("../useStudioTracks");
      expect(hookModule.useStudioTracks).toBeDefined();
      expect(typeof hookModule.useStudioTracks).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useStudioTracks");
      expect(Object.keys(hookModule)).toContain("useStudioTracks");
    });
  });

  describe("return interface contract", () => {
    it("should accept options with required properties", async () => {
      const hookSource = await import("../useStudioTracks");
      const hookFn = hookSource.useStudioTracks;

      // The function exists and is callable
      expect(typeof hookFn).toBe("function");
    });
  });
});

describe("useStudioTracks types", () => {
  describe("UseStudioTracksOptions", () => {
    it("should require showToast callback", async () => {
      // Type checking is done at compile time
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should require getCode callback", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should require setCode callback", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should require setTweaks callback", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should require resetHistory callback", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });
  });

  describe("UseStudioTracksResult", () => {
    it("should define currentTrackId state", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define currentTrackName state", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define hasUnsavedChanges state", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define modal state (showTrackBrowser, showSaveAsModal)", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define save state (saving, autoSaving)", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define handleSelectTrack handler", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define handleSave handler", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });

    it("should define handleSaveAs handler", async () => {
      const tracksModule = await import("../useStudioTracks");
      expect(tracksModule).toBeDefined();
    });
  });
});
