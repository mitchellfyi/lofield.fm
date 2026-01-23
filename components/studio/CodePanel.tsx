"use client";

import { useState, useEffect, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useActiveLines } from "@/lib/audio/useVisualization";
import {
  activeLinesField,
  activeLinesPlugin,
  visualizationTheme,
  setActiveLines,
} from "@/lib/codemirror/visualizationExtension";

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
  validationErrors: string[];
  defaultCode: string;
  liveMode?: boolean;
  onLiveModeChange?: (enabled: boolean) => void;
  // Mobile-only props for sequencer toggle
  showSequencerToggle?: boolean;
  sequencerVisible?: boolean;
  onSequencerToggle?: () => void;
}

// Syntax highlighting with high contrast colors
const syntaxHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#22d3ee" }, // Cyan for keywords (const, let, function, etc.)
    { tag: tags.string, color: "#67e8f9" }, // Green for strings
    { tag: tags.number, color: "#67e8f9" }, // Light blue for numbers
    { tag: tags.comment, color: "#546e7a", fontStyle: "italic" }, // Gray for comments
    { tag: tags.variableName, color: "#eeffff" }, // Light cyan for variables
    { tag: tags.function(tags.variableName), color: "#82aaff" }, // Blue for functions
    { tag: tags.className, color: "#ffcb6b" }, // Yellow for classes
    { tag: tags.propertyName, color: "#82aaff" }, // Lime green for properties
    { tag: tags.operator, color: "#89ddff" }, // Cyan for operators
    { tag: tags.punctuation, color: "#eeffff" }, // Light for punctuation
    { tag: tags.bracket, color: "#eeffff" }, // Light for brackets
    { tag: tags.tagName, color: "#f07178" }, // Red for tags
    { tag: tags.attributeName, color: "#c792ea" }, // Purple for attributes
  ])
);

// Custom dark theme matching page background
const customTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0f172a", // slate-900 - matches page background
      color: "#e2e8f0", // slate-200 - matches page foreground
    },
    ".cm-editor": {
      backgroundColor: "#0f172a", // slate-900
    },
    ".cm-scroller": {
      backgroundColor: "#0f172a", // slate-900
    },
    ".cm-content": {
      backgroundColor: "#0f172a", // slate-900
      padding: "0.75rem",
      fontSize: "0.75rem",
      lineHeight: "1.6",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      caretColor: "#22d3ee", // cyan-400
      color: "#e2e8f0", // slate-200
    },
    ".cm-focused": {
      outline: "2px solid rgba(34, 211, 238, 0.5)", // cyan-500/50
      outlineOffset: "-2px",
    },
    ".cm-gutters": {
      backgroundColor: "#0f172a", // slate-900
      borderRight: "1px solid rgba(34, 211, 238, 0.2)", // cyan-500/20
      color: "#64748b", // slate-500
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 0.5rem",
      backgroundColor: "transparent",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(34, 211, 238, 0.1)", // cyan-500/10
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(34, 211, 238, 0.05)", // cyan-500/5
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(34, 211, 238, 0.2)", // cyan-500/20
    },
    ".cm-line": {
      backgroundColor: "transparent",
    },
    ".cm-cursor": {
      borderLeftColor: "#22d3ee", // cyan-400
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(34, 211, 238, 0.15)", // cyan-500/15
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(34, 211, 238, 0.2)", // cyan-500/20
      outline: "1px solid rgba(34, 211, 238, 0.5)", // cyan-500/50
    },
    ".cm-nonmatchingBracket": {
      backgroundColor: "rgba(239, 68, 68, 0.2)", // red-500/20
    },
  },
  { dark: true }
);

export function CodePanel({
  code,
  onChange,
  validationErrors,
  defaultCode,
  liveMode = true,
  onLiveModeChange,
  showSequencerToggle,
  sequencerVisible,
  onSequencerToggle,
}: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const activeLines = useActiveLines();

  // Sync active lines from visualization bridge to CodeMirror
  useEffect(() => {
    const view = editorRef.current?.view;
    if (view) {
      view.dispatch({
        effects: setActiveLines.of(activeLines),
      });
    }
  }, [activeLines]);

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
      <div className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-16 border-b border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Code
          </h2>
          {onLiveModeChange && (
            <button
              onClick={() => onLiveModeChange(!liveMode)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                liveMode
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600"
              }`}
              title={
                liveMode
                  ? "Live mode ON - code updates instantly"
                  : "Live mode OFF - press Play to update"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${liveMode ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
              />
              Live
            </button>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {/* Sequencer toggle - mobile only */}
          {showSequencerToggle && (
            <button
              onClick={onSequencerToggle}
              className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
                sequencerVisible
                  ? "text-cyan-400 border border-cyan-500/50 bg-cyan-500/10"
                  : "text-slate-400 border border-slate-600"
              }`}
              title={sequencerVisible ? "Hide sequencer" : "Show sequencer"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </button>
          )}
          <button
            onClick={handleRevert}
            className="px-2 sm:px-3 py-1.5 rounded-sm text-[10px] sm:text-xs font-medium text-slate-300 hover:text-cyan-300 active:text-cyan-400 border border-slate-600 hover:border-cyan-500/50 transition-all duration-200"
          >
            Revert
          </button>
          <button
            onClick={handleCopy}
            className="px-2 sm:px-3 py-1.5 rounded-sm text-[10px] sm:text-xs font-medium text-slate-300 hover:text-cyan-300 active:text-cyan-400 border border-slate-600 hover:border-cyan-500/50 transition-all duration-200"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-900 min-h-0 overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <CodeMirror
            ref={editorRef}
            value={code}
            onChange={onChange}
            extensions={[
              javascript({ jsx: false }),
              customTheme,
              syntaxHighlight,
              EditorView.lineWrapping,
              // Visualization extensions for line highlighting
              activeLinesField,
              activeLinesPlugin,
              visualizationTheme,
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
        </div>
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] opacity-20" />
      </div>

      {validationErrors.length > 0 && (
        <div className="px-4 py-3 bg-amber-950/30 border-t border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-400 mb-1">Validation Issues</div>
              <ul className="text-xs text-amber-200 space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
