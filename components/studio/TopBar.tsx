'use client';

import { useState, useRef, useEffect } from 'react';
import { PlayerState } from '@/lib/audio/runtime';
import { PRESETS, type Preset } from '@/lib/audio/presets';
import { WaveformVisualizer } from './WaveformVisualizer';

interface TopBarProps {
  playerState: PlayerState;
  onLoadPreset?: (code: string) => void;
}

export function TopBar({ playerState, onLoadPreset }: TopBarProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: Preset) => {
    onLoadPreset?.(preset.code);
    setShowPresets(false);
  };

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
      <div className="border-b border-cyan-950/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm relative z-30 overflow-hidden">
        {/* Full-width background waveform visualizer */}
        <div className="absolute inset-0 z-0">
          <WaveformVisualizer className="w-full h-full" fillContainer />
        </div>

        <div className="flex items-center justify-between px-6 py-4 relative z-10">
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

          <div className="flex items-center gap-3">
            {/* Demo Songs Dropdown */}
            {onLoadPreset && (
              <div className="relative z-50" ref={dropdownRef}>
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Demo Songs
                  <svg className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showPresets && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 backdrop-blur-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-800/50">
                      <h3 className="text-sm font-semibold text-cyan-400">Choose a Demo</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Load a preset to get started</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-500/10 transition-colors border-b border-slate-800 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-cyan-100">{preset.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{preset.bpm} BPM</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-cyan-500">{preset.genre}</span>
                          </div>
                          <p className="text-xs text-slate-400">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
            >
              Help
            </button>
          </div>
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
                  <li>The AI will generate Tone.js code for you</li>
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
                  <li>Valid code requires Tone.js API calls and Transport.start()</li>
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
