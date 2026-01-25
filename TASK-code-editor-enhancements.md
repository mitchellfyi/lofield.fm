# Task: Enhanced Code Editor with Inline Controls & Tone.js Integration

## Overview

Transform the code editor from a basic text editor into an intelligent, music-production-aware IDE with inline UI controls, Tone.js autocomplete, and contextual help. The goal is to let users tweak values visually without typing while still maintaining full code control.

## Vision

Imagine clicking on a number like `440` in `new Tone.Oscillator(440)` and seeing a frequency slider appear inline. Or clicking on `"sine"` and getting a dropdown of valid waveform types. This bridges the gap between visual music tools and code-based synthesis.

## Current State

### What Exists

- **CodeMirror 6** via `@uiw/react-codemirror`
- Custom syntax highlighting theme
- Line visualization (highlights active playing lines)
- JavaScript language support
- Basic editing features (bracket matching, auto-indent)
- **No autocomplete** (explicitly disabled)
- **No Tone.js awareness**

### Key Files

- `components/studio/CodePanel.tsx` - Main editor component
- `lib/codemirror/visualizationExtension.ts` - Custom line highlighting
- `lib/audio/llmContract.ts` - Code validation
- `lib/audio/runtime.ts` - Code execution

## Proposed Features

### Phase 1: Tone.js Autocomplete (High Priority)

#### 1.1 Basic Autocomplete

Enable intelligent autocomplete for Tone.js:

- `Tone.` triggers list of all Tone classes (Synth, Oscillator, Filter, etc.)
- `new Tone.Synth().` shows available methods and properties
- Constructor parameters show expected types

**Technical approach:**

- Create Tone.js type definitions/completions database
- Use CodeMirror's `@codemirror/autocomplete` extension
- Parse Tone.js TypeScript definitions or maintain curated list

**Files to create/modify:**

- `lib/codemirror/toneCompletions.ts` - Completion data
- `lib/codemirror/autocompleteExtension.ts` - CodeMirror extension
- `components/studio/CodePanel.tsx` - Enable autocomplete

#### 1.2 Parameter Hints

Show inline parameter hints when typing function calls:

```javascript
new Tone.Synth(options?)
                ↑ { oscillator, envelope, volume, ... }
```

#### 1.3 Documentation Tooltips

Hover over Tone.js classes/methods to see documentation:

- Brief description
- Parameter types
- Example usage
- Link to full Tone.js docs

**Data source options:**

1. Scrape/parse Tone.js TypeScript definitions
2. Maintain curated JSON database
3. Fetch from Tone.js docs API (if available)
4. Bundle subset of most-used classes

### Phase 2: Inline Value Controls (High Priority)

#### 2.1 Number Sliders

When cursor is on a number, show inline slider:

```
Visual concept:
new Tone.Oscillator(440)
                    ↑
              [====|====] 440 Hz
              20      20000
```

**Implementation:**

- Detect number tokens in AST
- Determine context (frequency? volume? time?)
- Show appropriate slider with smart ranges
- Update code in real-time as slider moves

**Context-aware ranges:**
| Context | Range | Unit |
|---------|-------|------|
| Frequency | 20-20000 | Hz |
| Volume/Gain | -60 to +6 | dB |
| BPM | 40-240 | bpm |
| Time | 0-10 | seconds |
| Percentage | 0-100 | % |
| Generic | 0-1000 | - |

**Detection heuristics:**

- Parameter name contains "freq" → frequency range
- Parameter name contains "volume", "gain" → dB range
- Value appears after "bpm" or "tempo" → BPM range
- Variable name hints (e.g., `filterFreq`, `delayTime`)

#### 2.2 String Dropdowns

When cursor is on a string that has known options:

```
Visual concept:
new Tone.Oscillator(440, "sine")
                          ↑
                    ┌─────────────┐
                    │ ● sine      │
                    │   square    │
                    │   sawtooth  │
                    │   triangle  │
                    └─────────────┘
```

**Known string enumerations:**
| Context | Options |
|---------|---------|
| Oscillator type | sine, square, sawtooth, triangle, custom |
| Filter type | lowpass, highpass, bandpass, notch, allpass |
| Envelope curve | linear, exponential |
| Noise type | white, pink, brown |
| Time signature | 4/4, 3/4, 6/8, etc. |

#### 2.3 Boolean Toggles

For boolean values, show inline toggle:

```
Visual concept:
synth.set({ portamento: true })
                        ↑
                    [●───] ON
```

#### 2.4 Color Pickers (for visualization code)

If users write visualization code with colors:

```javascript
const color = "#ff5500"
              ↑
        [color picker popup]
```

### Phase 3: Variable Assignment Controls (Medium Priority)

