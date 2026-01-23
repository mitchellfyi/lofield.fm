'use client';

import { useTransportState } from '@/lib/audio/useVisualization';

interface TimelineBarProps {
  barsPerRow?: number;
  totalRows?: number;
}

export function TimelineBar({ barsPerRow = 8, totalRows = 4 }: TimelineBarProps) {
  const transport = useTransportState();
  const totalBars = barsPerRow * totalRows;

  // Current bar position (0-indexed for calculations)
  const currentBar = ((transport.bar - 1) % totalBars);
  const currentRow = Math.floor(currentBar / barsPerRow);
  const currentBarInRow = currentBar % barsPerRow;

  // Playhead position within current row
  const progressInBar = (transport.beat - 1 + transport.progress) / 4; // Assuming 4 beats per bar
  const playheadPosition = ((currentBarInRow + progressInBar) / barsPerRow) * 100;

  // Section labels
  const sectionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header: BPM and Position */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">BPM</span>
            <span className="text-sm font-mono text-white tabular-nums">{transport.bpm}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Loop</span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">{totalBars} bars</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">BAR</span>
          <span className="text-sm font-mono text-white tabular-nums">
            {transport.bar}/{totalBars}
          </span>
        </div>
      </div>

      {/* 4 rows x 8 bars grid */}
      <div className="flex flex-col gap-0.5">
        {Array.from({ length: totalRows }).map((_, rowIdx) => {
          const isCurrentRow = transport.playing && rowIdx === currentRow;
          const isPastRow = transport.playing && rowIdx < currentRow;

          return (
            <div key={rowIdx} className="flex items-center gap-1">
              {/* Section label */}
              <div
                className={`
                  w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold
                  ${isCurrentRow ? 'bg-cyan-500 text-white' : isPastRow ? 'bg-slate-700 text-slate-400' : 'bg-slate-800 text-slate-500'}
                  transition-colors duration-150
                `}
              >
                {sectionLabels[rowIdx]}
              </div>

              {/* Bar grid for this row */}
              <div className="flex-1 relative h-5 rounded bg-slate-900/80 border border-cyan-500/20 overflow-hidden">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: barsPerRow }).map((_, barIdx) => {
                    const absoluteBar = rowIdx * barsPerRow + barIdx;
                    const isCurrentBarCell = transport.playing && absoluteBar === currentBar;
                    const isPastBar = transport.playing && absoluteBar < currentBar;
                    const isDownbeat = barIdx === 0 || barIdx === 4; // Emphasize 1 and 5

                    return (
                      <div
                        key={barIdx}
                        className={`
                          flex-1 flex items-center justify-center border-r border-slate-700/30 last:border-r-0
                          ${isDownbeat ? 'bg-cyan-500/5' : ''}
                          ${isCurrentBarCell ? 'bg-cyan-500/30' : isPastBar ? 'bg-slate-700/30' : ''}
                          transition-colors duration-75
                        `}
                      >
                        <span
                          className={`
                            text-[9px] font-mono
                            ${isCurrentBarCell ? 'text-cyan-300 font-bold' : isPastBar ? 'text-slate-600' : 'text-slate-500'}
                          `}
                        >
                          {absoluteBar + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Playhead - only on current row */}
                {isCurrentRow && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] z-10"
                      style={{ left: `${playheadPosition}%`, transition: 'left 16ms linear' }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"
                      style={{ left: `calc(${playheadPosition}% - 0.75rem)`, transition: 'left 16ms linear' }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
