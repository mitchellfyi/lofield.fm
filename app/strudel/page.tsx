'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { validateStrudelCode, extractCodeBlocks } from '@/lib/strudel/llmContract';
import { getStrudelRuntime, type PlayerState, type RuntimeEvent } from '@/lib/strudel/runtime';

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
        src="https://unpkg.com/@strudel/web@1.0.1"
        onLoad={() => {
          // Wait for Strudel library to actually expose its globals
          // The script may load before the library initializes its globals
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max (50 * 100ms)
          const checkStrudelReady = () => {
            if (typeof window !== 'undefined' && typeof window.initStrudel !== 'undefined') {
              setStrudelLoaded(true);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkStrudelReady, 100);
            } else {
              setError('Strudel library loaded but initStrudel not available');
            }
          };
          checkStrudelReady();
        }}
        onError={() => setError('Failed to load Strudel library')}
      />
      <div className="flex h-screen bg-zinc-900 text-white">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r border-zinc-700">
          <div className="p-4 border-b border-zinc-700">
            <h1 className="text-2xl font-bold">Strudel Chat</h1>
            <p className="text-sm text-zinc-400">Chat to generate and modify beats</p>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const textParts = message.parts.filter(part => part.type === 'text');
              const content = textParts.map(part => part.text).join('\n');
              
              return (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 ml-auto max-w-[80%]'
                      : 'bg-zinc-800 mr-auto max-w-[80%]'
                  }`}
                >
                  <div className="text-xs text-zinc-400 mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{content}</div>
                </div>
              );
            })}
            {isLoading && (
              <div className="p-3 rounded-lg bg-zinc-800 mr-auto max-w-[80%]">
                <div className="text-xs text-zinc-400 mb-1">Assistant</div>
                <div>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message... (e.g., 'make a lofi beat at 90bpm')"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel - Code & Controls */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-zinc-700">
            <h2 className="text-xl font-bold">Code Editor</h2>
          </div>

          {/* Code Editor */}
          <div className="flex-1 p-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              spellCheck={false}
            />
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-zinc-700 space-y-4">
            <div className="flex gap-2 items-center">
              <button
                onClick={initAudio}
                disabled={!strudelLoaded || playerState !== 'idle'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Init Audio
              </button>
              <button
                onClick={() => playCode(code)}
                disabled={!strudelLoaded || playerState === 'loading' || playerState === 'error'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                {playerState === 'playing' ? 'Restart' : 'Play'}
              </button>
              <button
                onClick={stop}
                disabled={playerState !== 'playing'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Stop
              </button>
              <div className="ml-auto text-sm">
                <span className="text-zinc-400">State: </span>
                <span className={`font-semibold ${
                  playerState === 'playing' ? 'text-green-400' :
                  playerState === 'error' ? 'text-red-400' :
                  playerState === 'loading' ? 'text-yellow-400' :
                  playerState === 'ready' ? 'text-blue-400' :
                  'text-zinc-400'
                }`}>
                  {playerState}
                </span>
              </div>
            </div>

            {/* Console Panel */}
            {runtimeEvents.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                <div className="text-xs font-semibold text-zinc-400 mb-2">Console (last {runtimeEvents.length} events)</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {runtimeEvents.map((event, idx) => {
                    const time = new Date(event.timestamp).toLocaleTimeString();
                    const icon = 
                      event.type === 'init' ? '🎵' :
                      event.type === 'play' ? '▶️' :
                      event.type === 'stop' ? '⏹️' :
                      event.type === 'eval_ok' ? '✓' :
                      event.type === 'eval_fail' ? '✗' :
                      '⚠️';
                    
                    return (
                      <div key={idx} className="text-xs font-mono">
                        <span className="text-zinc-500">[{time}]</span>
                        <span className="ml-2">{icon}</span>
                        <span className={`ml-2 ${
                          event.type === 'error' || event.type === 'eval_fail' ? 'text-red-400' :
                          event.type === 'eval_ok' ? 'text-green-400' :
                          'text-zinc-300'
                        }`}>
                          {event.message}
                        </span>
                        {event.error && (
                          <div className="ml-8 text-red-300 mt-1">
                            {event.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-sm text-yellow-200">
                <div className="font-semibold mb-1">⚠️ Validation Issues:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
