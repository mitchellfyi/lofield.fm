'use client';

import { useRef, useEffect } from 'react';
import type { UIMessage } from '@ai-sdk/react';

interface ChatPanelProps {
  messages: UIMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatPanel({ 
  messages, 
  inputValue, 
  onInputChange, 
  onSubmit, 
  isLoading 
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 h-16 flex flex-col justify-center border-b border-cyan-500/20 bg-slate-900/50">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Chat Interface</h2>
        <p className="text-xs text-slate-400 mt-1">Generate and modify beats with AI</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
        {messages.map((message) => {
          const textParts = message.parts.filter(part => part.type === 'text');
          const content = textParts.map(part => ('text' in part ? part.text : '')).join('\n');
          const isUser = message.role === 'user';

          // Skip system messages
          if (message.role === 'system') {
            return null;
          }

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg backdrop-blur-sm ${
                  isUser
                    ? 'bg-gradient-to-br from-cyan-600/80 to-cyan-500/80 border border-cyan-400/30 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800/80 border border-slate-600/50'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-white/10">
                  <div className="text-[10px] font-semibold uppercase tracking-wider">
                    {isUser ? (
                      <span className="text-cyan-100">User</span>
                    ) : (
                      <span className="text-cyan-400">Assistant</span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser ? 'text-white' : 'text-slate-200'
                  }`}>
                    {content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg backdrop-blur-sm bg-slate-800/80 border border-slate-600/50">
              <div className="px-3 py-1.5 border-b border-white/10">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Assistant
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
                  </div>
                  <span className="text-sm text-slate-300">Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSubmit} className="px-4 py-4 border-t border-cyan-500/20 bg-slate-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your prompt... (e.g., 'make a lofi beat at 90bpm')"
            className="flex-1 px-4 py-2.5 bg-slate-950/50 text-cyan-100 placeholder-slate-500 border border-cyan-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 disabled:border-slate-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
