/**
 * CodeMirror autocomplete completions for Tone.js
 * Provides intelligent completions for Tone.js classes, methods, and patterns
 */

import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from "@codemirror/autocomplete";

/** Tone.js synthesizer classes */
const TONE_SYNTHS: Completion[] = [
  {
    label: "Synth",
    type: "class",
    info: "Basic synthesizer with a single oscillator",
    detail: "Tone.Synth",
    apply: "new Tone.Synth().toDestination()",
  },
  {
    label: "FMSynth",
    type: "class",
    info: "FM synthesis with carrier and modulator oscillators",
    detail: "Tone.FMSynth",
    apply: "new Tone.FMSynth().toDestination()",
  },
  {
    label: "AMSynth",
    type: "class",
    info: "AM synthesis with carrier and modulator",
    detail: "Tone.AMSynth",
    apply: "new Tone.AMSynth().toDestination()",
  },
  {
    label: "MonoSynth",
    type: "class",
    info: "Monophonic synthesizer with filter",
    detail: "Tone.MonoSynth",
    apply: "new Tone.MonoSynth().toDestination()",
  },
  {
    label: "PolySynth",
    type: "class",
    info: "Polyphonic synthesizer that can play multiple notes",
    detail: "Tone.PolySynth",
    apply: "new Tone.PolySynth(Tone.Synth).toDestination()",
  },
  {
    label: "MembraneSynth",
    type: "class",
    info: "Drum-like membrane synthesis",
    detail: "Tone.MembraneSynth",
    apply: "new Tone.MembraneSynth().toDestination()",
  },
  {
    label: "MetalSynth",
    type: "class",
    info: "Metallic percussion synthesis",
    detail: "Tone.MetalSynth",
    apply: "new Tone.MetalSynth().toDestination()",
  },
  {
    label: "NoiseSynth",
    type: "class",
    info: "Synthesizer using noise as the source",
    detail: "Tone.NoiseSynth",
    apply: "new Tone.NoiseSynth().toDestination()",
  },
  {
    label: "PluckSynth",
    type: "class",
    info: "Plucked string synthesis using Karplus-Strong",
    detail: "Tone.PluckSynth",
    apply: "new Tone.PluckSynth().toDestination()",
  },
  {
    label: "DuoSynth",
    type: "class",
    info: "Two voice synthesizer with harmonicity control",
    detail: "Tone.DuoSynth",
    apply: "new Tone.DuoSynth().toDestination()",
  },
];

/** Tone.js effect classes */
const TONE_EFFECTS: Completion[] = [
  {
    label: "Reverb",
    type: "class",
    info: "Convolution reverb effect",
    detail: "Tone.Reverb",
    apply: "new Tone.Reverb({ decay: 2 }).toDestination()",
  },
  {
    label: "FeedbackDelay",
    type: "class",
    info: "Delay with feedback",
    detail: "Tone.FeedbackDelay",
    apply: 'new Tone.FeedbackDelay("8n", 0.5).toDestination()',
  },
  {
    label: "Chorus",
    type: "class",
    info: "Chorus effect with LFO modulation",
    detail: "Tone.Chorus",
    apply: "new Tone.Chorus(4, 2.5, 0.5).toDestination().start()",
  },
  {
    label: "Phaser",
    type: "class",
    info: "Phaser effect with allpass filters",
    detail: "Tone.Phaser",
    apply: "new Tone.Phaser({ frequency: 0.5, octaves: 3 }).toDestination()",
  },
  {
    label: "Tremolo",
    type: "class",
    info: "Tremolo effect (amplitude modulation)",
    detail: "Tone.Tremolo",
    apply: "new Tone.Tremolo(9, 0.75).toDestination().start()",
  },
  {
    label: "Vibrato",
    type: "class",
    info: "Vibrato effect (pitch modulation)",
    detail: "Tone.Vibrato",
    apply: "new Tone.Vibrato(5, 0.1).toDestination()",
  },
  {
    label: "Distortion",
    type: "class",
    info: "Waveshaper distortion",
    detail: "Tone.Distortion",
    apply: "new Tone.Distortion(0.4).toDestination()",
  },
  {
    label: "BitCrusher",
    type: "class",
    info: "Bit depth reduction for lo-fi sound",
    detail: "Tone.BitCrusher",
    apply: "new Tone.BitCrusher(4).toDestination()",
  },
  {
    label: "Filter",
    type: "class",
    info: "Biquad filter (lowpass, highpass, etc.)",
    detail: "Tone.Filter",
    apply: 'new Tone.Filter(800, "lowpass").toDestination()',
  },
  {
    label: "AutoFilter",
    type: "class",
    info: "Filter with LFO automation",
    detail: "Tone.AutoFilter",
    apply: 'new Tone.AutoFilter("4n").toDestination().start()',
  },
  {
    label: "AutoPanner",
    type: "class",
    info: "Auto-panning stereo effect",
    detail: "Tone.AutoPanner",
    apply: 'new Tone.AutoPanner("4n").toDestination().start()',
  },
  {
    label: "AutoWah",
    type: "class",
    info: "Envelope-following wah effect",
    detail: "Tone.AutoWah",
    apply: "new Tone.AutoWah(50, 6).toDestination()",
  },
  {
    label: "Compressor",
    type: "class",
    info: "Dynamic range compressor",
    detail: "Tone.Compressor",
    apply: "new Tone.Compressor(-30, 3).toDestination()",
  },
  {
    label: "Limiter",
    type: "class",
    info: "Hard limiter",
    detail: "Tone.Limiter",
    apply: "new Tone.Limiter(-6).toDestination()",
  },
  {
    label: "EQ3",
    type: "class",
    info: "Three-band equalizer",
    detail: "Tone.EQ3",
    apply: "new Tone.EQ3(2, -3, 1).toDestination()",
  },
  {
    label: "Gain",
    type: "class",
    info: "Gain node for volume control",
    detail: "Tone.Gain",
    apply: "new Tone.Gain(0.5).toDestination()",
  },
  {
    label: "Panner",
    type: "class",
    info: "Stereo panning control",
    detail: "Tone.Panner",
    apply: "new Tone.Panner(0).toDestination()",
  },
  {
    label: "PingPongDelay",
    type: "class",
    info: "Stereo ping-pong delay",
    detail: "Tone.PingPongDelay",
    apply: 'new Tone.PingPongDelay("8n", 0.6).toDestination()',
  },
  {
    label: "Freeverb",
    type: "class",
    info: "Freeverb algorithm reverb",
    detail: "Tone.Freeverb",
    apply: "new Tone.Freeverb(0.9, 3000).toDestination()",
  },
];

