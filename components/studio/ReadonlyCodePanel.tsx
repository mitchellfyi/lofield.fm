"use client";

import { useState, useEffect, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useActiveLines } from "@/lib/audio/useVisualization";
import {
  activeLinesField,
  activeLinesPlugin,
  visualizationTheme,
  setActiveLines,
} from "@/lib/codemirror/visualizationExtension";

interface ReadonlyCodePanelProps {
  code: string;
}

// Syntax highlighting with high contrast colors
const syntaxHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#22d3ee" },
    { tag: tags.string, color: "#67e8f9" },
    { tag: tags.number, color: "#67e8f9" },
    { tag: tags.comment, color: "#546e7a", fontStyle: "italic" },
    { tag: tags.variableName, color: "#eeffff" },
    { tag: tags.function(tags.variableName), color: "#82aaff" },
    { tag: tags.className, color: "#ffcb6b" },
    { tag: tags.propertyName, color: "#82aaff" },
    { tag: tags.operator, color: "#89ddff" },
    { tag: tags.punctuation, color: "#eeffff" },
    { tag: tags.bracket, color: "#eeffff" },
    { tag: tags.tagName, color: "#f07178" },
    { tag: tags.attributeName, color: "#c792ea" },
  ])
);

// Custom dark theme matching page background
const customTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0f172a",
      color: "#e2e8f0",
    },
    ".cm-editor": {
      backgroundColor: "#0f172a",
    },
    ".cm-scroller": {
      backgroundColor: "#0f172a",
    },
    ".cm-content": {
      backgroundColor: "#0f172a",
      padding: "0.75rem",
      fontSize: "0.75rem",
      lineHeight: "1.6",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      color: "#e2e8f0",
    },
    ".cm-gutters": {
      backgroundColor: "#0f172a",
      borderRight: "1px solid rgba(34, 211, 238, 0.2)",
      color: "#64748b",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 0.5rem",
      backgroundColor: "transparent",
    },
    ".cm-line": {
      backgroundColor: "transparent",
    },
  },
  { dark: true }
);

export function ReadonlyCodePanel({ code }: ReadonlyCodePanelProps) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative bg-slate-900 min-h-0 overflow-hidden">
        {/* Floating copy button at top-right */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded-sm text-[10px] font-medium text-slate-300 hover:text-cyan-300 active:text-cyan-400 border border-slate-600 hover:border-cyan-500/50 transition-all duration-200 backdrop-blur-sm bg-slate-800/80"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="absolute inset-0 overflow-auto">
          <CodeMirror
            ref={editorRef}
            value={code}
            editable={false}
            extensions={[
              javascript({ jsx: false }),
              customTheme,
              syntaxHighlight,
              EditorView.lineWrapping,
              EditorState.readOnly.of(true),
              // Visualization extensions for line highlighting
              activeLinesField,
              activeLinesPlugin,
              visualizationTheme,
            ]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: false,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              highlightSelectionMatches: false,
            }}
          />
        </div>
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] opacity-20" />
      </div>
    </div>
  );
}
