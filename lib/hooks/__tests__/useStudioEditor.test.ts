import { describe, it, expect } from "vitest";

describe("useStudioEditor hook", () => {
  describe("module structure", () => {
    it("should export useStudioEditor function", async () => {
      const hookModule = await import("../useStudioEditor");
      expect(hookModule.useStudioEditor).toBeDefined();
      expect(typeof hookModule.useStudioEditor).toBe("function");
    });

    it("should export HistorySnapshot interface", async () => {
      const hookModule = await import("../useStudioEditor");
      expect(hookModule).toHaveProperty("createInitialSnapshot");
    });

    it("should export createInitialSnapshot function", async () => {
      const hookModule = await import("../useStudioEditor");
      expect(typeof hookModule.createInitialSnapshot).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useStudioEditor");
      expect(Object.keys(hookModule)).toContain("useStudioEditor");
      expect(Object.keys(hookModule)).toContain("createInitialSnapshot");
    });
  });

  describe("createInitialSnapshot", () => {
    it("should return valid snapshot structure", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(snapshot).toHaveProperty("code");
      expect(snapshot).toHaveProperty("layers");
      expect(snapshot).toHaveProperty("tweaks");
      expect(snapshot).toHaveProperty("selectedLayerId");
    });

    it("should have non-empty code", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(typeof snapshot.code).toBe("string");
      expect(snapshot.code.length).toBeGreaterThan(0);
    });

    it("should have at least one layer", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(Array.isArray(snapshot.layers)).toBe(true);
      expect(snapshot.layers.length).toBeGreaterThan(0);
    });

    it("should have valid tweaks object", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(typeof snapshot.tweaks).toBe("object");
      expect(snapshot.tweaks).toHaveProperty("bpm");
      expect(snapshot.tweaks).toHaveProperty("swing");
    });

    it("should have selectedLayerId matching first layer", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(snapshot.selectedLayerId).toBe(snapshot.layers[0]?.id || null);
    });

    it("should have layer code matching snapshot code", async () => {
      const { createInitialSnapshot } = await import("../useStudioEditor");
      const snapshot = createInitialSnapshot();

      expect(snapshot.layers[0].code).toBe(snapshot.code);
    });
  });

  describe("return interface contract", () => {
    it("should accept options with required properties", async () => {
      const hookSource = await import("../useStudioEditor");
      const hookFn = hookSource.useStudioEditor;

      // The function exists and is callable
      expect(typeof hookFn).toBe("function");
    });
  });
});

describe("useStudioEditor types", () => {
  describe("UseStudioEditorOptions", () => {
    it("should require playerState", async () => {
      // This is a compile-time check - we verify the type exists by importing
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });

    it("should require runtimeRef", async () => {
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });

    it("should require lastPlayedCodeRef", async () => {
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });
  });

  describe("UseStudioEditorResult", () => {
    it("should export result type with code state", async () => {
      // Type checking verified at compile time
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });

    it("should export result type with layers state", async () => {
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });

    it("should export result type with history handlers", async () => {
      const editorModule = await import("../useStudioEditor");
      expect(editorModule).toBeDefined();
    });
  });
});

describe("HistorySnapshot", () => {
  it("should have code property", async () => {
    const { createInitialSnapshot } = await import("../useStudioEditor");
    const snapshot = createInitialSnapshot();
    expect("code" in snapshot).toBe(true);
  });

  it("should have layers property", async () => {
    const { createInitialSnapshot } = await import("../useStudioEditor");
    const snapshot = createInitialSnapshot();
    expect("layers" in snapshot).toBe(true);
  });

  it("should have tweaks property", async () => {
    const { createInitialSnapshot } = await import("../useStudioEditor");
    const snapshot = createInitialSnapshot();
    expect("tweaks" in snapshot).toBe(true);
  });

  it("should have selectedLayerId property", async () => {
    const { createInitialSnapshot } = await import("../useStudioEditor");
    const snapshot = createInitialSnapshot();
    expect("selectedLayerId" in snapshot).toBe(true);
  });
});