/** Tone.js sequencing/timing classes */
const TONE_SEQUENCING: Completion[] = [
  {
    label: "Sequence",
    type: "class",
    info: "Step sequencer that loops through values",
    detail: "Tone.Sequence",
    apply:
      'new Tone.Sequence((time, note) => {\n  synth.triggerAttackRelease(note, "8n", time);\n}, ["C4", "E4", "G4", "B4"], "4n").start(0)',
  },
  {
    label: "Pattern",
    type: "class",
    info: "Pattern with various playback modes",
    detail: "Tone.Pattern",
    apply:
      'new Tone.Pattern((time, note) => {\n  synth.triggerAttackRelease(note, "8n", time);\n}, ["C4", "E4", "G4"], "upDown").start(0)',
  },
  {
    label: "Loop",
    type: "class",
    info: "Repeating callback at interval",
    detail: "Tone.Loop",
    apply:
      'new Tone.Loop((time) => {\n  synth.triggerAttackRelease("C4", "8n", time);\n}, "4n").start(0)',
  },
  {
    label: "Part",
    type: "class",
    info: "Collection of events at specific times",
    detail: "Tone.Part",
    apply:
      'new Tone.Part((time, value) => {\n  synth.triggerAttackRelease(value.note, value.duration, time);\n}, [{ time: 0, note: "C4", duration: "8n" }]).start(0)',
  },
  {
    label: "Transport",
    type: "variable",
    info: "Global transport for timing and scheduling",
    detail: "Tone.Transport",
  },
];

/** Tone.js sources */
const TONE_SOURCES: Completion[] = [
  {
    label: "Oscillator",
    type: "class",
    info: "Basic oscillator (sine, square, sawtooth, triangle)",
    detail: "Tone.Oscillator",
    apply: 'new Tone.Oscillator(440, "sine").toDestination().start()',
  },
  {
    label: "OmniOscillator",
    type: "class",
    info: "Oscillator with multiple types",
    detail: "Tone.OmniOscillator",
    apply: 'new Tone.OmniOscillator(440, "fatsawtooth").toDestination().start()',
  },
  {
    label: "Noise",
    type: "class",
    info: "Noise generator (white, pink, brown)",
    detail: "Tone.Noise",
    apply: 'new Tone.Noise("pink").toDestination().start()',
  },
  {
    label: "Player",
    type: "class",
    info: "Audio sample player",
    detail: "Tone.Player",
    apply: 'new Tone.Player("path/to/sound.mp3").toDestination()',
  },
  {
    label: "Sampler",
    type: "class",
    info: "Multi-sample instrument",
    detail: "Tone.Sampler",
    apply: 'new Tone.Sampler({ C4: "path/to/C4.mp3" }).toDestination()',
  },
  {
    label: "GrainPlayer",
    type: "class",
    info: "Granular synthesis player",
    detail: "Tone.GrainPlayer",
    apply: 'new Tone.GrainPlayer("path/to/sound.mp3").toDestination()',
  },
];

