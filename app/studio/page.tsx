'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import { validateToneCode, validateRawToneCode, extractStreamingCode } from '@/lib/audio/llmContract';
import { getAudioRuntime, type PlayerState, type RuntimeEvent } from '@/lib/audio/runtime';
import { TopBar } from '@/components/studio/TopBar';
import { ChatPanel } from '@/components/studio/ChatPanel';
import { CodePanel } from '@/components/studio/CodePanel';
import { PlayerControls } from '@/components/studio/PlayerControls';
import { ConsolePanel } from '@/components/studio/ConsolePanel';
import type { UIMessage } from '@ai-sdk/react';

const DEFAULT_CODE = `// ═══════════════════════════════════════════════════════════
// Midnight Lofi - Chill beats to code/relax to
// ═══════════════════════════════════════════════════════════

// Tempo & Feel
Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;

// ─────────────────────────────────────────────────────────────
// Master Chain - Warmth and glue
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.1, release: 0.25 }).connect(limiter);
const masterLowpass = new Tone.Filter(8000, "lowpass").connect(masterComp);
const masterReverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(masterLowpass);
const tapeDelay = new Tone.FeedbackDelay("8n.", 0.32).connect(masterReverb);
tapeDelay.wet.value = 0.2;
const warmFilter = new Tone.Filter(1800, "lowpass").connect(tapeDelay);
const chorus = new Tone.Chorus(2.5, 3.5, 0.5).connect(warmFilter).start();
const vinylFilter = new Tone.Filter(2500, "lowpass").connect(masterLowpass);

// ─────────────────────────────────────────────────────────────
// Drums - Dusty, punchy kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05, octaves: 6,
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
}).connect(masterComp);
kick.volume.value = -4;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.15 }
}).connect(masterReverb);
snare.volume.value = -8;

const rim = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 }
}).connect(masterLowpass);
rim.volume.value = -16;

const hihatClosed = new Tone.MetalSynth({
  frequency: 250, envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
  harmonicity: 4, modulationIndex: 20, resonance: 1800, octaves: 1
}).connect(vinylFilter);
hihatClosed.volume.value = -22;

const hihatOpen = new Tone.MetalSynth({
  frequency: 220, envelope: { attack: 0.001, decay: 0.15, release: 0.08 },
  harmonicity: 4, modulationIndex: 18, resonance: 1500, octaves: 1
}).connect(vinylFilter);
hihatOpen.volume.value = -24;

// Drum Patterns
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [0.95, null, null, 0.5, 0.9, null, 0.4, null, 0.85, null, null, 0.5, 0.9, null, 0.35, 0.55], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => v && snare.triggerAttackRelease("16n", t, v),
  [null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.4], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => v && rim.triggerAttackRelease("32n", t, v),
  [null, null, 0.5, null, null, null, null, 0.45, null, null, 0.5, null, null, null, null, null], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (v > 0.7) hihatOpen.triggerAttackRelease("32n", t, v * 0.5);
  else if (v) hihatClosed.triggerAttackRelease("32n", t, v);
}, [0.5, 0.2, 0.4, 0.25, 0.45, 0.2, 0.75, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.7, 0.35], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - Fat sub with warmth
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(600, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
  filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -6;

const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "8n", t, 0.85),
  ["D2", null, "D2", "D2", null, null, "F2", null,
   "G2", null, "G2", "G2", null, null, "B1", null,
   "C2", null, "C2", "E2", null, null, "G2", null,
   "A1", null, "A1", "C2", null, null, "E2", null], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes-style Electric Piano - Warm jazzy chords
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

const chordPat = new Tone.Sequence((t, c) => c && rhodes.triggerAttackRelease(c, "1n", t, 0.5), [
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - Warm melodic movement
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(2500, "lowpass").connect(tapeDelay);
const arp = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
}).connect(arpFilter);
arp.volume.value = -13;

const arpPat = new Tone.Sequence((t, n) => n && arp.triggerAttackRelease(n, "16n", t, 0.6), [
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4",
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4",
  "C4", "E4", "G4", "B4", "G4", "E4", "C4", "B3",
  "A3", "C4", "E4", "G4", "E4", "C4", "A3", "G3"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - Warm atmospheric texture
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1200, "lowpass").connect(masterReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.8, release: 2.5 }
}).connect(padFilter);
pad.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => c && pad.triggerAttackRelease(c, "2n", t, 0.3), [
  ["D4", "A4"], null, null, null, ["G4", "D5"], null, null, null,
  ["C4", "G4"], null, null, null, ["A3", "E4"], null, null, null
], "1n").start(0);`;

