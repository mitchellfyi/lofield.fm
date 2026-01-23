'use client';

import { useState } from 'react';

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
  validationErrors: string[];
  defaultCode: string;
}

export function CodePanel({ code, onChange, validationErrors, defaultCode }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevert = () => {
    onChange(defaultCode);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-16 border-b border-cyan-500/20 bg-slate-900/50">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Code Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRevert}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/50 transition-all duration-200"
          >
            Revert
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/50 transition-all duration-200"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-4 bg-slate-950/50 text-cyan-100 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none border-0"
          spellCheck={false}
          style={{
            caretColor: '#22d3ee',
          }}
        />
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] opacity-20" />
      </div>

      {validationErrors.length > 0 && (
        <div className="px-4 py-3 bg-amber-950/30 border-t border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-400 mb-1">Validation Issues</div>
              <ul className="text-xs text-amber-200 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="leading-relaxed">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