#### 3.1 Track Variable Declarations

Parse and track variable assignments:

```javascript
const freq = 440;
const filterCutoff = 1000;
const volume = -12;
```

Show controls for each declared variable in a sidebar or inline.

#### 3.2 Variable Reference Highlighting

When editing a variable's value, highlight all places it's used:

```javascript
const freq = 440;        // ← editing this
      ↑
osc1.frequency.value = freq;  // highlighted
osc2.frequency.value = freq;  // highlighted
```

#### 3.3 Live Variable Panel

Optional sidebar showing all declared variables with controls:

```
┌─ Variables ─────────────────┐
│ freq        [===|===] 440   │
│ cutoff      [=====|=] 1000  │
│ volume      [==|====] -12   │
│ waveform    [▼ sine    ]    │
└─────────────────────────────┘
```

### Phase 4: Advanced Editor Features (Lower Priority)

#### 4.1 Code Snippets

Quick-insert common patterns:

- Basic synth setup
- Drum pattern
- Effect chain
- Envelope configuration
- LFO modulation

Triggered via:

- Autocomplete (type "synth" → insert snippet)
- Command palette (Cmd+Shift+P)
- Right-click context menu

#### 4.2 Error Highlighting

Real-time syntax and semantic errors:

- Red underline for syntax errors
- Yellow underline for Tone.js-specific warnings
- Hover to see error message
- Quick-fix suggestions

#### 4.3 Code Folding

Fold/unfold code sections:

- Fold object literals
- Fold function bodies
- Fold comment blocks

#### 4.4 Minimap

Optional code minimap for navigation in longer files.

#### 4.5 Multi-cursor Editing

Edit multiple occurrences simultaneously.

#### 4.6 Find & Replace

With regex support for power users.

### Phase 5: Tone.js Deep Integration (Lower Priority)

#### 5.1 Signal Flow Visualization

Show visual representation of audio signal flow:

```
[Oscillator] → [Filter] → [Gain] → [Destination]
```

Click nodes to jump to relevant code.

#### 5.2 Waveform Preview

When editing oscillator type, show waveform preview:

```
"sine"     ∿∿∿∿∿
"square"   ⊓⊓⊓⊓⊓
"sawtooth" ⋰⋰⋰⋰⋰
```

#### 5.3 Envelope Visualizer

When editing ADSR envelope, show visual curve:

```
envelope: {
  attack: 0.1,    ╱
  decay: 0.2,     ╲
  sustain: 0.5,   ──
  release: 0.8    ╲
}
```

Interactive - drag points to adjust values.

#### 5.4 Keyboard Piano

Virtual piano keyboard for testing/previewing notes:

- Click keys to trigger synth
- Shows frequency values
- MIDI note names

## Technical Architecture

### Tone.js Knowledge Base

Create comprehensive Tone.js metadata:

```typescript
// lib/codemirror/toneKnowledge.ts

interface ToneClass {
  name: string;
  description: string;
  docsUrl: string;
  constructor: {
    parameters: ToneParameter[];
  };
  methods: ToneMethod[];
  properties: ToneProperty[];
}

interface ToneParameter {
  name: string;
  type: "number" | "string" | "boolean" | "object" | "enum";
  enumValues?: string[];
  range?: { min: number; max: number; unit?: string };
  default?: unknown;
  description: string;
}

// Example entry
const OscillatorClass: ToneClass = {
  name: "Oscillator",
  description: "A simple oscillator with frequency and type controls",
  docsUrl: "https://tonejs.github.io/docs/Oscillator",
  constructor: {
    parameters: [
      {
        name: "frequency",
        type: "number",
        range: { min: 20, max: 20000, unit: "Hz" },
        default: 440,
        description: "The frequency in hertz",
      },
      {
        name: "type",
        type: "enum",
        enumValues: ["sine", "square", "sawtooth", "triangle"],
        default: "sine",
        description: "The waveform type",
      },
    ],
  },
  // ... methods, properties
};
```

### AST Parsing for Context Detection

Use a JavaScript parser to understand code structure:

```typescript
// lib/codemirror/codeAnalysis.ts

interface TokenContext {
  type: "number" | "string" | "boolean" | "identifier";
  value: string | number | boolean;
  position: { start: number; end: number };
  context: {
    functionName?: string;
    parameterIndex?: number;
    parameterName?: string;
    className?: string;
    propertyPath?: string[];
  };
}

// Analyze cursor position to determine context
function analyzeTokenAtPosition(code: string, position: number): TokenContext | null;
```

### Inline Widget System

CodeMirror 6 supports "decorations" for inline widgets:

