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
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import type { UIMessage } from "@ai-sdk/react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>("");
  const runtimeRef = useRef(getAudioRuntime());
  const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedCodeRef = useRef<string>("");

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

  // Live coding: auto-update when code changes while playing
  useEffect(() => {
    // Only trigger live updates when in live mode and currently playing
    if (!liveMode || playerState !== "playing") {
      return;
    }

    // Skip if code hasn't actually changed from what's currently playing
    // This prevents the restart-on-first-play bug
    if (code === lastPlayedCodeRef.current) {
      return;
    }

    // Clear any pending update
    if (liveUpdateTimeoutRef.current) {
      clearTimeout(liveUpdateTimeoutRef.current);
    }

    // Debounce the update to avoid rapid re-evaluation
    liveUpdateTimeoutRef.current = setTimeout(() => {
      // Validate before playing
      if (!validateCode(code)) {
        return;
      }

      const validation = validateRawToneCode(code);
      if (!validation.valid) {
        // Don't show errors during live typing - just skip invalid code
        return;
      }

      // Re-play the updated code, keeping the current position
      const runtime = runtimeRef.current;
      lastPlayedCodeRef.current = code;
      runtime.play(code, true).catch((err) => {
        // Silently handle errors during live coding to avoid disrupting flow
        console.warn("Live update error:", err);
      });
    }, 150); // 150ms debounce - fast for responsiveness

    return () => {
      if (liveUpdateTimeoutRef.current) {
        clearTimeout(liveUpdateTimeoutRef.current);
      }
    };
  }, [code, liveMode, playerState, validateCode]);

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
          // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [messages, audioLoaded, playCode]);

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

    // Include current code as context for the AI to make incremental changes
    const messageWithContext = `Current code:
\`\`\`js
${code}
\`\`\`

Request: ${inputValue}`;

    sendMessage({ text: messageWithContext });
    setInputValue("");
  };

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
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* Desktop Layout: Split View */}
          <div className="hidden md:flex flex-1">
            {/* Left Panel - Chat */}
            <div className="w-1/2 flex flex-col border-r border-cyan-950/50 backdrop-blur-sm">
              <ChatPanel
                messages={messages}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                statusMessage={chatStatusMessage}
              />
            </div>

            {/* Right Panel - Code & Controls */}
            <div className="w-1/2 flex flex-col backdrop-blur-sm">
              <div className="flex-1 min-h-0">
                <CodePanel
                  code={code}
                  onChange={setCode}
                  validationErrors={validationErrors}
                  defaultCode={DEFAULT_CODE}
                  liveMode={liveMode}
                  onLiveModeChange={setLiveMode}
                />
              </div>

              {/* Controls & Console */}
              <div className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50 space-y-4">
                <PlayerControls
                  playerState={playerState}
                  audioLoaded={audioLoaded}
                  onPlay={() => playCode(code)}
                  onStop={stop}
                />

                <ConsolePanel events={runtimeEvents} error={error} />
              </div>
            </div>
          </div>

          {/* Mobile Layout: Tabbed */}
          <div className="md:hidden flex flex-col flex-1">
            <MobileTabs
              code={code}
              setCode={setCode}
              validationErrors={validationErrors}
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              playerState={playerState}
              audioLoaded={audioLoaded}
              playCode={() => playCode(code)}
              stop={stop}
              defaultCode={DEFAULT_CODE}
              liveMode={liveMode}
              onLiveModeChange={setLiveMode}
              chatStatusMessage={chatStatusMessage}
            />
          </div>
        </div>
      </div>
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
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat");
  const [showSequencer, setShowSequencer] = useState(true);
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

        {activeTab === "code" && (
          <div className="flex flex-col h-full">
            {/* Toggleable Sequencer */}
            {showSequencer && (
              <div className="px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50">
                <TimelineBar barsPerRow={8} totalRows={4} />
              </div>
            )}
            <div className="flex-1 min-h-0">
              <CodePanel
                code={code}
                onChange={setCode}
                validationErrors={validationErrors}
                defaultCode={defaultCode}
                liveMode={liveMode}
                onLiveModeChange={onLiveModeChange}
                showSequencerToggle
                sequencerVisible={showSequencer}
                onSequencerToggle={() => setShowSequencer(!showSequencer)}
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
