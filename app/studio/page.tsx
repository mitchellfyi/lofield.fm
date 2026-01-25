"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  validateToneCode,
  validateRawToneCode,
  extractStreamingCode,
} from "@/lib/audio/llmContract";
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from "@/lib/audio/runtime";
import { useTransportState } from "@/lib/audio/useVisualization";
import { TopBar } from "@/components/studio/TopBar";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { PlayerControls } from "@/components/studio/PlayerControls";
import { ConsolePanel } from "@/components/studio/ConsolePanel";
import { TimelineBar } from "@/components/studio/TimelineBar";
import { ApiKeyPrompt } from "@/components/studio/ApiKeyPrompt";
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import { useApiKey } from "@/lib/hooks/useApiKey";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTracks, useAutoSave } from "@/lib/hooks/useTracks";
import { useRevisions } from "@/lib/hooks/useRevisions";
import { useHistory } from "@/lib/hooks/useHistory";
import { ApiKeyModal } from "@/components/settings/ApiKeyModal";
import { TrackBrowser } from "@/components/studio/TrackBrowser";
import { RevisionHistory } from "@/components/studio/RevisionHistory";
import { ExportModal } from "@/components/studio/ExportModal";
import { ShareDialog } from "@/components/studio/ShareDialog";
import { Toast } from "@/components/studio/Toast";
import { TweaksPanel } from "@/components/studio/TweaksPanel";
import { LayersPanel } from "@/components/studio/LayersPanel";
import { RecordButton } from "@/components/studio/RecordButton";
import { ActionsBar } from "@/components/studio/ActionsBar";
import { RecordingTimeline } from "@/components/studio/RecordingTimeline";
import { RecordingPanel } from "@/components/studio/RecordingPanel";
import type { UIMessage } from "@ai-sdk/react";
import type { Track } from "@/lib/types/tracks";
import type { ToastState } from "@/lib/export/types";
import { type TweaksConfig, DEFAULT_TWEAKS } from "@/lib/types/tweaks";
import { extractTweaks, injectTweaks } from "@/lib/audio/tweaksInjector";
import { type AudioLayer, DEFAULT_LAYERS } from "@/lib/types/audioLayer";
import { combineLayers } from "@/lib/audio/layerCombiner";
import { useRecording } from "@/lib/hooks/useRecording";
import { useRecordings } from "@/lib/hooks/useRecordings";
import { useRecordingPlayback } from "@/lib/hooks/useRecordingPlayback";
import type { Recording } from "@/lib/types/recording";