```typescript
// lib/codemirror/inlineControls.ts

import { Decoration, WidgetType } from "@codemirror/view";

class NumberSliderWidget extends WidgetType {
  constructor(
    private value: number,
    private range: { min: number; max: number },
    private onChange: (value: number) => void
  ) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement("span");
    wrapper.className = "cm-inline-slider";
    // Render slider UI
    return wrapper;
  }
}
```

### State Management

Track inline control state:

```typescript
// lib/codemirror/controlState.ts

interface InlineControlState {
  activeControl: {
    position: number;
    type: "slider" | "dropdown" | "toggle" | "colorpicker";
    context: TokenContext;
  } | null;
  previewValue: unknown; // Value while dragging/selecting
}
```

## Acceptance Criteria

### Phase 1 Complete When:

- [ ] Typing `Tone.` shows autocomplete with all major classes
- [ ] Selecting a class shows constructor parameters
- [ ] Method/property autocomplete works after `.`
- [ ] Hover tooltips show brief documentation
- [ ] Autocomplete doesn't break existing functionality
- [ ] Tests for autocomplete accuracy

### Phase 2 Complete When:

- [ ] Clicking a number shows inline slider
- [ ] Slider range is context-aware (frequency, volume, time)
- [ ] Dragging slider updates code in real-time
- [ ] Clicking a known string enum shows dropdown
- [ ] Selecting dropdown option updates code
- [ ] Boolean values show toggle
- [ ] Controls dismiss on click outside or Escape
- [ ] Tests for inline control behavior

### Phase 3 Complete When:

- [ ] Variable declarations are tracked
- [ ] Variables panel shows all declared variables
- [ ] Editing variable value updates all references
- [ ] Variable references are highlighted
- [ ] Tests for variable tracking

### Phase 4 Complete When:

- [ ] Code snippets can be inserted
- [ ] Real-time error highlighting works
- [ ] Error messages are helpful and Tone.js-aware
- [ ] Code folding works
- [ ] Tests for snippets and error detection

### Phase 5 Complete When:

- [ ] Signal flow diagram renders from code
- [ ] Waveform previews show inline
- [ ] ADSR envelope visualizer is interactive
- [ ] Virtual keyboard triggers sounds
- [ ] Tests for visualizations

## Dependencies

### Required Packages

```json
{
  "@codemirror/autocomplete": "^6.x",
  "@codemirror/lint": "^6.x",
  "@lezer/javascript": "^1.x"
}
```

### Optional Packages

```json
{
  "acorn": "^8.x", // For AST parsing
  "acorn-walk": "^8.x", // For AST traversal
  "@babel/parser": "^7.x" // Alternative parser
}
```

## Risks & Mitigations

| Risk                         | Impact                 | Mitigation                                |
| ---------------------------- | ---------------------- | ----------------------------------------- |
| Performance with large files | Editor lag             | Debounce analysis, use Web Workers        |
| Tone.js version changes      | Broken completions     | Version-lock metadata, auto-update script |
| Complex nested objects       | Hard to detect context | Limit depth, use heuristics               |
| Mobile usability             | Touch controls awkward | Adapt UI for touch, larger targets        |

## Research Required

1. **Tone.js API surface** - Full catalog of classes, methods, parameters
2. **CodeMirror 6 decoration API** - Inline widget best practices
3. **Similar tools** - How Scratch, Max/MSP, VCV Rack handle this
4. **Performance benchmarks** - AST parsing overhead

## Estimated Effort

| Phase                      | Effort    | Complexity |
| -------------------------- | --------- | ---------- |
| Phase 1 (Autocomplete)     | 3-5 days  | Medium     |
| Phase 2 (Inline Controls)  | 5-7 days  | High       |
| Phase 3 (Variables)        | 3-4 days  | Medium     |
| Phase 4 (Advanced)         | 5-7 days  | Medium     |
| Phase 5 (Deep Integration) | 7-10 days | High       |

**Total: 3-5 weeks for full implementation**

## Open Questions

1. Should inline controls be always visible or only on hover/click?
2. Should we support custom user-defined ranges?
3. How do we handle minified or obfuscated code?
4. Should we support TypeScript in the editor?
5. Do we want vim/emacs keybindings?
6. Should controls animate value changes during playback?

## References

- [CodeMirror 6 Autocomplete](https://codemirror.net/docs/ref/#autocomplete)
- [CodeMirror 6 Decorations](https://codemirror.net/docs/ref/#view.Decoration)
- [Tone.js Documentation](https://tonejs.github.io/docs/)
- [Tone.js GitHub](https://github.com/Tonejs/Tone.js)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Reference for IDE features

---

**Created:** 2024-01-25
**Priority:** High
**Status:** Planned
