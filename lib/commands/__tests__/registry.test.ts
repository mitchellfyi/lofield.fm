import { describe, it, expect, vi } from "vitest";
import { createCommandRegistry, searchCommands, type Command } from "../registry";

describe("createCommandRegistry", () => {
  it("creates an empty registry", () => {
    const registry = createCommandRegistry();
    expect(registry.commands).toHaveLength(0);
  });

  it("registers a command", () => {
    const registry = createCommandRegistry();
    const command: Command = {
      id: "test",
      name: "Test Command",
      section: "edit",
      handler: vi.fn(),
    };

    registry.registerCommand(command);

    expect(registry.commands).toHaveLength(1);
    expect(registry.getCommand("test")).toBe(command);
  });

  it("replaces command with same ID", () => {
    const registry = createCommandRegistry();
    const command1: Command = {
      id: "test",
      name: "Test Command 1",
      section: "edit",
      handler: vi.fn(),
    };
    const command2: Command = {
      id: "test",
      name: "Test Command 2",
      section: "edit",
      handler: vi.fn(),
    };

    registry.registerCommand(command1);
    registry.registerCommand(command2);

    expect(registry.commands).toHaveLength(1);
    expect(registry.getCommand("test")?.name).toBe("Test Command 2");
  });

  it("unregisters a command", () => {
    const registry = createCommandRegistry();
    const command: Command = {
      id: "test",
      name: "Test Command",
      section: "edit",
      handler: vi.fn(),
    };

    registry.registerCommand(command);
    expect(registry.commands).toHaveLength(1);

    registry.unregisterCommand("test");
    expect(registry.commands).toHaveLength(0);
    expect(registry.getCommand("test")).toBeUndefined();
  });

  it("returns undefined for non-existent command", () => {
    const registry = createCommandRegistry();
    expect(registry.getCommand("nonexistent")).toBeUndefined();
  });

  it("executes a command", () => {
    const registry = createCommandRegistry();
    const handler = vi.fn();
    const command: Command = {
      id: "test",
      name: "Test Command",
      section: "edit",
      handler,
    };

    registry.registerCommand(command);
    const result = registry.executeCommand("test");

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it("does not execute disabled command", () => {
    const registry = createCommandRegistry();
    const handler = vi.fn();
    const command: Command = {
      id: "test",
      name: "Test Command",
      section: "edit",
      handler,
      disabled: true,
    };

    registry.registerCommand(command);
    const result = registry.executeCommand("test");

    expect(result).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns false when executing non-existent command", () => {
    const registry = createCommandRegistry();
    const result = registry.executeCommand("nonexistent");
    expect(result).toBe(false);
  });
});

describe("searchCommands", () => {
  const commands: Command[] = [
    { id: "play", name: "Play", section: "playback", handler: vi.fn() },
    { id: "stop", name: "Stop", section: "playback", handler: vi.fn() },
    { id: "save", name: "Save Track", section: "file", handler: vi.fn() },
    { id: "save-as", name: "Save As", section: "file", handler: vi.fn() },
    { id: "play-stop", name: "Play or Stop", section: "playback", handler: vi.fn() },
  ];

  it("returns all commands for empty query", () => {
    expect(searchCommands(commands, "")).toEqual(commands);
    expect(searchCommands(commands, "  ")).toEqual(commands);
  });

  it("filters commands by name", () => {
    const results = searchCommands(commands, "play");
    expect(results).toHaveLength(2);
    expect(results.map((c) => c.id)).toContain("play");
    expect(results.map((c) => c.id)).toContain("play-stop");
  });

  it("is case insensitive", () => {
    const results = searchCommands(commands, "PLAY");
    expect(results).toHaveLength(2);
  });

  it("matches multiple words", () => {
    const results = searchCommands(commands, "save track");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("save");
  });

  it("prioritizes commands starting with query", () => {
    const results = searchCommands(commands, "save");
    expect(results[0].name).toBe("Save As");
    expect(results[1].name).toBe("Save Track");
  });

  it("returns empty array for no matches", () => {
    const results = searchCommands(commands, "xyz123");
    expect(results).toHaveLength(0);
  });
});