const DEFAULT_CODE = `// ═══════════════════════════════════════════════════════════
// Midnight Lofi - 32-bar arrangement with variation
// Sections: A(intro) B(build) C(full) D(breakdown)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;

// ─────────────────────────────────────────────────────────────
// Master Chain
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.1, release: 0.25 }).connect(limiter);
const masterLowpass = new Tone.Filter(8000, "lowpass").connect(masterComp);
const masterReverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(masterLowpass);
const tapeDelay = new Tone.FeedbackDelay("8n.", 0.32).connect(masterReverb);
tapeDelay.wet.value = 0.2;
const chorus = new Tone.Chorus(2.5, 3.5, 0.5).connect(tapeDelay).start();
const vinylFilter = new Tone.Filter(2500, "lowpass").connect(masterLowpass);

// ─────────────────────────────────────────────────────────────
// Drums
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
}).connect(masterComp);
kick.volume.value = -4;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.15 }
}).connect(masterReverb);
snare.volume.value = -8;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).connect(masterReverb);
clap.volume.value = -12;

const hihatClosed = new Tone.MetalSynth({
  frequency: 250, envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
  harmonicity: 3.5, modulationIndex: 20, resonance: 1800, octaves: 1
}).connect(vinylFilter);
hihatClosed.volume.value = -22;

const hihatOpen = new Tone.MetalSynth({
  frequency: 220, envelope: { attack: 0.001, decay: 0.15, release: 0.08 },
  harmonicity: 3.5, modulationIndex: 18, resonance: 1500, octaves: 1
}).connect(vinylFilter);
hihatOpen.volume.value = -24;

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// 32-bar kick pattern with variation per section
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  // Section A: sparse, Section C: full, Section D: half-time feel
  if (section === 0 && Math.random() > 0.7) return; // A: sparse
  if (section === 3 && Math.random() > 0.5) return; // D: breakdown
  // Random ghost note
  if (Math.random() > 0.92) kick.triggerAttackRelease("C1", "16n", t, v * 0.3);
  kick.triggerAttackRelease("C1", "8n", t, v);
}, [
  // Section A (bars 1-8): basic pattern
  0.9, null, null, 0.4, 0.85, null, 0.3, null, 0.9, null, null, 0.5, 0.8, null, 0.35, null,
  0.9, null, null, 0.4, 0.85, null, null, 0.4, 0.9, null, null, 0.5, 0.85, null, 0.3, 0.5,
  // Section B (bars 9-16): more energy
  0.95, null, null, 0.5, 0.9, null, 0.4, null, 0.9, null, 0.3, 0.5, 0.85, null, 0.4, null,
  0.95, null, null, 0.5, 0.9, null, 0.35, 0.4, 0.9, null, null, 0.5, 0.9, null, 0.4, 0.55,
  // Section C (bars 17-24): full energy
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, null, 0.95, null, 0.3, 0.55, 0.9, null, 0.45, null,
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, 0.35, 0.95, null, 0.3, 0.5, 0.9, 0.4, 0.45, 0.5,
  // Section D (bars 25-32): breakdown
  0.85, null, null, null, 0.8, null, null, null, 0.85, null, null, null, 0.8, null, null, null,
  0.9, null, null, 0.4, 0.85, null, null, null, 0.9, null, null, 0.5, 0.85, null, 0.4, 0.6
], "16n").start(0);

// Snare with fills
const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.8) return; // A: occasional drops
  // Random clap layer on section C
  if (section === 2 && Math.random() > 0.7) clap.triggerAttackRelease("16n", t, v * 0.5);
  snare.triggerAttackRelease("16n", t, v);
}, [
  // 32-bar pattern (8 bars x 4 sections, 16 steps per 2 bars)
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.4,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.9, null, null, 0.3, null, null, null, null, 0.9, null, 0.4, 0.5,
  null, null, null, null, 0.95, null, null, null, null, null, 0.3, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.3, null, null, null, null, 0.4, 0.9, null, 0.5, 0.6,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.9, 0.5, 0.6, 0.7
], "16n").start(0);

// Hi-hats with random variation
const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  // Vary intensity by section
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.7 : 1;
  // Random open hat
  if (v > 0.7 || (Math.random() > 0.93)) {
    hihatOpen.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  } else {
    hihatClosed.triggerAttackRelease("32n", t, v * intensity);
  }
}, [
  0.5, 0.2, 0.4, 0.25, 0.45, 0.2, 0.75, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.7, 0.35,
  0.5, 0.25, 0.4, 0.2, 0.5, 0.2, 0.4, 0.3, 0.55, 0.2, 0.45, 0.25, 0.5, 0.25, 0.8, 0.3,
  0.55, 0.25, 0.45, 0.3, 0.5, 0.25, 0.75, 0.35, 0.55, 0.25, 0.5, 0.3, 0.55, 0.25, 0.7, 0.4,
  0.6, 0.3, 0.5, 0.3, 0.55, 0.3, 0.8, 0.35, 0.6, 0.3, 0.5, 0.35, 0.55, 0.3, 0.85, 0.4,
  0.6, 0.3, 0.5, 0.35, 0.55, 0.3, 0.8, 0.4, 0.6, 0.35, 0.55, 0.35, 0.6, 0.3, 0.85, 0.45,
  0.65, 0.35, 0.55, 0.4, 0.6, 0.35, 0.85, 0.4, 0.65, 0.35, 0.55, 0.4, 0.6, 0.4, 0.9, 0.5,
  0.4, 0.2, 0.35, 0.2, 0.4, 0.15, 0.6, 0.25, 0.4, 0.2, 0.35, 0.2, 0.4, 0.2, 0.5, 0.25,
  0.5, 0.25, 0.4, 0.25, 0.5, 0.2, 0.7, 0.3, 0.55, 0.25, 0.45, 0.3, 0.5, 0.3, 0.8, 0.4
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - 32-bar pattern following chord changes
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(600, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
  filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -6;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  // Section A: sparse, D: simpler
  if (section === 0 && Math.random() > 0.6) return;
  // Random octave jump
  const note = (Math.random() > 0.95) ? n.replace("2", "3") : n;
  bass.triggerAttackRelease(note, "8n", t, 0.85);
}, [
  // Section A & B: Dm7 - G7 - Cmaj7 - Am7
  "D2", null, "D2", "D2", null, null, "F2", null, "D2", null, "D2", "A1", null, null, "D2", null,
  "G2", null, "G2", "G2", null, null, "B1", null, "G2", null, "G2", "D2", null, null, "G2", null,
  "C2", null, "C2", "E2", null, null, "G2", null, "C2", null, "C2", "G1", null, null, "C2", null,
  "A1", null, "A1", "C2", null, null, "E2", null, "A1", null, "A1", "E2", null, null, "A2", null,
  // Section C & D: Fmaj7 - Em7 - Dm7 - G7 (variation)
  "F2", null, "F2", "A2", null, null, "C2", null, "F2", null, "F2", "C2", null, null, "F2", null,
  "E2", null, "E2", "G2", null, null, "B1", null, "E2", null, "E2", "B1", null, null, "E2", null,
  "D2", null, "D2", "F2", null, null, "A1", null, "D2", null, null, null, null, null, "D2", null,
  "G2", null, "G2", "B1", null, null, "D2", null, "G2", null, "G2", "D2", null, "G2", "A2", "B2"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes Chords - 8 different chords over 32 bars
// ─────────────────────────────────────────────────────────────
const rhodesFilter = new Tone.Filter(2000, "lowpass").connect(chorus);
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.5,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 1, sustain: 0.3, release: 1.5 },
  modulation: { type: "triangle" },
  modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.6 }
}).connect(rhodesFilter);
rhodes.volume.value = -11;

const chordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  // Fade in on section A, full on C
  const vel = section === 0 ? 0.35 : section === 2 ? 0.6 : 0.5;
  rhodes.triggerAttackRelease(c, "1n", t, vel);
}, [
  // 32 bars = 8 chords (each held for 4 bars with variations)
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["D3", "F3", "A3"], null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G2", "B2", "D3"], null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["C3", "E3", "G3"], null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["A2", "E3", "G3"], null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["F2", "A2", "C3"], null,
  ["E2", "G2", "B2", "D3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["E2", "B2", "D3"], null,
  ["D2", "F2", "A2", "C3"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null, ["G2", "B2", "F3"], null, null, null, ["G2", "D3", "F3"], null, ["G2", "B2", "D3", "F3", "A3"], null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - follows chords with 32-bar variation
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(2500, "lowpass").connect(tapeDelay);
const arp = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
}).connect(arpFilter);
arp.volume.value = -13;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  // Silent in section A, subtle in D
  if (section === 0) return;
  if (section === 3 && Math.random() > 0.5) return;
  const vel = section === 2 ? 0.7 : 0.55;
  arp.triggerAttackRelease(n, "16n", t, vel);
}, [
  // Section A: silent (nulls)
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  // Section B: Dm7 and G7 arps
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4", "D4", "F4", "A4", "C5", "A4", "F4", "A4", "C5",
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4", "G4", "B4", "D5", "F5", "D5", "B4", "D5", "F5",
  // Section C: Cmaj7 and Am7 arps (climax)
  "C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4", "C4", "E4", "G4", "B4", "C5", "B4", "G4", "B4",
  "A3", "C4", "E4", "G4", "A4", "G4", "E4", "C4", "A3", "C4", "E4", "G4", "A4", "G4", "E4", "G4",
  // Section D: Fmaj7 and resolution (breakdown)
  "F4", "A4", "C5", "E5", "C5", "A4", null, null, "F4", "A4", "C5", null, null, null, null, null,
  "G4", "B4", "D5", null, "D5", null, "G4", null, "G4", "B4", "D5", "F5", "D5", "B4", "G4", "D5"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - Atmospheric swells following sections
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1200, "lowpass").connect(masterReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.8, release: 2.5 }
}).connect(padFilter);
pad.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  // Quieter in A and D, full in C
  const vel = section === 2 ? 0.4 : section === 0 || section === 3 ? 0.2 : 0.3;
  pad.triggerAttackRelease(c, "2n", t, vel);
}, [
  // Long sustained notes, one per 2 bars
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["F4", "C5"], null, null, null, null, null, null, null,
  ["E4", "B4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, ["G4", "B4", "D5"], null, null, null
], "2n").start(0);`;

