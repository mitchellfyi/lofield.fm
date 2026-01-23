'use client';

import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { syntaxHighlighting } from '@codemirror/language';
import { HighlightStyle } from '@lezer/highlight';
import { tags } from '@lezer/highlight';

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
  validationErrors: string[];
  defaultCode: string;
}

// Syntax highlighting with high contrast colors
const syntaxHighlight = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.keyword, color: '#c792ea' }, // Purple for keywords (const, let, function, etc.)
  { tag: tags.string, color: '#c3e88d' }, // Green for strings
  { tag: tags.number, color: '#f78c6c' }, // Orange for numbers
  { tag: tags.comment, color: '#546e7a', fontStyle: 'italic' }, // Gray for comments
  { tag: tags.variableName, color: '#eeffff' }, // Light cyan for variables
  { tag: tags.function(tags.variableName), color: '#82aaff' }, // Blue for functions
  { tag: tags.className, color: '#ffcb6b' }, // Yellow for classes
  { tag: tags.propertyName, color: '#c792ea' }, // Purple for properties
  { tag: tags.operator, color: '#89ddff' }, // Cyan for operators
  { tag: tags.punctuation, color: '#eeffff' }, // Light for punctuation
  { tag: tags.bracket, color: '#eeffff' }, // Light for brackets
  { tag: tags.tagName, color: '#f07178' }, // Red for tags
  { tag: tags.attributeName, color: '#c792ea' }, // Purple for attributes
]));

// Custom dark theme matching page background
const customTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0f172a', // slate-900 - matches page background
    color: '#e2e8f0', // slate-200 - matches page foreground
    height: '100%',
  },
  '.cm-editor': {
    backgroundColor: '#0f172a', // slate-900
    height: '100%',
  },
  '.cm-scroller': {
    backgroundColor: '#0f172a', // slate-900
    overflow: 'auto',
  },
  '.cm-content': {
    backgroundColor: '#0f172a', // slate-900
    padding: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.75',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    caretColor: '#22d3ee', // cyan-400
    color: '#e2e8f0', // slate-200
  },
  '.cm-focused': {
    outline: '2px solid rgba(34, 211, 238, 0.5)', // cyan-500/50
    outlineOffset: '-2px',
  },
  '.cm-gutters': {
    backgroundColor: '#0f172a', // slate-900
    borderRight: '1px solid rgba(34, 211, 238, 0.2)', // cyan-500/20
    color: '#64748b', // slate-500
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 0.5rem',
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(34, 211, 238, 0.1)', // cyan-500/10
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(34, 211, 238, 0.05)', // cyan-500/5
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(34, 211, 238, 0.2)', // cyan-500/20
  },
  '.cm-line': {
    backgroundColor: 'transparent',
  },
  '.cm-cursor': {
    borderLeftColor: '#22d3ee', // cyan-400
  },
  '.cm-selectionMatch': {
    backgroundColor: 'rgba(34, 211, 238, 0.15)', // cyan-500/15
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(34, 211, 238, 0.2)', // cyan-500/20
    outline: '1px solid rgba(34, 211, 238, 0.5)', // cyan-500/50
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: 'rgba(239, 68, 68, 0.2)', // red-500/20
  },
}, { dark: true });

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

      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        <CodeMirror
          value={code}
          onChange={onChange}
          height="100%"
          extensions={[
            javascript({ jsx: false }),
            customTheme,
            syntaxHighlight,
            EditorView.lineWrapping
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            highlightSelectionMatches: false,
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