// Dangerous tokens to reject
const DANGEROUS_TOKENS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'document',
  'localStorage',
  'sessionStorage',
  'import',
  'require',
  'eval',
  'Function'
];

// Patterns that are allowed even if they contain blocked words
const ALLOWED_PATTERNS: string[] = [];

export default function StudioPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [audioLoaded, setAudioLoaded] = useState(true); // Tone.js is always available as a module
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [liveMode, setLiveMode] = useState(true); // Live coding mode - auto-update on edit
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>('');
  const runtimeRef = useRef(getAudioRuntime());
  const liveUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
  });

  const isLoading = chatStatus === 'submitted' || chatStatus === 'streaming';

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
    if (!liveMode || playerState !== 'playing') {
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

      // Re-play the updated code
      const runtime = runtimeRef.current;
      runtime.play(code).catch((err) => {
        // Silently handle errors during live coding to avoid disrupting flow
        console.warn('Live update error:', err);
      });
    }, 500); // 500ms debounce

    return () => {
      if (liveUpdateTimeoutRef.current) {
        clearTimeout(liveUpdateTimeoutRef.current);
      }
    };
  }, [code, liveMode, playerState]);

  const validateCode = (code: string): boolean => {
    for (const token of DANGEROUS_TOKENS) {
      if (code.includes(token)) {
        setError(`Code contains dangerous token: ${token}`);
        return false;
      }
    }
    
    // Check for window usage - not allowed in user code
    if (code.includes('window')) {
      setError('Code contains dangerous token: window');
      return false;
    }
    
    return true;
  };

  const playCode = useCallback(async (codeToPlay: string) => {
    if (!audioLoaded) {
      setError('Audio system not ready. Please wait.');
      return;
    }

    if (!validateCode(codeToPlay)) {
      return;
    }

    // Validate raw Tone.js code before playing (code from editor, not LLM response)
    const validation = validateRawToneCode(codeToPlay);
    if (!validation.valid) {
      setError(`Code validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      setValidationErrors(validation.errors.map(e => e.message));
      return;
    }

    try {
      const runtime = runtimeRef.current;
      await runtime.play(codeToPlay);
      setError('');
      setValidationErrors([]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to play: ${errorMsg}`);
    }
  }, [audioLoaded]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract code from assistant messages - LIVE during streaming
  // Updates the code editor in real-time as the AI generates code
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // Collect all text parts
        const textParts = lastMessage.parts.filter(part => part.type === 'text');
        const fullText = textParts.map(part => part.text).join('\n');

        // Skip if already processed this exact text
        if (lastProcessedMessageRef.current === fullText) {
          return;
        }

        // Extract code (handles both complete and streaming code blocks)
        const { code, isComplete } = extractStreamingCode(fullText);

        if (code) {
          // Update the code editor live as text streams in
          setCode(code);

          if (isComplete) {
            // Code block is complete - do final validation and auto-restart if playing
            lastProcessedMessageRef.current = fullText;

            const validation = validateToneCode(fullText);
            if (validation.valid) {
              setValidationErrors([]);
              // Auto-restart if playing
              const runtime = runtimeRef.current;
              if (runtime.getState() === 'playing' && audioLoaded) {
                playCode(code);
              }
            } else {
              setValidationErrors(validation.errors.map(e => e.message));
            }
          }
          // While streaming (isComplete=false), just update the editor without validation
        }
      }
    }
  }, [messages, audioLoaded, playCode]);

  const stop = () => {
    if (!audioLoaded) {
      setError('Audio system not ready.');
      return;
    }
    try {
      const runtime = runtimeRef.current;
      runtime.stop();
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to stop: ${errorMsg}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
        {/* Animated background effect */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        
        {/* Top Bar */}
        <TopBar playerState={playerState} onLoadPreset={setCode} />

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
              runtimeEvents={runtimeEvents}
              error={error}
              defaultCode={DEFAULT_CODE}
              liveMode={liveMode}
              onLiveModeChange={setLiveMode}
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
  runtimeEvents: RuntimeEvent[];
  error: string;
  defaultCode: string;
  liveMode: boolean;
  onLiveModeChange: (enabled: boolean) => void;
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
  runtimeEvents,
  error,
  defaultCode,
  liveMode,
  onLiveModeChange,
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'console'>('chat');

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex border-b border-cyan-500/20 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'chat'
              ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'code'
              ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'console'
              ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-500/10'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          Console
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatPanel
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'code' && (
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
            <div className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50">
              <PlayerControls
                playerState={playerState}
                audioLoaded={audioLoaded}
                onPlay={playCode}
                onStop={stop}
              />
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="h-full overflow-y-auto p-4">
            <ConsolePanel events={runtimeEvents} error={error} />
          </div>
        )}
      </div>
    </>
  );
}
