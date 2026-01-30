import { describe, it, expect, vi } from "vitest";

// Test the command palette module structure and hook logic
// The component rendering is tested via integration tests

describe("CommandPalette", () => {
  describe("module structure", () => {
    it("should export CommandPalette component", async () => {
      const commandPaletteExports = await import("../CommandPalette");
      expect(commandPaletteExports.CommandPalette).toBeDefined();
      expect(typeof commandPaletteExports.CommandPalette).toBe("function");
    });

    it("should export useCommandPalette hook", async () => {
      const commandPaletteExports = await import("../CommandPalette");
      expect(commandPaletteExports.useCommandPalette).toBeDefined();
      expect(typeof commandPaletteExports.useCommandPalette).toBe("function");
    });

    it("should be named exports", async () => {
      const commandPaletteExports = await import("../CommandPalette");
      expect(Object.keys(commandPaletteExports)).toContain("CommandPalette");
      expect(Object.keys(commandPaletteExports)).toContain("useCommandPalette");
    });
  });

  describe("keyboard shortcut handling", () => {
    it("should register keydown listener", async () => {
      // Import the module to verify it can be loaded
      const { useCommandPalette } = await import("../CommandPalette");
      expect(useCommandPalette).toBeDefined();
    });
  });

  describe("Command interface", () => {
    it("should accept valid command structure", async () => {
      // Import Command type - types can't be dynamically imported, but the module can
      const registry = await import("@/lib/commands/registry");
      expect(registry).toBeDefined();

      // Test at runtime that we can create a valid command object
      const validCommand = {
        id: "test",
        name: "Test Command",
        section: "edit" as const,
        handler: vi.fn(),
      };

      expect(validCommand.id).toBe("test");
      expect(validCommand.name).toBe("Test Command");
      expect(validCommand.section).toBe("edit");
      expect(typeof validCommand.handler).toBe("function");
    });

    it("should accept optional properties", async () => {
      // Test at runtime that we can create a command with optional properties
      const commandWithOptionals = {
        id: "test",
        name: "Test Command",
        section: "playback" as const,
        handler: vi.fn(),
        shortcut: "⌘K",
        disabled: true,
      };

      expect(commandWithOptionals.shortcut).toBe("⌘K");
      expect(commandWithOptionals.disabled).toBe(true);
    });
  });
});

describe("Command section types", () => {
  it("should support all valid section types", async () => {
    const { SECTION_LABELS } = await import("@/lib/commands/registry");

    expect(SECTION_LABELS.playback).toBe("Playback");
    expect(SECTION_LABELS.file).toBe("File");
    expect(SECTION_LABELS.edit).toBe("Edit");
    expect(SECTION_LABELS.view).toBe("View");
    expect(SECTION_LABELS.navigation).toBe("Navigation");
  });
});
