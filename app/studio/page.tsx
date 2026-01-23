'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import { validateToneCode, validateRawToneCode, extractCodeBlocks } from '@/lib/audio/llmContract';
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
// Effects Chain - Warm and spacious
// ─────────────────────────────────────────────────────────────
const masterReverb = new Tone.Reverb({ decay: 3.5, wet: 0.3 }).toDestination();
const tapeDelay = new Tone.FeedbackDelay("8n.", 0.38).connect(masterReverb);
tapeDelay.wet.value = 0.25;
const warmFilter = new Tone.Filter(2200, "lowpass").connect(tapeDelay);
const chorus = new Tone.Chorus(3, 2.5, 0.4).connect(warmFilter).start();
const vinylFilter = new Tone.Filter(4000, "lowpass").toDestination();

// ─────────────────────────────────────────────────────────────
// Drums - Dusty, laid-back kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 5,
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 }
}).toDestination();
kick.volume.value = -5;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.15 }
}).connect(masterReverb);
snare.volume.value = -9;

const rim = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }
}).toDestination();
rim.volume.value = -14;

const hihatClosed = new Tone.MetalSynth({
  frequency: 350, envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
  harmonicity: 5.1, modulationIndex: 28, resonance: 3500, octaves: 1.2
}).connect(vinylFilter);
hihatClosed.volume.value = -19;

const hihatOpen = new Tone.MetalSynth({
  frequency: 320, envelope: { attack: 0.001, decay: 0.12, release: 0.05 },
  harmonicity: 5.1, modulationIndex: 28, resonance: 3200, octaves: 1.3
}).connect(vinylFilter);
hihatOpen.volume.value = -21;

// Drum Patterns - Groove with velocity dynamics
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [0.95, null, null, 0.4, 0.9, null, 0.35, null, 0.85, null, null, 0.45, 0.9, null, 0.3, 0.5], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => v && snare.triggerAttackRelease("16n", t, v),
  [null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.35], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => v && rim.triggerAttackRelease("32n", t, v),
  [null, null, 0.5, null, null, null, null, 0.4, null, null, 0.45, null, null, null, null, null], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (v > 0.7) hihatOpen.triggerAttackRelease("32n", t, v * 0.6);
  else if (v) hihatClosed.triggerAttackRelease("32n", t, v);
}, [0.6, 0.25, 0.5, 0.3, 0.55, 0.2, 0.8, 0.35, 0.55, 0.25, 0.5, 0.3, 0.6, 0.2, 0.75, 0.4], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - Warm sub with filter movement
// ─────────────────────────────────────────────────────────────
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.03, decay: 0.25, sustain: 0.5, release: 0.6 },
  filterEnvelope: { attack: 0.04, decay: 0.15, sustain: 0.4, release: 0.5, baseFrequency: 80, octaves: 2.5 }
}).toDestination();
bass.volume.value = -7;

// Bass follows Dm7 - G7 - Cmaj7 - Am7 progression
const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "8n", t, 0.85),
  ["D2", null, "D2", "D2", null, null, "F2", null, 
   "G2", null, "G2", "G2", null, null, "B1", null,
   "C2", null, "C2", "E2", null, null, "G2", null,
   "A1", null, "A1", "C2", null, null, "E2", null], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes-style Electric Piano - Jazzy chords
// ─────────────────────────────────────────────────────────────
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 3, modulationIndex: 2,
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.2 },
  modulation: { type: "sine" },
  modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 }
}).connect(chorus);
rhodes.volume.value = -13;

// Dm7 - G7 - Cmaj7 - Am7 (2 bars each)
const chordPat = new Tone.Sequence((t, c) => c && rhodes.triggerAttackRelease(c, "1n", t, 0.4), [
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Dreamy Arpeggio - Hypnotic melodic movement
// ─────────────────────────────────────────────────────────────
const arp = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.6 }
}).connect(tapeDelay);
arp.volume.value = -14;

// Arpeggiate through chord tones
const arpPat = new Tone.Sequence((t, n) => n && arp.triggerAttackRelease(n, "16n", t, 0.55), [
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4",  // Dm7
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4",  // G7
  "C4", "E4", "G4", "B4", "G4", "E4", "C4", "B3",  // Cmaj7
  "A3", "C4", "E4", "G4", "E4", "C4", "A3", "G3"   // Am7
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Atmospheric Pad - Soft background texture
// ─────────────────────────────────────────────────────────────
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 2, decay: 1.5, sustain: 0.7, release: 3 }
}).connect(masterReverb);
pad.volume.value = -20;

const padPat = new Tone.Sequence((t, c) => c && pad.triggerAttackRelease(c, "2n", t, 0.25), [
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

  const processAssistantMessage = useCallback((fullText: string) => {
    // Use shared validator
    const validation = validateToneCode(fullText);
    
    if (validation.valid && validation.code) {
      const newCode = validation.code;
      setCode(newCode);
      setValidationErrors([]);
      
      // Auto-restart if playing
      const runtime = runtimeRef.current;
      if (runtime.getState() === 'playing' && audioLoaded) {
        playCode(newCode);
      }
    } else if (validation.code) {
      // Code extracted but has validation errors
      setCode(validation.code);
      setValidationErrors(validation.errors.map(e => e.message));
    } else {
      // Fallback: try to extract any code block
      const blocks = extractCodeBlocks(fullText);
      if (blocks.length > 0) {
        setCode(blocks[0]);
        setValidationErrors(['Code may not be valid Tone.js']);
      }
    }
  }, [audioLoaded, playCode]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract code from assistant messages
  // Note: Processing messages in useEffect is the standard pattern for chat interfaces.
  // We extract and validate code when new assistant messages arrive. The ref prevents
  // duplicate processing of the same message content.
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        // Collect all text parts
        const textParts = lastMessage.parts.filter(part => part.type === 'text');
        const fullText = textParts.map(part => part.text).join('\n');
        
        // Skip if already processed
        if (lastProcessedMessageRef.current === fullText) {
          return;
        }
        lastProcessedMessageRef.current = fullText;
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        processAssistantMessage(fullText);
      }
    }
  }, [messages, processAssistantMessage]);

  const initAudio = async () => {
    if (!audioLoaded) {
      setError('Audio system not ready. Please wait.');
      return;
    }
    try {
      const runtime = runtimeRef.current;
      await runtime.init();
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize audio: ${errorMsg}`);
    }
  };

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
                  onInitAudio={initAudio}
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
              initAudio={initAudio}
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
  initAudio: () => void;
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
  initAudio,
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
                onInitAudio={initAudio}
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
