"use client";

import { useRef, useEffect } from "react";
import type { UIMessage } from "@ai-sdk/react";

interface ChatPanelProps {
  messages: UIMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  /** Optional status message to show below loading indicator (e.g., "Code fix failed, using previous version") */
  statusMessage?: string;
}

export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
  statusMessage,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
        {messages.map((message) => {
          const textParts = message.parts.filter((part) => part.type === "text");
          let content = textParts.map((part) => ("text" in part ? part.text : "")).join("\n");
          const isUser = message.role === "user";

          // Skip system messages
          if (message.role === "system") {
            return null;
          }

          // For user messages, extract just the request (hide code context)
          if (isUser && content.includes("Request:")) {
            const requestMatch = content.match(/Request:\s*([\s\S]*?)$/);
            if (requestMatch) {
              content = requestMatch[1].trim();
            }
          }

          // For assistant messages, extract just the Notes (hide code block)
          if (!isUser) {
            const notesMatch = content.match(/Notes?:\s*([\s\S]*?)(?=Code:|```|$)/i);
            if (notesMatch) {
              content = notesMatch[1].trim();
            }
          }

          return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg backdrop-blur-sm ${
                  isUser
                    ? "bg-gradient-to-br from-cyan-600/80 to-cyan-500/80 border border-cyan-400/30 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-800/80 border border-slate-600/50"
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
                  <div
                    className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser ? "text-white" : "text-slate-200"
                    }`}
                  >
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
                  <span className="text-sm text-slate-300">Generating code...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status message for validation failures or other states */}
        {statusMessage && !isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg backdrop-blur-sm bg-amber-900/50 border border-amber-500/30">
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-sm text-amber-200">{statusMessage}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="px-3 sm:px-4 py-3 sm:py-4 border-t border-cyan-500/20 bg-slate-900/50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Describe your beat..."
            className="flex-1 px-3 sm:px-4 py-3 sm:py-2.5 bg-slate-950/50 text-cyan-100 placeholder-slate-500 border border-cyan-500/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 text-base sm:text-sm"
            disabled={isLoading}
            data-tutorial="chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 sm:px-6 py-3 sm:py-2.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:via-cyan-400 hover:to-cyan-500 active:from-cyan-700 active:via-cyan-600 active:to-cyan-700 disabled:from-slate-700 disabled:via-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-sm font-semibold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-600 relative overflow-hidden group backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </form>
    </div>
  );
}
