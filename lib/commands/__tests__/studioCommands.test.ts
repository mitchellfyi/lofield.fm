import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStudioCommands, type StudioCommandDeps } from "../studioCommands";

describe("studioCommands module", () => {
  describe("module structure", () => {
    it("should export createStudioCommands function", async () => {
      const commandsModule = await import("../studioCommands");
      expect(commandsModule.createStudioCommands).toBeDefined();
      expect(typeof commandsModule.createStudioCommands).toBe("function");
    });

    it("should be a named export", async () => {
      const commandsModule = await import("../studioCommands");
      expect(Object.keys(commandsModule)).toContain("createStudioCommands");
    });
  });
});

describe("createStudioCommands", () => {
  let mockDeps: StudioCommandDeps;

  beforeEach(() => {
    mockDeps = {
      playerState: "idle",
      liveMode: true,
      canUndo: false,
      canRedo: false,
      currentTrackId: null,
      revisions: [],
      timelineExpanded: false,
      layers: [],
      code: "// test code",
      playCode: vi.fn(),
      stop: vi.fn(),
      setLiveMode: vi.fn(),
      handleSave: vi.fn(),
      handleUndo: vi.fn(),
      handleRedo: vi.fn(),
      setCode: vi.fn(),
      setShowSaveAsModal: vi.fn(),
      setShowTrackBrowser: vi.fn(),
      setShowExportModal: vi.fn(),
      setShowShareDialog: vi.fn(),
      setShowRevisionHistory: vi.fn(),
      setTimelineExpanded: vi.fn(),
      handleRestartTutorial: vi.fn(),
      showToast: vi.fn(),
      combineLayers: vi.fn().mockReturnValue("combined code"),
      defaultCode: "// default",
    };
  });

  it("should return an array of commands", () => {
    const commands = createStudioCommands(mockDeps);
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  describe("playback commands", () => {
    it("should include play command", () => {
      const commands = createStudioCommands(mockDeps);
      const playCommand = commands.find((c) => c.id === "play");

      expect(playCommand).toBeDefined();
      expect(playCommand?.name).toBe("Play");
      expect(playCommand?.section).toBe("playback");
    });

    it("should include stop command", () => {
      const commands = createStudioCommands(mockDeps);
      const stopCommand = commands.find((c) => c.id === "stop");

      expect(stopCommand).toBeDefined();
      expect(stopCommand?.name).toBe("Stop");
      expect(stopCommand?.section).toBe("playback");
    });

    it("should include toggle-live-mode command", () => {
      const commands = createStudioCommands(mockDeps);
      const liveModeCommand = commands.find((c) => c.id === "toggle-live-mode");

      expect(liveModeCommand).toBeDefined();
      expect(liveModeCommand?.section).toBe("playback");
    });

    it("should show Disable Live Mode when liveMode is true", () => {
      mockDeps.liveMode = true;
      const commands = createStudioCommands(mockDeps);
      const liveModeCommand = commands.find((c) => c.id === "toggle-live-mode");

      expect(liveModeCommand?.name).toBe("Disable Live Mode");
    });

    it("should show Enable Live Mode when liveMode is false", () => {
      mockDeps.liveMode = false;
      const commands = createStudioCommands(mockDeps);
      const liveModeCommand = commands.find((c) => c.id === "toggle-live-mode");

      expect(liveModeCommand?.name).toBe("Enable Live Mode");
    });

    it("should disable play when playerState is loading", () => {
      mockDeps.playerState = "loading";
      const commands = createStudioCommands(mockDeps);
      const playCommand = commands.find((c) => c.id === "play");

      expect(playCommand?.disabled).toBe(true);
    });

    it("should disable play when playerState is error", () => {
      mockDeps.playerState = "error";
      const commands = createStudioCommands(mockDeps);
      const playCommand = commands.find((c) => c.id === "play");

      expect(playCommand?.disabled).toBe(true);
    });

    it("should disable stop when not playing", () => {
      mockDeps.playerState = "idle";
      const commands = createStudioCommands(mockDeps);
      const stopCommand = commands.find((c) => c.id === "stop");

      expect(stopCommand?.disabled).toBe(true);
    });

    it("should enable stop when playing", () => {
      mockDeps.playerState = "playing";
      const commands = createStudioCommands(mockDeps);
      const stopCommand = commands.find((c) => c.id === "stop");

      expect(stopCommand?.disabled).toBe(false);
    });
  });

  describe("file commands", () => {
    it("should include save command", () => {
      const commands = createStudioCommands(mockDeps);
      const saveCommand = commands.find((c) => c.id === "save");

      expect(saveCommand).toBeDefined();
      expect(saveCommand?.name).toBe("Save Track");
      expect(saveCommand?.shortcut).toBe("⌘S");
    });

    it("should include save-as command", () => {
      const commands = createStudioCommands(mockDeps);
      const saveAsCommand = commands.find((c) => c.id === "save-as");

      expect(saveAsCommand).toBeDefined();
      expect(saveAsCommand?.name).toBe("Save Track As...");
    });

    it("should include open-tracks command", () => {
      const commands = createStudioCommands(mockDeps);
      const openTracksCommand = commands.find((c) => c.id === "open-tracks");

      expect(openTracksCommand).toBeDefined();
      expect(openTracksCommand?.name).toBe("Open Track Browser");
    });

    it("should include export command", () => {
      const commands = createStudioCommands(mockDeps);
      const exportCommand = commands.find((c) => c.id === "export");

      expect(exportCommand).toBeDefined();
      expect(exportCommand?.name).toBe("Export Audio");
    });

    it("should include share command", () => {
      const commands = createStudioCommands(mockDeps);
      const shareCommand = commands.find((c) => c.id === "share");

      expect(shareCommand).toBeDefined();
      expect(shareCommand?.name).toBe("Share Track");
    });

    it("should disable share when no track is loaded", () => {
      mockDeps.currentTrackId = null;
      const commands = createStudioCommands(mockDeps);
      const shareCommand = commands.find((c) => c.id === "share");

      expect(shareCommand?.disabled).toBe(true);
    });

    it("should enable share when track is loaded", () => {
      mockDeps.currentTrackId = "track-123";
      const commands = createStudioCommands(mockDeps);
      const shareCommand = commands.find((c) => c.id === "share");

      expect(shareCommand?.disabled).toBe(false);
    });
  });

  describe("edit commands", () => {
    it("should include undo command", () => {
      const commands = createStudioCommands(mockDeps);
      const undoCommand = commands.find((c) => c.id === "undo");

      expect(undoCommand).toBeDefined();
      expect(undoCommand?.name).toBe("Undo");
      expect(undoCommand?.shortcut).toBe("⌘Z");
    });

    it("should include redo command", () => {
      const commands = createStudioCommands(mockDeps);
      const redoCommand = commands.find((c) => c.id === "redo");

      expect(redoCommand).toBeDefined();
      expect(redoCommand?.name).toBe("Redo");
      expect(redoCommand?.shortcut).toBe("⌘⇧Z");
    });

    it("should include copy-code command", () => {
      const commands = createStudioCommands(mockDeps);
      const copyCommand = commands.find((c) => c.id === "copy-code");

      expect(copyCommand).toBeDefined();
      expect(copyCommand?.name).toBe("Copy Code to Clipboard");
    });

    it("should include reset-to-default command", () => {
      const commands = createStudioCommands(mockDeps);
      const resetCommand = commands.find((c) => c.id === "reset-to-default");

      expect(resetCommand).toBeDefined();
      expect(resetCommand?.name).toBe("Reset to Default Code");
    });

    it("should disable undo when canUndo is false", () => {
      mockDeps.canUndo = false;
      const commands = createStudioCommands(mockDeps);
      const undoCommand = commands.find((c) => c.id === "undo");

      expect(undoCommand?.disabled).toBe(true);
    });

    it("should enable undo when canUndo is true", () => {
      mockDeps.canUndo = true;
      const commands = createStudioCommands(mockDeps);
      const undoCommand = commands.find((c) => c.id === "undo");

      expect(undoCommand?.disabled).toBe(false);
    });

    it("should disable redo when canRedo is false", () => {
      mockDeps.canRedo = false;
      const commands = createStudioCommands(mockDeps);
      const redoCommand = commands.find((c) => c.id === "redo");

      expect(redoCommand?.disabled).toBe(true);
    });

    it("should enable redo when canRedo is true", () => {
      mockDeps.canRedo = true;
      const commands = createStudioCommands(mockDeps);
      const redoCommand = commands.find((c) => c.id === "redo");

      expect(redoCommand?.disabled).toBe(false);
    });
  });

  describe("view commands", () => {
    it("should include revision-history command", () => {
      const commands = createStudioCommands(mockDeps);
      const revisionCommand = commands.find((c) => c.id === "revision-history");

      expect(revisionCommand).toBeDefined();
      expect(revisionCommand?.name).toBe("View Revision History");
    });

    it("should include toggle-timeline command", () => {
      const commands = createStudioCommands(mockDeps);
      const timelineCommand = commands.find((c) => c.id === "toggle-timeline");

      expect(timelineCommand).toBeDefined();
    });

    it("should show Collapse Timeline when expanded", () => {
      mockDeps.timelineExpanded = true;
      const commands = createStudioCommands(mockDeps);
      const timelineCommand = commands.find((c) => c.id === "toggle-timeline");

      expect(timelineCommand?.name).toBe("Collapse Timeline");
    });

    it("should show Expand Timeline when collapsed", () => {
      mockDeps.timelineExpanded = false;
      const commands = createStudioCommands(mockDeps);
      const timelineCommand = commands.find((c) => c.id === "toggle-timeline");

      expect(timelineCommand?.name).toBe("Expand Timeline");
    });

    it("should disable revision-history when no track or revisions", () => {
      mockDeps.currentTrackId = null;
      mockDeps.revisions = [];
      const commands = createStudioCommands(mockDeps);
      const revisionCommand = commands.find((c) => c.id === "revision-history");

      expect(revisionCommand?.disabled).toBe(true);
    });

    it("should disable revision-history when track but no revisions", () => {
      mockDeps.currentTrackId = "track-123";
      mockDeps.revisions = [];
      const commands = createStudioCommands(mockDeps);
      const revisionCommand = commands.find((c) => c.id === "revision-history");

      expect(revisionCommand?.disabled).toBe(true);
    });

    it("should enable revision-history when track and revisions exist", () => {
      mockDeps.currentTrackId = "track-123";
      mockDeps.revisions = [{ id: "rev-1" }] as StudioCommandDeps["revisions"];
      const commands = createStudioCommands(mockDeps);
      const revisionCommand = commands.find((c) => c.id === "revision-history");

      expect(revisionCommand?.disabled).toBe(false);
    });
  });

  describe("navigation commands", () => {
    it("should include go-home command", () => {
      const commands = createStudioCommands(mockDeps);
      const homeCommand = commands.find((c) => c.id === "go-home");

      expect(homeCommand).toBeDefined();
      expect(homeCommand?.name).toBe("Go to Home Page");
    });

    it("should include go-explore command", () => {
      const commands = createStudioCommands(mockDeps);
      const exploreCommand = commands.find((c) => c.id === "go-explore");

      expect(exploreCommand).toBeDefined();
      expect(exploreCommand?.name).toBe("Go to Explore Page");
    });

    it("should include restart-tutorial command", () => {
      const commands = createStudioCommands(mockDeps);
      const tutorialCommand = commands.find((c) => c.id === "restart-tutorial");

      expect(tutorialCommand).toBeDefined();
      expect(tutorialCommand?.name).toBe("Restart Tutorial");
    });
  });

  describe("command handlers", () => {
    it("should call playCode with combined layers on play", () => {
      mockDeps.playerState = "idle";
      const commands = createStudioCommands(mockDeps);
      const playCommand = commands.find((c) => c.id === "play");

      playCommand?.handler();

      expect(mockDeps.combineLayers).toHaveBeenCalledWith(mockDeps.layers);
      expect(mockDeps.playCode).toHaveBeenCalledWith("combined code");
    });

    it("should call stop on stop command", () => {
      mockDeps.playerState = "playing";
      const commands = createStudioCommands(mockDeps);
      const stopCommand = commands.find((c) => c.id === "stop");

      stopCommand?.handler();

      expect(mockDeps.stop).toHaveBeenCalled();
    });

    it("should toggle live mode on toggle-live-mode", () => {
      mockDeps.liveMode = true;
      const commands = createStudioCommands(mockDeps);
      const liveModeCommand = commands.find((c) => c.id === "toggle-live-mode");

      liveModeCommand?.handler();

      expect(mockDeps.setLiveMode).toHaveBeenCalledWith(false);
    });

    it("should call handleSave on save", () => {
      const commands = createStudioCommands(mockDeps);
      const saveCommand = commands.find((c) => c.id === "save");

      saveCommand?.handler();

      expect(mockDeps.handleSave).toHaveBeenCalled();
    });

    it("should open save-as modal on save-as", () => {
      const commands = createStudioCommands(mockDeps);
      const saveAsCommand = commands.find((c) => c.id === "save-as");

      saveAsCommand?.handler();

      expect(mockDeps.setShowSaveAsModal).toHaveBeenCalledWith(true);
    });

    it("should open track browser on open-tracks", () => {
      const commands = createStudioCommands(mockDeps);
      const openTracksCommand = commands.find((c) => c.id === "open-tracks");

      openTracksCommand?.handler();

      expect(mockDeps.setShowTrackBrowser).toHaveBeenCalledWith(true);
    });

    it("should open export modal on export", () => {
      const commands = createStudioCommands(mockDeps);
      const exportCommand = commands.find((c) => c.id === "export");

      exportCommand?.handler();

      expect(mockDeps.setShowExportModal).toHaveBeenCalledWith(true);
    });

    it("should open share dialog on share", () => {
      const commands = createStudioCommands(mockDeps);
      const shareCommand = commands.find((c) => c.id === "share");

      shareCommand?.handler();

      expect(mockDeps.setShowShareDialog).toHaveBeenCalledWith(true);
    });

    it("should call handleUndo on undo", () => {
      const commands = createStudioCommands(mockDeps);
      const undoCommand = commands.find((c) => c.id === "undo");

      undoCommand?.handler();

      expect(mockDeps.handleUndo).toHaveBeenCalled();
    });

    it("should call handleRedo on redo", () => {
      const commands = createStudioCommands(mockDeps);
      const redoCommand = commands.find((c) => c.id === "redo");

      redoCommand?.handler();

      expect(mockDeps.handleRedo).toHaveBeenCalled();
    });

    it("should call setCode with default on reset-to-default", () => {
      const commands = createStudioCommands(mockDeps);
      const resetCommand = commands.find((c) => c.id === "reset-to-default");

      resetCommand?.handler();

      expect(mockDeps.setCode).toHaveBeenCalledWith("// default");
    });

    it("should open revision history on revision-history", () => {
      const commands = createStudioCommands(mockDeps);
      const revisionCommand = commands.find((c) => c.id === "revision-history");

      revisionCommand?.handler();

      expect(mockDeps.setShowRevisionHistory).toHaveBeenCalledWith(true);
    });

    it("should toggle timeline on toggle-timeline", () => {
      mockDeps.timelineExpanded = false;
      const commands = createStudioCommands(mockDeps);
      const timelineCommand = commands.find((c) => c.id === "toggle-timeline");

      timelineCommand?.handler();

      expect(mockDeps.setTimelineExpanded).toHaveBeenCalledWith(true);
    });

    it("should call handleRestartTutorial on restart-tutorial", () => {
      const commands = createStudioCommands(mockDeps);
      const tutorialCommand = commands.find((c) => c.id === "restart-tutorial");

      tutorialCommand?.handler();

      expect(mockDeps.handleRestartTutorial).toHaveBeenCalled();
    });
  });

  describe("command sections", () => {
    it("should have all commands with valid sections", () => {
      const commands = createStudioCommands(mockDeps);
      const validSections = ["playback", "file", "edit", "view", "navigation"];

      commands.forEach((command) => {
        expect(validSections).toContain(command.section);
      });
    });

    it("should have unique command IDs", () => {
      const commands = createStudioCommands(mockDeps);
      const ids = commands.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
