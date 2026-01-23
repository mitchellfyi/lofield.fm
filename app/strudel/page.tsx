'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { validateStrudelCode, extractCodeBlocks } from '@/lib/strudel/llmContract';
import { getStrudelRuntime, type PlayerState, type RuntimeEvent } from '@/lib/strudel/runtime';
import { TopBar } from '@/components/strudel/TopBar';
import { ChatPanel } from '@/components/strudel/ChatPanel';
import { CodePanel } from '@/components/strudel/CodePanel';
import { PlayerControls } from '@/components/strudel/PlayerControls';
import { ConsolePanel } from '@/components/strudel/ConsolePanel';
import type { UIMessage } from '@ai-sdk/react';

const DEFAULT_CODE = `setcps(85/60/4)
stack(
  s("bd sd:1 bd sd:2").slow(2),
  s("hh*8").gain(0.4),
  note("c3 eb3 g3").s("piano").slow(4).delay(0.3)
).play()`;

// Dangerous tokens to reject
const DANGEROUS_TOKENS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'document',
  'window',
  'localStorage',
  'sessionStorage',
  'import',
  'require',
  'eval',
  'Function'
];

export default function StrudelPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [strudelLoaded, setStrudelLoaded] = useState(false);
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>('');
  const runtimeRef = useRef(getStrudelRuntime());

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
    return true;
  };

  const playCode = useCallback(async (codeToPlay: string) => {
    if (!strudelLoaded) {
      setError('Strudel not loaded yet. Please wait.');
      return;
    }

    if (!validateCode(codeToPlay)) {
      return;
    }

    // Validate Strudel code before playing
    const validation = validateStrudelCode(codeToPlay);
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
  }, [strudelLoaded]);

  const processAssistantMessage = useCallback((fullText: string) => {
    // Use shared validator
    const validation = validateStrudelCode(fullText);
    
    if (validation.valid && validation.code) {
      const newCode = validation.code;
      setCode(newCode);
      setValidationErrors([]);
      
      // Auto-restart if playing
      const runtime = runtimeRef.current;
      if (runtime.getState() === 'playing' && strudelLoaded) {
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
        setValidationErrors(['Code may not be valid Strudel - check for tempo and playback']);
      }
    }
  }, [strudelLoaded, playCode]);

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
    if (!strudelLoaded) {
      setError('Strudel not loaded yet. Please wait.');
      return;
    }
    // Double-check that the function is actually available
    if (typeof window === 'undefined' || typeof window.initStrudel === 'undefined') {
      setError('Strudel library not fully initialized. Please wait a moment and try again.');
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
    if (!strudelLoaded) {
      setError('Strudel not loaded yet.');
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
      <Script
        id="strudel-script"
        src="https://unpkg.com/@strudel/web@latest"
        strategy="afterInteractive"
        onLoad={() => {
          // Wait for Strudel library to expose its globals
          // The @strudel/web package should expose initStrudel and hush on window
          let attempts = 0;
          const maxAttempts = 200; // 20 seconds max (200 * 100ms)
          
          const checkStrudelReady = () => {
            if (typeof window === 'undefined') {
              if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStrudelReady, 100);
              }
              return;
            }

            const win = window as any;

            // Check if initStrudel is available (direct global)
            if (typeof win.initStrudel === 'function') {
              // Also ensure hush exists
              if (typeof win.hush !== 'function') {
                win.hush = () => {}; // Provide a no-op if missing
              }
              setStrudelLoaded(true);
              return;
            }

            // The library might expose it differently - check common patterns
            // Pattern 1: Namespaced under strudel object
            if (win.strudel) {
              if (typeof win.strudel.init === 'function') {
                win.initStrudel = win.strudel.init.bind(win.strudel);
                win.hush = win.strudel.hush?.bind(win.strudel) || (() => {});
                setStrudelLoaded(true);
                return;
              }
              if (typeof win.strudel.initStrudel === 'function') {
                win.initStrudel = win.strudel.initStrudel;
                win.hush = win.strudel.hush || (() => {});
                setStrudelLoaded(true);
                return;
              }
            }

            // Pattern 2: Check if Strudel code can be evaluated directly
            // Some versions might not need initStrudel - code might work directly
            if (attempts === 50) {
              // After 5 seconds, try to see if we can evaluate Strudel code directly
              try {
                // Test if basic Strudel functions are available
                const testEval = new Function('return typeof setcps !== "undefined" || typeof s !== "undefined"');
                if (testEval()) {
                  // Strudel is available but might not need initStrudel
                  // Create a no-op initStrudel for compatibility
                  win.initStrudel = () => {
                    console.log('Strudel already initialized or does not require explicit init');
                  };
                  win.hush = win.hush || (() => {
                    // Try to find hush function
                    if (typeof win.hush === 'function') return win.hush;
                    // Try to stop any playing patterns
                    try {
                      const hushEval = new Function('if (typeof hush === "function") hush();');
                      hushEval();
                    } catch (e) {
                      // Ignore
                    }
                  });
                  setStrudelLoaded(true);
                  return;
                }
              } catch (e) {
                // Continue checking
              }
            }

            // Continue polling
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkStrudelReady, 100);
            } else {
              // Final attempt: Log everything for debugging
              const allKeys = Object.keys(win);
              const relevantKeys = allKeys.filter(k => 
                k.toLowerCase().includes('strudel') || 
                k.toLowerCase().includes('init') ||
                k === 'hush' ||
                k.startsWith('$')
              );
              
              console.error('=== Strudel Loading Debug Info ===');
              console.error('Relevant window keys:', relevantKeys);
              console.error('Total window keys:', allKeys.length);
              console.error('Script src:', 'https://unpkg.com/@strudel/web@latest');
              console.error('Attempts made:', attempts);
              
              // Check if script actually loaded
              const script = document.getElementById('strudel-script');
              console.error('Script element:', script ? 'found' : 'not found');
              if (script) {
                console.error('Script src attribute:', (script as HTMLScriptElement).src);
              }
              
              setError(`Strudel library loaded but initStrudel function not found after ${maxAttempts} attempts. Please check the browser console for debugging information. The library may have changed its API.`);
            }
          };
          
          // Start checking after a longer delay to allow script execution and module initialization
          setTimeout(checkStrudelReady, 500);
        }}
        onError={(e) => {
          console.error('Failed to load Strudel library:', e);
          setError('Failed to load Strudel library. Please check your internet connection and try refreshing the page.');
        }}
      />
      
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
                  strudelLoaded={strudelLoaded}
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
              strudelLoaded={strudelLoaded}
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
  strudelLoaded: boolean;
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
  strudelLoaded,
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
                strudelLoaded={strudelLoaded}
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
