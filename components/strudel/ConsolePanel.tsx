'use client';

import { RuntimeEvent } from '@/lib/strudel/runtime';

interface ConsolePanelProps {
  events: RuntimeEvent[];
  error?: string;
}

export function ConsolePanel({ events, error }: ConsolePanelProps) {
  if (events.length === 0 && !error) {
    return null;
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'init': return '🎵';
      case 'play': return '▶️';
      case 'stop': return '⏹️';
      case 'eval_ok': return '✓';
      case 'eval_fail': return '✗';
      case 'error': return '⚠️';
      default: return '•';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error':
      case 'eval_fail':
        return 'text-rose-400';
      case 'eval_ok':
        return 'text-emerald-400';
      case 'init':
      case 'play':
        return 'text-cyan-400';
      case 'stop':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Console Log */}
      {events.length > 0 && (
        <div className="rounded-lg bg-slate-950/50 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50">
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Event Log ({events.slice(-10).length} recent)
            </div>
          </div>
          <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-cyan-500/30">
            {events.slice(-10).map((event, idx) => {
              const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              const icon = getEventIcon(event.type);
              const color = getEventColor(event.type);

              return (
                <div key={idx} className="text-xs font-mono leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 text-[10px] mt-0.5">[{time}]</span>
                    <span className="text-xs mt-0.5">{icon}</span>
                    <span className={`flex-1 ${color}`}>
                      {event.message}
                    </span>
                  </div>
                  {event.error && (
                    <div className="ml-20 text-rose-300/80 text-[10px] mt-0.5 pl-2 border-l-2 border-rose-500/30">
                      {event.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-rose-950/30 border border-rose-500/30 backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-rose-500/30 bg-rose-900/20">
            <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
              Error
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-rose-200 leading-relaxed">{error}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
