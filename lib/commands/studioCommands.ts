/**
 * Studio command palette commands factory
 *
 * Extracts command definitions from the studio page into a reusable factory function.
 */

import { type Command } from "@/lib/commands/registry";
import type { PlayerState } from "@/lib/audio/runtime";
import type { AudioLayer } from "@/lib/types/audioLayer";
import type { Revision } from "@/lib/types/tracks";

/**
 * Dependencies required to create studio commands
 */
export interface StudioCommandDeps {
  // State
  playerState: PlayerState;
  liveMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentTrackId: string | null;
  revisions: Revision[];
  timelineExpanded: boolean;
  layers: AudioLayer[];
  code: string;

  // Handlers
  playCode: (code: string) => Promise<void>;
  stop: () => void;
  setLiveMode: (enabled: boolean) => void;
  handleSave: () => Promise<void>;
  handleUndo: () => void;
  handleRedo: () => void;
  setCode: (code: string) => void;
  setShowSaveAsModal: (show: boolean) => void;
  setShowTrackBrowser: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowShareDialog: (show: boolean) => void;
  setShowRevisionHistory: (show: boolean) => void;
  setTimelineExpanded: (expanded: boolean) => void;
  handleRestartTutorial: () => void;
  showToast: (message: string, type: "info" | "success" | "error") => void;

  // Functions
  combineLayers: (layers: AudioLayer[]) => string;
  defaultCode: string;
}

/**
 * Create studio command palette commands
 */
export function createStudioCommands(deps: StudioCommandDeps): Command[] {
  const {
    playerState,
    liveMode,
    canUndo,
    canRedo,
    currentTrackId,
    revisions,
    timelineExpanded,
    layers,
    code,
    playCode,
    stop,
    setLiveMode,
    handleSave,
    handleUndo,
    handleRedo,
    setCode,
    setShowSaveAsModal,
    setShowTrackBrowser,
    setShowExportModal,
    setShowShareDialog,
    setShowRevisionHistory,
    setTimelineExpanded,
    handleRestartTutorial,
    showToast,
    combineLayers,
    defaultCode,
  } = deps;

  const commands: Command[] = [
    // Playback commands
    {
      id: "play",
      name: "Play",
      shortcut: "Space",
      section: "playback",
      handler: () => playCode(combineLayers(layers)),
      disabled: playerState === "loading" || playerState === "error",
    },
    {
      id: "stop",
      name: "Stop",
      section: "playback",
      handler: stop,
      disabled: playerState !== "playing",
    },
    {
      id: "toggle-live-mode",
      name: liveMode ? "Disable Live Mode" : "Enable Live Mode",
      section: "playback",
      handler: () => setLiveMode(!liveMode),
    },
    // File commands
    {
      id: "save",
      name: "Save Track",
      shortcut: "⌘S",
      section: "file",
      handler: handleSave,
    },
    {
      id: "save-as",
      name: "Save Track As...",
      section: "file",
      handler: () => setShowSaveAsModal(true),
    },
    {
      id: "open-tracks",
      name: "Open Track Browser",
      section: "file",
      handler: () => setShowTrackBrowser(true),
    },
    {
      id: "export",
      name: "Export Audio",
      section: "file",
      handler: () => setShowExportModal(true),
    },
    {
      id: "share",
      name: "Share Track",
      section: "file",
      handler: () => setShowShareDialog(true),
      disabled: !currentTrackId,
    },
    // Edit commands
    {
      id: "undo",
      name: "Undo",
      shortcut: "⌘Z",
      section: "edit",
      handler: handleUndo,
      disabled: !canUndo,
    },
    {
      id: "redo",
      name: "Redo",
      shortcut: "⌘⇧Z",
      section: "edit",
      handler: handleRedo,
      disabled: !canRedo,
    },
    {
      id: "copy-code",
      name: "Copy Code to Clipboard",
      section: "edit",
      handler: () => {
        navigator.clipboard.writeText(code);
        showToast("Code copied to clipboard", "success");
      },
    },
    {
      id: "reset-to-default",
      name: "Reset to Default Code",
      section: "edit",
      handler: () => setCode(defaultCode),
    },
    // View commands
    {
      id: "revision-history",
      name: "View Revision History",
      section: "view",
      handler: () => setShowRevisionHistory(true),
      disabled: !currentTrackId || revisions.length === 0,
    },
    {
      id: "toggle-timeline",
      name: timelineExpanded ? "Collapse Timeline" : "Expand Timeline",
      section: "view",
      handler: () => setTimelineExpanded(!timelineExpanded),
    },
    // Navigation commands
    {
      id: "go-home",
      name: "Go to Home Page",
      section: "navigation",
      handler: () => {
        window.location.href = "/";
      },
    },
    {
      id: "go-explore",
      name: "Go to Explore Page",
      section: "navigation",
      handler: () => {
        window.location.href = "/explore";
      },
    },
    // Help commands
    {
      id: "restart-tutorial",
      name: "Restart Tutorial",
      section: "navigation",
      handler: handleRestartTutorial,
    },
  ];

  return commands;
}
