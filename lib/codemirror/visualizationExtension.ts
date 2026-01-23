/**
 * CodeMirror 6 extensions for visualization
 *
 * Provides:
 * - Line highlighting when notes trigger
 * - Visual feedback synchronized with audio playback
 */

import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';

// ─────────────────────────────────────────────────────────────
// State Effect to update active lines from outside CodeMirror
// ─────────────────────────────────────────────────────────────

export const setActiveLines = StateEffect.define<Set<number>>();

// ─────────────────────────────────────────────────────────────
// State Field to track active (triggering) line numbers
// ─────────────────────────────────────────────────────────────

export const activeLinesField = StateField.define<Set<number>>({
  create() {
    return new Set<number>();
  },

  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveLines)) {
        return effect.value;
      }
    }
    return value;
  },
});

// ─────────────────────────────────────────────────────────────
// Line decoration for active (triggering) lines
// ─────────────────────────────────────────────────────────────

const activeLineDecoration = Decoration.line({
  class: 'cm-active-trigger-line',
});

// ─────────────────────────────────────────────────────────────
// View Plugin that applies decorations based on active lines
// ─────────────────────────────────────────────────────────────

export const activeLinesPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Rebuild decorations when active lines change
      const oldActiveLines = update.startState.field(activeLinesField);
      const newActiveLines = update.state.field(activeLinesField);

      if (oldActiveLines !== newActiveLines || update.docChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const activeLines = view.state.field(activeLinesField);
      const builder = new RangeSetBuilder<Decoration>();

      // Sort line numbers and add decorations
      const sortedLines = Array.from(activeLines).sort((a, b) => a - b);

      for (const lineNum of sortedLines) {
        // Bounds check
        if (lineNum >= 1 && lineNum <= view.state.doc.lines) {
          const line = view.state.doc.line(lineNum);
          builder.add(line.from, line.from, activeLineDecoration);
        }
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─────────────────────────────────────────────────────────────
// Theme extension for styling active lines
// ─────────────────────────────────────────────────────────────

export const visualizationTheme = EditorView.theme({
  '.cm-active-trigger-line': {
    backgroundColor: 'rgba(34, 211, 238, 0.15)', // cyan-500/15
    borderLeft: '2px solid rgba(34, 211, 238, 0.6)',
    marginLeft: '-2px',
    transition: 'background-color 100ms ease-out, border-color 100ms ease-out',
  },
  // When combined with cursor line
  '.cm-active-trigger-line.cm-activeLine': {
    backgroundColor: 'rgba(34, 211, 238, 0.25)', // cyan-500/25
  },
});

// ─────────────────────────────────────────────────────────────
// Combined extension for easy import
// ─────────────────────────────────────────────────────────────

export const visualizationExtension = [
  activeLinesField,
  activeLinesPlugin,
  visualizationTheme,
];