/** Common code snippets */
const TONE_SNIPPETS: Completion[] = [
  {
    label: "synth-basic",
    type: "text",
    info: "Basic synth with simple melody",
    detail: "snippet",
    apply: `const synth = new Tone.Synth().toDestination();

new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, "8n", time);
}, ["C4", "E4", "G4", "B4"], "4n").start(0);`,
  },
  {
    label: "drums-basic",
    type: "text",
    info: "Basic kick and hihat pattern",
    detail: "snippet",
    apply: `const kick = new Tone.MembraneSynth().toDestination();
const hihat = new Tone.NoiseSynth({
  envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
}).toDestination();

new Tone.Loop((time) => {
  kick.triggerAttackRelease("C1", "8n", time);
}, "4n").start(0);

new Tone.Loop((time) => {
  hihat.triggerAttackRelease("16n", time);
}, "8n").start("8n");`,
  },
  {
    label: "chord-progression",
    type: "text",
    info: "Chord progression with PolySynth",
    detail: "snippet",
    apply: `const synth = new Tone.PolySynth(Tone.Synth).toDestination();

new Tone.Sequence((time, chord) => {
  synth.triggerAttackRelease(chord, "2n", time);
}, [
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["F3", "A3", "C4"],
  ["G3", "B3", "D4"]
], "2n").start(0);`,
  },
  {
    label: "bass-line",
    type: "text",
    info: "Simple bass line pattern",
    detail: "snippet",
    apply: `const bass = new Tone.MonoSynth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.1 },
  filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2, baseFrequency: 200, octaves: 2.5 }
}).toDestination();

new Tone.Sequence((time, note) => {
  bass.triggerAttackRelease(note, "8n", time);
}, ["C2", null, "C2", "D#2", null, "G2", null, "C2"], "8n").start(0);`,
  },
  {
    label: "effects-chain",
    type: "text",
    info: "Synth with reverb and delay effects",
    detail: "snippet",
    apply: `const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.4).connect(reverb);
const synth = new Tone.Synth().connect(delay);

new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, "8n", time);
}, ["C4", "E4", "G4", "B4"], "4n").start(0);`,
  },
  {
    label: "transport-setup",
    type: "text",
    info: "Transport with BPM and time signature",
    detail: "snippet",
    apply: `Tone.getTransport().bpm.value = 90;
Tone.getTransport().timeSignature = 4;
Tone.getTransport().loop = true;
Tone.getTransport().loopStart = 0;
Tone.getTransport().loopEnd = "8m";`,
  },
];

/** Combine all completions */
const ALL_COMPLETIONS: Completion[] = [
  ...TONE_SYNTHS,
  ...TONE_EFFECTS,
  ...TONE_SEQUENCING,
  ...TONE_SOURCES,
  ...TONE_SNIPPETS,
];

/**
 * Custom completion source for Tone.js
 */
function toneCompletions(context: CompletionContext): CompletionResult | null {
  // Get word at cursor
  const word = context.matchBefore(/[\w.]*$/);

  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const input = word.text.toLowerCase();

  // Filter completions based on context
  let options: Completion[];

  if (input.startsWith("tone.") || input.startsWith("new tone.")) {
    // After "Tone." or "new Tone.", show all classes
    const searchTerm = input.replace(/^(new\s+)?tone\.?/, "");
    options = ALL_COMPLETIONS.filter(
      (c) => c.type === "class" && c.label.toLowerCase().includes(searchTerm)
    ).map((c) => ({
      ...c,
      label: `Tone.${c.label}`,
      apply: c.apply,
    }));
  } else {
    // General completions
    options = ALL_COMPLETIONS.filter((c) => c.label.toLowerCase().includes(input));
  }

  // If no matches, return null
  if (options.length === 0) {
    return null;
  }

  return {
    from: word.from,
    options,
    validFor: /^[\w.]*$/,
  };
}

/**
 * CodeMirror extension for Tone.js autocomplete
 */
export const toneAutocomplete = autocompletion({
  override: [toneCompletions],
  activateOnTyping: true,
  maxRenderedOptions: 20,
  icons: true,
});
