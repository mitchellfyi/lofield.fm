'use client';

import { useTransportState } from '@/lib/audio/useVisualization';

interface TimelineBarProps {
  beatsPerBar?: number;
  barsToShow?: number;
}

export function TimelineBar({ beatsPerBar = 4, barsToShow = 2 }: TimelineBarProps) {
  const transport = useTransportState();

  // Calculate playhead position as percentage across all visible beats
  const totalBeats = beatsPerBar * barsToShow;
  const currentBeatInCycle =
    ((transport.bar - 1) % barsToShow) * beatsPerBar +
    (transport.beat - 1) +
    transport.progress;
  const playheadPosition = (currentBeatInCycle / totalBeats) * 100;

  return (
    <div className="flex flex-col gap-2">
      {/* BPM and Position Display */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">BPM</span>
            <span className="text-sm font-mono text-white tabular-nums">{transport.bpm}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">POS</span>
          <span className="text-sm font-mono text-white tabular-nums">
            {transport.bar}:{transport.beat}
          </span>
        </div>
      </div>

      {/* Beat Grid */}
      <div className="relative h-8 rounded-md bg-slate-900/80 border border-cyan-500/20 overflow-hidden">
        {/* Beat markers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: barsToShow }).map((_, barIdx) => (
            <div key={barIdx} className="flex-1 flex border-r border-cyan-500/30 last:border-r-0">
              {Array.from({ length: beatsPerBar }).map((_, beatIdx) => {
                const isDownbeat = beatIdx === 0;
                const beatNumber = barIdx * beatsPerBar + beatIdx + 1;
                const isCurrentBeat =
                  transport.playing &&
                  Math.floor(currentBeatInCycle) === barIdx * beatsPerBar + beatIdx;

                return (
                  <div
                    key={beatIdx}
                    className={`
                      flex-1 flex items-center justify-center border-r border-slate-700/50 last:border-r-0
                      ${isDownbeat ? 'bg-cyan-500/10' : ''}
                      ${isCurrentBeat ? 'bg-cyan-500/20' : ''}
                      transition-colors duration-75
                    `}
                  >
                    <span
                      className={`
                        text-[10px] font-mono
                        ${isDownbeat ? 'text-cyan-400 font-bold' : 'text-slate-500'}
                        ${isCurrentBeat ? 'text-cyan-300' : ''}
                      `}
                    >
                      {beatNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Playhead */}
        {transport.playing && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-[left] duration-[16ms] linear"
            style={{ left: `${playheadPosition}%` }}
          />
        )}

        {/* Glow effect at playhead position */}
        {transport.playing && (
          <div
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none transition-[left] duration-[16ms] linear"
            style={{ left: `calc(${playheadPosition}% - 1rem)` }}
          />
        )}
      </div>
    </div>
  );
}