// Shared ref for model selection accessible from body function
// This pattern is needed because TextStreamChatTransport.body is a function
// called at request time, not render time
const globalModelRef = { current: "gpt-4o-mini" };

/**
 * Snapshot of editor state for undo/redo history.
 * Captures everything needed to restore the composition state.
 */
interface HistorySnapshot {
  code: string;
  layers: AudioLayer[];
  tweaks: TweaksConfig;
  selectedLayerId: string | null;
}

/**
 * Create the initial history snapshot.
 */
function createInitialSnapshot(): HistorySnapshot {
  return {
    code: DEFAULT_CODE,
    layers: [{ ...DEFAULT_LAYERS[0], code: DEFAULT_CODE }],
    tweaks: DEFAULT_TWEAKS,
    selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
  };
}

// Dangerous tokens to reject
const DANGEROUS_TOKENS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "document",
  "localStorage",
  "sessionStorage",
  "import",
  "require",
  "eval",
  "Function",
];

export default function StudioPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const audioLoaded = true; // Tone.js is always available as a module
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [chatStatusMessage, setChatStatusMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [liveMode, setLiveMode] = useState(true); // Live coding mode - auto-update on edit
  const [selectedModel, setSelectedModel] = useModelSelection();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { hasKey, loading: apiKeyLoading, refresh: refreshApiKey } = useApiKey();

  // Track management state
  const [showTrackBrowser, setShowTrackBrowser] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, _setAutoSaveEnabled] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [saving, setSaving] = useState(false);
  const lastSavedCodeRef = useRef<string>("");
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "info" });

  // Tweaks state
  const [tweaks, setTweaks] = useState<TweaksConfig>(DEFAULT_TWEAKS);

  // Layout state - column widths and collapsible sections
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [leftColumnWidth, setLeftColumnWidth] = useState(256); // 256px = w-64
  const [rightColumnWidth, setRightColumnWidth] = useState(50); // percentage of remaining space
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);

  // Layers state - for multi-track composition
  const [layers, setLayers] = useState<AudioLayer[]>(() => [
    { ...DEFAULT_LAYERS[0], code: DEFAULT_CODE },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => DEFAULT_LAYERS[0]?.id || null
  );

  // Undo/Redo history for the entire editor state
  const {
    state: historyState,
    push: pushHistory,
    pushDebounced: pushHistoryDebounced,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<HistorySnapshot>(createInitialSnapshot());

  // Track if we're currently restoring from history to avoid re-pushing
  const isRestoringFromHistoryRef = useRef(false);
  // Track whether history change was from undo/redo (vs push)
  const historyActionRef = useRef<"undo" | "redo" | null>(null);

  // Project and track hooks
  const { projects, createProject } = useProjects();
  const { createTrack, updateTrack } = useTracks(selectedProjectId);
  const { revisions, createRevision } = useRevisions(currentTrackId);

  // Auto-save hook
  const { saving: autoSaving } = useAutoSave(currentTrackId, code, autoSaveEnabled);

  // Recording hooks
  const {
    isRecording,
    startRecording,
    stopRecording,
    captureTweak,
    elapsedMs: recordingElapsedMs,
    getRecordingForSave,
    clearRecording,
  } = useRecording();
  const {
    recordings,
    loading: recordingsLoading,
    createRecording: saveRecording,
    updateRecording: updateRecordingApi,
    deleteRecording,
  } = useRecordings(currentTrackId);

  // Active recording for playback/visualization
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

  // Callback to apply a single tweak change during playback
  // This is used by useRecordingPlayback to replay automation
  const applyTweakDuringPlayback = useCallback(
    (param: keyof TweaksConfig, value: number) => {
      // Update tweaks state
      setTweaks((prev) => ({ ...prev, [param]: value }));
      // Inject into code and update playback
      setCode((prevCode) => {
        const updatedCode = injectTweaks(prevCode, { ...tweaks, [param]: value });
        // If playing, apply the change live
        if (playerState === "playing") {
          const runtime = runtimeRef.current;
          lastPlayedCodeRef.current = updatedCode;
          runtime.play(updatedCode, true).catch((err) => {
            console.warn("Playback automation error:", err);
          });
        }
        return updatedCode;
      });
    },
    [tweaks, playerState]
  );

  // Recording playback hook - replays automation in sync with transport
  const {
    isPlaying: isPlaybackActive,
    currentTimeMs: playbackTimeMs,
    play: startPlayback,
    pause: pausePlayback,
    reset: resetPlayback,
  } = useRecordingPlayback({
    recording: activeRecording,
    enabled: playerState === "playing",
    onTweakChange: applyTweakDuringPlayback,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>("");
  const runtimeRef = useRef(getAudioRuntime());
  const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedCodeRef = useRef<string>("");
  const lastUserPromptRef = useRef<string>("");

  // Keep global ref in sync with state for body function
  useEffect(() => {
    globalModelRef.current = selectedModel;
  }, [selectedModel]);

  // Create transport with dynamic body that reads from global ref (called at request time)
  const chatTransport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: () => ({ model: globalModelRef.current }),
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status: chatStatus,
  } = useChat({
    transport: chatTransport,
  });

  const isLoading = chatStatus === "submitted" || chatStatus === "streaming";

  // Validate code for dangerous tokens
  const validateCode = useCallback(
    (codeToValidate: string): boolean => {
      for (const token of DANGEROUS_TOKENS) {
        if (codeToValidate.includes(token)) {
          setError(`Code contains dangerous token: ${token}`);
          return false;
        }
      }

      // Check for window usage - not allowed in user code
      if (codeToValidate.includes("window")) {
        setError("Code contains dangerous token: window");
        return false;
      }

      return true;
    },
    [setError]
  );

  // Subscribe to runtime state changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    const unsubscribe = runtime.subscribe(() => {
      setPlayerState(runtime.getState());
      setRuntimeEvents(runtime.getEvents());
    });
    return unsubscribe;
  }, []);

  // Live coding: auto-update when layers change while playing
  useEffect(() => {
    // Only trigger live updates when in live mode and currently playing
    if (!liveMode || playerState !== "playing") {
      return;
    }

    // Combine all layers for playback
    const combinedCode = combineLayers(layers);

    // Skip if combined code hasn't actually changed from what's currently playing
    // This prevents the restart-on-first-play bug
    if (combinedCode === lastPlayedCodeRef.current) {
      return;
    }

    // Clear any pending update
    if (liveUpdateTimeoutRef.current) {
      clearTimeout(liveUpdateTimeoutRef.current);
    }

    // Debounce the update to avoid rapid re-evaluation
    liveUpdateTimeoutRef.current = setTimeout(() => {
      // Validate before playing
      if (!validateCode(combinedCode)) {
        return;
      }

      const validation = validateRawToneCode(combinedCode);
      if (!validation.valid) {
        // Don't show errors during live typing - just skip invalid code
        return;
      }

      // Re-play the updated code, keeping the current position
      const runtime = runtimeRef.current;
      lastPlayedCodeRef.current = combinedCode;
      runtime.play(combinedCode, true).catch((err) => {
        // Silently handle errors during live coding to avoid disrupting flow
        console.warn("Live update error:", err);
      });
    }, 150); // 150ms debounce - fast for responsiveness

    return () => {
      if (liveUpdateTimeoutRef.current) {
        clearTimeout(liveUpdateTimeoutRef.current);
      }
    };
  }, [layers, liveMode, playerState, validateCode]);

  const playCode = useCallback(
    async (codeToPlay: string) => {
      if (!audioLoaded) {
        setError("Audio system not ready. Please wait.");
        return;
      }

      if (!validateCode(codeToPlay)) {
        return;
      }

      // Validate raw Tone.js code before playing (code from editor, not LLM response)
      const validation = validateRawToneCode(codeToPlay);
      if (!validation.valid) {
        setError(`Code validation failed: ${validation.errors.map((e) => e.message).join(", ")}`);
        setValidationErrors(validation.errors.map((e) => e.message));
        return;
      }

      try {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = codeToPlay; // Track what we're playing
        await runtime.play(codeToPlay);
        setError("");
        setValidationErrors([]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(`Failed to play: ${errorMsg}`);
      }
    },
    [audioLoaded, validateCode]
  );

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract code from assistant messages - LIVE during streaming
  // Updates the code editor in real-time as the AI generates code
  // Falls back to last working code if validation fails after server retries
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Collect all text parts
        const textParts = lastMessage.parts.filter((part) => part.type === "text");
        const fullText = textParts.map((part) => part.text).join("\n");

        // Skip if already processed this exact text
        if (lastProcessedMessageRef.current === fullText) {
          return;
        }

        // Extract code (handles both complete and streaming code blocks)
        const { code: extractedCode, isComplete } = extractStreamingCode(fullText);

        if (extractedCode) {
          // Update the code editor live as text streams in
          // This is intentional - syncing external streaming data to state

          setCode(extractedCode);

          if (isComplete) {
            // Code block is complete - do final validation and auto-restart if playing
            lastProcessedMessageRef.current = fullText;

            const validation = validateToneCode(fullText);
            if (validation.valid) {
              setValidationErrors([]);
              setChatStatusMessage(""); // Clear any previous status
              // Auto-restart if playing
              const runtime = runtimeRef.current;
              if (runtime.getState() === "playing" && audioLoaded) {
                playCode(extractedCode);
              }
              // Auto-create revision for valid code changes (if track is saved)
              if (currentTrackId) {
                createRevision(extractedCode, lastUserPromptRef.current || undefined);
              }
            } else {
              // Validation failed after server-side retries
              // Fall back to last working code if available
              const errorMsgs = validation.errors.map((e) => e.message);
              setValidationErrors(errorMsgs);

              if (lastPlayedCodeRef.current) {
                // Revert to last working code in editor
                // This is intentional - recovering from failed AI generation
                setCode(lastPlayedCodeRef.current);
                setError("Code generation failed. Reverted to last working version.");
                setChatStatusMessage("Code fix failed, using previous version");
              } else {
                setError(`Code validation failed: ${errorMsgs.join(", ")}`);
                setChatStatusMessage("Code validation failed");
              }
            }
          }
          // While streaming (isComplete=false), just update the editor without validation
        }
      }
    }
  }, [messages, audioLoaded, playCode, currentTrackId, createRevision]);

  const stop = () => {
    if (!audioLoaded) {
      setError("Audio system not ready.");
      return;
    }
    try {
      const runtime = runtimeRef.current;
      runtime.stop();
      setError("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to stop: ${errorMsg}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check if user has API key before sending
    if (!hasKey && !apiKeyLoading) {
      setShowApiKeyModal(true);
      return;
    }

    // Build context with all layers for the AI to understand the composition
    let codeContext: string;
    if (layers.length > 1) {
      // Multi-layer: show each layer's code with its name
      const layerContexts = layers.map(
        (layer) =>
          `=== LAYER: ${layer.name}${layer.muted ? " [MUTED]" : ""}${layer.soloed ? " [SOLO]" : ""} ===\n${layer.code}`
      );
      codeContext = layerContexts.join("\n\n");
    } else {
      // Single layer: just show the code
      codeContext = code;
    }

    // Include current code as context for the AI to make incremental changes
    const messageWithContext = `Current code:
\`\`\`js
${codeContext}
\`\`\`

Request: ${inputValue}`;

    // Save the user prompt for revision message
    lastUserPromptRef.current = inputValue.trim();
    sendMessage({ text: messageWithContext });
    setInputValue("");
  };

  const handleApiKeySuccess = async () => {
    await refreshApiKey();
  };

  // Toast helper
  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ visible: true, message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Create a snapshot of the current state for history.
   */
  const createSnapshot = useCallback((): HistorySnapshot => {
    return {
      code,
      layers,
      tweaks,
      selectedLayerId,
    };
  }, [code, layers, tweaks, selectedLayerId]);

  /**
   * Restore state from a history snapshot.
   */
  const restoreSnapshot = useCallback(
    (snapshot: HistorySnapshot) => {
      isRestoringFromHistoryRef.current = true;
      setCode(snapshot.code);
      setLayers(snapshot.layers);
      setTweaks(snapshot.tweaks);
      setSelectedLayerId(snapshot.selectedLayerId);

      // If playing, update playback with restored code
      if (playerState === "playing") {
        const combinedCode = combineLayers(snapshot.layers);
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = combinedCode;
        runtime.play(combinedCode, true).catch((err) => {
          console.warn("Undo/redo playback error:", err);
        });
      }

      // Reset the flag after state updates are applied
      requestAnimationFrame(() => {
        isRestoringFromHistoryRef.current = false;
      });
    },
    [playerState]
  );

  /**
   * Handle undo - restore previous state from history.
   */
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    historyActionRef.current = "undo";
    historyUndo();
  }, [canUndo, historyUndo]);

  /**
   * Handle redo - restore next state from history.
   */
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    historyActionRef.current = "redo";
    historyRedo();
  }, [canRedo, historyRedo]);

  // Sync component state when history state changes (from undo/redo only)
  const prevHistoryStateRef = useRef<HistorySnapshot | null>(null);
  useEffect(() => {
    // Skip initial render
    if (prevHistoryStateRef.current === null) {
      prevHistoryStateRef.current = historyState;
      return;
    }

    // Only restore if history state changed AND it was from undo/redo (not push)
    if (prevHistoryStateRef.current !== historyState) {
      prevHistoryStateRef.current = historyState;
      // Only restore on undo/redo, not on push operations
      if (historyActionRef.current === "undo" || historyActionRef.current === "redo") {
        restoreSnapshot(historyState);
        historyActionRef.current = null; // Reset flag after restore
      }
    }
  }, [historyState, restoreSnapshot]);

  // Handle tweaks changes - inject into code and trigger live update
  // saveToHistory: true = save snapshot for undo (on slider release), false = live update only
  const handleTweaksChange = useCallback(
    (newTweaks: TweaksConfig, saveToHistory = false) => {
      // Only push to history when explicitly requested (on slider release)
      if (saveToHistory && !isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      // Capture tweak changes when recording
      if (isRecording) {
        for (const key of Object.keys(newTweaks) as Array<keyof TweaksConfig>) {
          if (newTweaks[key] !== tweaks[key]) {
            captureTweak(key, tweaks[key], newTweaks[key]);
          }
        }
      }

      setTweaks(newTweaks);
      const updatedCode = injectTweaks(code, newTweaks);
      setCode(updatedCode);

      // If playing, trigger live update
      if (playerState === "playing") {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = updatedCode;
        runtime.play(updatedCode, true).catch((err) => {
          console.warn("Tweaks update error:", err);
        });
      }
    },
    [code, playerState, createSnapshot, pushHistory, isRecording, tweaks, captureTweak]
  );

  // Handle layer changes
  const handleLayersChange = useCallback(
    (newLayers: AudioLayer[]) => {
      // Push current state to history before changing
      if (!isRestoringFromHistoryRef.current) {
        pushHistory(createSnapshot());
      }

      setLayers(newLayers);
      // Update the combined code for playback
      const combined = combineLayers(newLayers);
      setCode(combined);

      // If playing in live mode, update playback
      if (playerState === "playing" && liveMode) {
        const runtime = runtimeRef.current;
        lastPlayedCodeRef.current = combined;
        runtime.play(combined, true).catch((err) => {
          console.warn("Layer update error:", err);
        });
      }
    },
    [playerState, liveMode, createSnapshot, pushHistory]
  );

  // Handle selecting a layer - update the code editor to show that layer's code
  const handleSelectLayer = useCallback(
    (layerId: string | null) => {
      setSelectedLayerId(layerId);
      if (layerId) {
        const layer = layers.find((l) => l.id === layerId);
        if (layer) {
          setCode(layer.code);
        }
      }
    },
    [layers]
  );

  // Sync code editor changes back to the selected layer
  const handleCodeChange = useCallback(
    (newCode: string) => {
      // Push current state to history before changing (debounced for typing)
      if (!isRestoringFromHistoryRef.current) {
        pushHistoryDebounced(createSnapshot());
      }

      setCode(newCode);
      // Update the selected layer's code
      if (selectedLayerId) {
        setLayers((prevLayers) =>
          prevLayers.map((layer) =>
            layer.id === selectedLayerId ? { ...layer, code: newCode } : layer
          )
        );
      }
    },
    [selectedLayerId, createSnapshot, pushHistoryDebounced]
  );

  // Track unsaved changes when code differs from last saved
  useEffect(() => {
    if (currentTrackId && code !== lastSavedCodeRef.current) {
      // Intentional - tracking unsaved changes when code changes

      setHasUnsavedChanges(true);
    }
  }, [code, currentTrackId]);

  // Handle selecting a track from the browser
  const handleSelectTrack = useCallback(
    (track: Track) => {
      setCurrentTrackId(track.id);
      setCurrentTrackName(track.name);
      setSelectedProjectId(track.project_id);
      const trackCode = track.current_code || DEFAULT_CODE;
      setCode(trackCode);
      lastSavedCodeRef.current = trackCode;
      setHasUnsavedChanges(false);
      setShowTrackBrowser(false);
      // Extract tweaks from loaded code
      const loadedTweaks = extractTweaks(trackCode);
      setTweaks(loadedTweaks || DEFAULT_TWEAKS);

      // Reset history when loading a different track
      resetHistory({
        code: trackCode,
        layers: [{ ...DEFAULT_LAYERS[0], code: trackCode }],
        tweaks: loadedTweaks || DEFAULT_TWEAKS,
        selectedLayerId: DEFAULT_LAYERS[0]?.id || null,
      });
    },
    [resetHistory]
  );

  // Handle reverting to a previous revision
  const handleRevert = useCallback((newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
    setShowRevisionHistory(false);
  }, []);

  // Handle previewing a revision (just load code temporarily)
  const handlePreviewRevision = useCallback((previewCode: string) => {
    setCode(previewCode);
    setHasUnsavedChanges(true);
  }, []);

  // Handle saving the current track
  const handleSave = useCallback(async () => {
    if (!currentTrackId) {
      // No track selected, open save-as modal
      setShowSaveAsModal(true);
      return;
    }

    try {
      setSaving(true);
      const result = await updateTrack(currentTrackId, { current_code: code });
      if (result) {
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
      }
    } catch {
      setError("Failed to save track");
    } finally {
      setSaving(false);
    }
  }, [currentTrackId, code, updateTrack]);

  // Handle save-as (create new track)
  const handleSaveAs = useCallback(async () => {
    if (!saveAsName.trim()) return;

    try {
      setSaving(true);

      // Create a default project if none exists
      let projectId = selectedProjectId;
      if (!projectId) {
        if (projects.length === 0) {
          const newProject = await createProject("My Tracks");
          if (!newProject) {
            setError("Failed to create project");
            return;
          }
          projectId = newProject.id;
          setSelectedProjectId(projectId);
        } else {
          projectId = projects[0].id;
          setSelectedProjectId(projectId);
        }
      }

      const newTrack = await createTrack(projectId, saveAsName.trim(), code);
      if (newTrack) {
        setCurrentTrackId(newTrack.id);
        setCurrentTrackName(newTrack.name);
        lastSavedCodeRef.current = code;
        setHasUnsavedChanges(false);
        setShowSaveAsModal(false);
        setSaveAsName("");
      }
    } catch {
      setError("Failed to create track");
    } finally {
      setSaving(false);
    }
  }, [saveAsName, selectedProjectId, projects, createProject, createTrack, code]);

  // Handle starting a recording
  const handleStartRecording = useCallback(() => {
    if (playerState !== "playing") {
      showToast("Start playback before recording", "error");
      return;
    }
    startRecording();
    showToast("Recording started", "info");
  }, [playerState, startRecording, showToast]);

  // Handle stopping a recording
  const handleStopRecording = useCallback(async () => {
    const events = stopRecording();
    if (events.length === 0) {
      showToast("No events recorded", "info");
      clearRecording();
      return;
    }

    // If no track is selected, just show the recording in the timeline
    if (!currentTrackId) {
      const tempRecording = getRecordingForSave("temp");
      setActiveRecording({
        ...tempRecording,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Recording);
      showToast(`Recorded ${events.length} events. Save track to persist.`, "success");
      clearRecording();
      return;
    }

    // Save to database
    const recordingData = getRecordingForSave(currentTrackId);
    const saved = await saveRecording(
      recordingData.duration_ms,
      recordingData.events,
      `Recording ${new Date().toLocaleTimeString()}`
    );

    if (saved) {
      setActiveRecording(saved);
      showToast(`Saved recording with ${events.length} events`, "success");
    } else {
      showToast("Failed to save recording", "error");
    }

    clearRecording();
  }, [
    stopRecording,
    currentTrackId,
    getRecordingForSave,
    saveRecording,
    clearRecording,
    showToast,
  ]);

  // Handle loading a recording for playback (used by RecordingPanel)
  const handleLoadRecording = useCallback(
    (recording: Recording) => {
      setActiveRecording(recording);
      showToast(`Loaded: ${recording.name || "Recording"}`, "info");
    },
    [showToast]
  );

  // Handle deleting a recording (used by RecordingPanel)
  const handleDeleteRecording = useCallback(
    async (recordingId: string) => {
      const success = await deleteRecording(recordingId);
      if (success) {
        if (activeRecording?.id === recordingId) {
          setActiveRecording(null);
        }
        showToast("Recording deleted", "info");
      }
    },
    [deleteRecording, activeRecording, showToast]
  );

  // Handle renaming a recording (used by RecordingPanel)
  const handleRenameRecording = useCallback(
    async (recordingId: string, newName: string) => {
      const result = await updateRecordingApi(recordingId, { name: newName });
      if (result) {
        // Update active recording if it's the one being renamed
        if (activeRecording?.id === recordingId) {
          setActiveRecording({ ...activeRecording, name: newName });
        }
        showToast("Recording renamed", "info");
      }
    },
    [updateRecordingApi, activeRecording, showToast]
  );

  // Keyboard shortcuts for save and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Cmd/Ctrl+Z: Undo (without Shift)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Cmd/Ctrl+Shift+Z: Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Cmd/Ctrl+Y: Redo (alternative shortcut)
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Column resize handling
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeMouseDown = useCallback(
    (column: "left" | "right") => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(column);
    },
    []
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizing === "left") {
        const newWidth = Math.max(200, Math.min(400, e.clientX - containerRect.left));
        setLeftColumnWidth(newWidth);
      } else if (isResizing === "right") {
        const remainingWidth = containerRect.width - leftColumnWidth;
        const rightEdge = containerRect.right;
        const mouseFromRight = rightEdge - e.clientX;
        const newRightPercent = Math.max(30, Math.min(70, (mouseFromRight / remainingWidth) * 100));
        setRightColumnWidth(100 - newRightPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, leftColumnWidth]);

  return (
    <>
      <div
        className="flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden"
        style={{ height: "var(--vh)" }}
      >
        {/* Animated background effect */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

        {/* Top Bar */}
        <TopBar
          playerState={playerState}
          onLoadPreset={setCode}
          currentTrackName={currentTrackName}
          onOpenTracks={() => setShowTrackBrowser(true)}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Actions Bar */}
        <ActionsBar
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleSave}
          onSaveAs={() => setShowSaveAsModal(true)}
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving || autoSaving}
          onExport={() => setShowExportModal(true)}
          onShare={() => setShowShareDialog(true)}
          canShare={!!currentTrackId}
          onRevert={() => setCode(DEFAULT_CODE)}
          onCopy={() => {
            navigator.clipboard.writeText(code);
            showToast("Code copied to clipboard", "success");
          }}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenHistory={currentTrackId ? () => setShowRevisionHistory(true) : undefined}
          hasRevisions={revisions.length > 0}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Desktop Layout: Three Column */}
          <div ref={containerRef} className={`hidden md:flex flex-1 ${isResizing ? "select-none" : ""}`}>
            {/* Left Sidebar - Tweaks, Layers, Bars */}
            <div
              className="flex flex-col border-r border-cyan-950/50 backdrop-blur-sm bg-slate-900/30 shrink-0"
              style={{ width: leftColumnWidth }}
            >
              <div className="p-3 flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                {/* Timeline Section - Collapsible */}
                <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden shrink-0">
                  <button
                    onClick={() => setTimelineExpanded(!timelineExpanded)}
                    className="w-full px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 hover:bg-slate-900/70 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                      Timeline
                    </div>
                    <svg
                      className={`w-3 h-3 text-cyan-400 transition-transform ${timelineExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {timelineExpanded && (
                    <div className="p-3">
                      <TimelineBar barsPerRow={8} totalRows={4} compact />
                    </div>
                  )}
                </div>

                {/* Tweaks Section */}
                <div className="shrink-0">
                  <TweaksPanel tweaks={tweaks} onTweaksChange={handleTweaksChange} />
                </div>

                {/* Layers Section - grows to fill available space */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
                  <LayersPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    isPlaying={playerState === "playing"}
                    onLayersChange={handleLayersChange}
                    onSelectLayer={handleSelectLayer}
                  />
                </div>

                {/* Recording Timeline - shows when there's an active recording */}
                {activeRecording && (
                  <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm p-3 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                        Recording: {activeRecording.name || "Untitled"}
                      </div>
                      {/* Playback controls for recorded automation */}
                      <div className="flex items-center gap-2">
                        {isPlaybackActive ? (
                          <button
                            onClick={pausePlayback}
                            className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                            title="Pause automation playback"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={startPlayback}
                            disabled={playerState !== "playing"}
                            className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 disabled:text-slate-600 disabled:hover:bg-transparent transition-colors"
                            title={
                              playerState === "playing"
                                ? "Play automation"
                                : "Start audio playback first"
                            }
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={resetPlayback}
                          className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Reset automation to start"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setActiveRecording(null)}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Close recording"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <RecordingTimeline
                      recording={activeRecording}
                      currentTimeMs={isPlaybackActive ? playbackTimeMs : undefined}
                      onDeleteEvent={(eventId) => {
                        // Update active recording by removing the event
                        const newEvents = activeRecording.events.filter((e) => e.id !== eventId);
                        setActiveRecording({ ...activeRecording, events: newEvents });
                      }}
                    />
                  </div>
                )}

                {/* Recording Panel - shows saved recordings for current track */}
                {recordings.length > 0 && (
                  <div className="shrink-0">
                    <RecordingPanel
                      recordings={recordings}
                      activeRecording={activeRecording}
                      loading={recordingsLoading}
                      onLoadRecording={handleLoadRecording}
                      onDeleteRecording={handleDeleteRecording}
                      onRenameRecording={handleRenameRecording}
                    />
                  </div>
                )}

                {/* Console Panel */}
                <div className="shrink-0">
                  <ConsolePanel events={runtimeEvents} error={error} />
                </div>
              </div>
            </div>

            {/* Left Resize Handle */}
            <div
              onMouseDown={handleResizeMouseDown("left")}
              className="w-1 hover:w-1.5 bg-transparent hover:bg-cyan-500/50 cursor-col-resize transition-all shrink-0 group"
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-0.5 h-8 bg-cyan-500/30 group-hover:bg-cyan-500/70 rounded-full transition-colors" />
              </div>
            </div>

            {/* Main Content Area - Chat & Code */}
            <div className="flex-1 flex min-w-0">
              {/* Middle Panel - Chat */}
              <div
                className="flex flex-col border-r border-cyan-950/50 backdrop-blur-sm min-w-0"
                style={{ width: `${rightColumnWidth}%` }}
              >
                {!hasKey && !apiKeyLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <ApiKeyPrompt onAddKey={() => setShowApiKeyModal(true)} />
                  </div>
                ) : (
                  <ChatPanel
                    messages={messages}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    statusMessage={chatStatusMessage}
                  />
                )}
              </div>

              {/* Right Resize Handle */}
              <div
                onMouseDown={handleResizeMouseDown("right")}
                className="w-1 hover:w-1.5 bg-transparent hover:bg-cyan-500/50 cursor-col-resize transition-all shrink-0 group"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-cyan-500/30 group-hover:bg-cyan-500/70 rounded-full transition-colors" />
                </div>
              </div>

              {/* Right Panel - Code & Player Controls */}
              <div
                className="flex flex-col backdrop-blur-sm min-w-0"
                style={{ width: `${100 - rightColumnWidth}%` }}
              >
              <div className="flex-1 min-h-0">
                <CodePanel
                  code={code}
                  onChange={handleCodeChange}
                  validationErrors={validationErrors}
                  defaultCode={DEFAULT_CODE}
                  liveMode={liveMode}
                  onLiveModeChange={setLiveMode}
                />
              </div>

              {/* Player Controls */}
              <div className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50">
                <PlayerControls
                  playerState={playerState}
                  audioLoaded={audioLoaded}
                  onPlay={() => playCode(combineLayers(layers))}
                  onStop={stop}
                  hideTimeline
                  recordButton={
                    <RecordButton
                      isRecording={isRecording}
                      onStartRecording={handleStartRecording}
                      onStopRecording={handleStopRecording}
                      elapsedMs={recordingElapsedMs}
                      disabled={playerState !== "playing" && !isRecording}
                      disabledReason="Start playback to record"
                    />
                  }
                />
              </div>
            </div>
            </div>{/* End Main Content Area */}
          </div>

          {/* Mobile Layout: Tabbed */}
          <div className="md:hidden flex flex-col flex-1">
            <MobileTabs
              code={code}
              setCode={handleCodeChange}
              validationErrors={validationErrors}
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              playerState={playerState}
              audioLoaded={audioLoaded}
              playCode={() => playCode(combineLayers(layers))}
              stop={stop}
              defaultCode={DEFAULT_CODE}
              liveMode={liveMode}
              onLiveModeChange={setLiveMode}
              chatStatusMessage={chatStatusMessage}
              tweaks={tweaks}
              onTweaksChange={handleTweaksChange}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onLayersChange={handleLayersChange}
              onSelectLayer={handleSelectLayer}
            />
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={handleApiKeySuccess}
      />

      {/* Track Browser Modal */}
      <TrackBrowser
        isOpen={showTrackBrowser}
        onClose={() => setShowTrackBrowser(false)}
        onSelectTrack={handleSelectTrack}
        currentTrackId={currentTrackId}
      />

      {/* Revision History Modal */}
      <RevisionHistory
        isOpen={showRevisionHistory}
        onClose={() => setShowRevisionHistory(false)}
        trackId={currentTrackId}
        currentCode={code}
        onRevert={handleRevert}
        onPreview={handlePreviewRevision}
      />

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
              <h2 className="text-xl font-bold text-cyan-300">Save Track</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Track Name</label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="Enter track name..."
                className="w-full px-4 py-3 bg-slate-700 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveAsName.trim()) handleSaveAs();
                  if (e.key === "Escape") {
                    setShowSaveAsModal(false);
                    setSaveAsName("");
                  }
                }}
              />
            </div>
            <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveAsModal(false);
                  setSaveAsName("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim() || saving}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        code={code}
        trackName={currentTrackName ?? undefined}
        onClose={() => setShowExportModal(false)}
        onSuccess={() => showToast("Audio exported successfully", "success")}
        recording={activeRecording}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        trackId={currentTrackId}
        trackName={currentTrackName ?? undefined}
        onClose={() => setShowShareDialog(false)}
        onToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onDismiss={dismissToast}
      />
    </>
  );
}

// Mobile Tabs Component
interface MobileTabsProps {
  code: string;
  setCode: (code: string) => void;
  validationErrors: string[];
  messages: UIMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  playerState: PlayerState;
  audioLoaded: boolean;
  playCode: () => void;
  stop: () => void;
  defaultCode: string;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;
  chatStatusMessage: string;
  // Controls tab props
  tweaks: TweaksConfig;
  onTweaksChange: (tweaks: TweaksConfig, saveToHistory?: boolean) => void;
  layers: AudioLayer[];
  selectedLayerId: string | null;
  onLayersChange: (layers: AudioLayer[]) => void;
  onSelectLayer: (layerId: string | null) => void;
}

function MobileTabs({
  code,
  setCode,
  validationErrors,
  messages,
  inputValue,
  setInputValue,
  handleSubmit,
  isLoading,
  playerState,
  audioLoaded,
  playCode,
  stop,
  defaultCode,
  liveMode,
  onLiveModeChange,
  chatStatusMessage,
  tweaks,
  onTweaksChange,
  layers,
  selectedLayerId,
  onLayersChange,
  onSelectLayer,
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "controls" | "code">("chat");
  const isPlaying = playerState === "playing";
  const canPlay = audioLoaded && playerState !== "loading" && playerState !== "error";

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-cyan-500/20 bg-slate-900/50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === "chat"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === "controls"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Controls
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === "code"
              ? "text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10"
              : "text-slate-400 active:text-cyan-300"
          }`}
        >
          Code
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <ChatPanel
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            statusMessage={chatStatusMessage}
          />
        )}

        {activeTab === "controls" && (
          <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto">
            {/* Timeline */}
            <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm p-3">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Timeline
              </div>
              <TimelineBar barsPerRow={8} totalRows={4} compact />
            </div>

            {/* Tweaks */}
            <TweaksPanel tweaks={tweaks} onTweaksChange={onTweaksChange} />

            {/* Layers */}
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              isPlaying={isPlaying}
              onLayersChange={onLayersChange}
              onSelectLayer={onSelectLayer}
            />
          </div>
        )}

        {activeTab === "code" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <CodePanel
                code={code}
                onChange={setCode}
                validationErrors={validationErrors}
                defaultCode={defaultCode}
                liveMode={liveMode}
                onLiveModeChange={onLiveModeChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Persistent Mobile Player Bar */}
      <div className="border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm px-3 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          {/* Play/Stop Buttons */}
          <button
            onClick={playCode}
            disabled={!canPlay}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold text-sm bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {playerState === "loading" ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              )}
              {isPlaying ? "Restart" : "Play"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={stop}
            disabled={!isPlaying}
            className="px-4 py-3 rounded-sm font-bold text-sm bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90 hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-700/90 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-cyan-100 hover:text-white transition-all duration-200 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 disabled:shadow-none border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>

          {/* Mini Timeline */}
          <MiniTimeline />
        </div>
      </div>
    </div>
  );
}

// Compact timeline for mobile player bar
function MiniTimeline() {
  const transport = useTransportState();
  const totalBars = 32;
  const currentBar = (transport.bar - 1) % totalBars;
  const section = Math.floor(currentBar / 8);
  const sectionLabels = ["A", "B", "C", "D"];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
          transport.playing ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-400"
        }`}
      >
        {sectionLabels[section]}
      </div>
      <div className="text-right">
        <div className="text-xs font-mono text-white tabular-nums">
          {transport.bar}/{totalBars}
        </div>
        <div className="text-[10px] text-slate-400">{transport.bpm} BPM</div>
      </div>
    </div>
  );
}
