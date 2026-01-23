'use client';

import { useState } from 'react';
import { PlayerState } from '@/lib/strudel/runtime';

interface TopBarProps {
  playerState: PlayerState;
}

export function TopBar({ playerState }: TopBarProps) {
  const [showHelp, setShowHelp] = useState(false);

  const getStateColor = () => {
    switch (playerState) {
      case 'playing':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'ready':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'loading':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'error':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getStateLabel = () => {
    return playerState.toUpperCase();
  };

  return (
    <>
      <div className="border-b border-cyan-950/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                LoField Music Lab
              </h1>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all duration-300 ${getStateColor()}`}>
              {getStateLabel()}
            </div>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
          >
            Help
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
              <h2 className="text-xl font-bold text-cyan-300">How to Use LoField Music Lab</h2>
            </div>
            
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Getting Started</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
                  <li>Click "Init Audio" to initialize the audio engine</li>
                  <li>Type your prompt in the chat (e.g., "make a lofi beat at 90bpm")</li>
                  <li>The AI will generate Strudel code for you</li>
                  <li>Click "Play" to hear your beat</li>
                  <li>Modify the code or chat again to iterate</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Example Prompts</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="pl-4 border-l-2 border-cyan-500/30">"Create a minimal techno beat at 128 bpm"</li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">"Make a relaxed lofi beat with piano"</li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">"Add a hi-hat pattern to the current beat"</li>
                  <li className="pl-4 border-l-2 border-cyan-500/30">"Slow down the tempo to 85 bpm"</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Tips</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                  <li>You can edit the code directly in the editor</li>
                  <li>Watch the console for events and errors</li>
                  <li>Valid code requires a tempo (setcps) and .play() call</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
