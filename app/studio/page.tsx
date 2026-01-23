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
// Trancey Lofi - Dreamy downtempo with hypnotic arpeggios
// ═══════════════════════════════════════════════════════════

// Set tempo - slow and dreamy
Tone.Transport.bpm.value = 78;
Tone.Transport.swing = 0.02;

// ─────────────────────────────────────────────────────────────
// Effects chain
// ─────────────────────────────────────────────────────────────
const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
const delay = new Tone.FeedbackDelay("8n.", 0.4).connect(reverb);
const filter = new Tone.Filter(800, "lowpass").connect(delay);
const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(filter).start();

// ─────────────────────────────────────────────────────────────
// Drums - dusty lofi kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05,
  octaves: 4,
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
}).toDestination();
kick.volume.value = -6;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
}).toDestination();
snare.volume.value = -12;

const hat = new Tone.MetalSynth({
  frequency: 300,
  envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5
}).toDestination();
hat.volume.value = -20;

// Drum patterns
const kickSeq = new Tone.Sequence((time, vel) => {
  if (vel) kick.triggerAttackRelease("C1", "8n", time, vel);
}, [0.9, null, null, 0.5, 0.9, null, 0.3, null], "8n").start(0);

const snareSeq = new Tone.Sequence((time, vel) => {
  if (vel) snare.triggerAttackRelease("8n", time, vel);
}, [null, null, 0.8, null, null, null, 0.7, 0.3], "8n").start(0);

const hatSeq = new Tone.Sequence((time, vel) => {
  if (vel) hat.triggerAttackRelease("32n", time, vel);
}, [0.5, 0.3, 0.5, 0.3, 0.5, 0.3, 0.5, 0.4], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - deep sub bass
// ─────────────────────────────────────────────────────────────
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
  filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 100, octaves: 2 }
}).toDestination();
bass.volume.value = -8;

const bassSeq = new Tone.Sequence((time, note) => {
  if (note) bass.triggerAttackRelease(note, "4n", time);
}, ["C2", null, "C2", null, "Eb2", null, "G1", null], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Trance arpeggio - hypnotic pattern
// ─────────────────────────────────────────────────────────────
const arp = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.8 }
}).connect(chorus);
arp.volume.value = -14;

const arpNotes = ["C4", "Eb4", "G4", "Bb4", "C5", "Bb4", "G4", "Eb4"];
const arpSeq = new Tone.Sequence((time, note) => {
  arp.triggerAttackRelease(note, "16n", time, 0.5);
}, arpNotes, "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - warm atmospheric chords
// ─────────────────────────────────────────────────────────────
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.8, release: 2 }
}).connect(reverb);
pad.volume.value = -18;

const padSeq = new Tone.Sequence((time, chord) => {
  if (chord) pad.triggerAttackRelease(chord, "2n", time, 0.3);
}, [["C3", "Eb3", "G3", "Bb3"], null, null, null, ["Ab2", "C3", "Eb3", "G3"], null, null, null], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Cleanup function for when code restarts
// ─────────────────────────────────────────────────────────────
window.__toneCleanup = () => {
  [kickSeq, snareSeq, hatSeq, bassSeq, arpSeq, padSeq].forEach(s => s.dispose());
  [kick, snare, hat, bass, arp, pad].forEach(s => s.dispose());
  [reverb, delay, filter, chorus].forEach(e => e.dispose());
};

// Start the transport
Tone.Transport.start();`;

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
const ALLOWED_PATTERNS = [
  '__toneCleanup' // Cleanup function for Tone.js
];

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

  const validateCode = (code: string): boolean => {
    for (const token of DANGEROUS_TOKENS) {
      if (code.includes(token)) {
        setError(`Code contains dangerous token: ${token}`);
        return false;
      }
    }
    
    // Check for window usage - only allow __toneCleanup
    if (code.includes('window')) {
      // Remove allowed patterns and check if window is still used
      let codeWithoutAllowed = code;
      for (const pattern of ALLOWED_PATTERNS) {
        codeWithoutAllowed = codeWithoutAllowed.replace(new RegExp(`window\\.${pattern}`, 'g'), '');
      }
      if (codeWithoutAllowed.includes('window')) {
        setError('Code contains dangerous token: window (only window.__toneCleanup is allowed)');
        return false;
      }
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
        setValidationErrors(['Code may not be valid Tone.js - check for Transport.start()']);
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
        <TopBar playerState={playerState} />

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
              <div className="flex-1 overflow-hidden">
                <CodePanel
                  code={code}
                  onChange={setCode}
                  validationErrors={validationErrors}
                  defaultCode={DEFAULT_CODE}
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
            <div className="flex-1 overflow-hidden">
              <CodePanel
                code={code}
                onChange={setCode}
                validationErrors={validationErrors}
                defaultCode={defaultCode}
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
