import { Preset } from "./types";

export const acousticPiano: Preset = {
  id: "acoustic-piano",
  name: "Concert Grand",
  genre: "Classical",
  bpm: 72,
  description:
    "Realistic acoustic piano using FM synthesis with hammer mechanics and string resonance",
  tags: ["piano", "acoustic", "classical", "realistic", "instrument"],
  code: `// ═══════════════════════════════════════════════════════════
// Concert Grand - Realistic Acoustic Piano
// Uses FM synthesis to model hammer strike + string vibration
// Technique: Multiple FM operators with careful harmonicity ratios
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 72;
Tone.Transport.swing = 0;

// ─────────────────────────────────────────────────────────────
// Room Acoustics - Concert hall reverb
// On mobile: use lighter effects to prevent crackling
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({
  threshold: -20, ratio: 2, attack: 0.05, release: 0.2
}).connect(limiter);

// Use lighter reverb on mobile (Freeverb instead of Convolver-based Reverb)
let mainOutput;
if (__isMobile) {
  // Freeverb is much lighter on CPU than Reverb (no ConvolverNode)
  const lightReverb = new Tone.Freeverb({
    roomSize: 0.7,
    dampening: 3000,
    wet: 0.2
  }).connect(masterComp);
  mainOutput = lightReverb;
} else {
  // Full concert hall reverb for desktop
  const hallReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.25,
    preDelay: 0.02
  }).connect(masterComp);

  // Subtle stereo widening via chorus (simulates multiple strings)
  const stringChorus = new Tone.Chorus({
    frequency: 0.5,
    delayTime: 3.5,
    depth: 0.15,
    wet: 0.12
  }).connect(hallReverb);
  stringChorus.start();
  mainOutput = stringChorus;
}

// ─────────────────────────────────────────────────────────────
// Piano Voice - FM synthesis with hammer mechanics
// Uses harmonicity ~2 for even harmonics (piano characteristic)
// Modulation index envelope simulates hammer strike brightness
// ─────────────────────────────────────────────────────────────
const piano = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2.01,          // Slightly detuned for warmth
  modulationIndex: 3.5,       // Brightness - higher = more overtones
  oscillator: {
    type: "sine"              // Pure carrier for clean fundamental
  },
  envelope: {
    attack: 0.005,            // Fast hammer strike
    decay: 0.4,               // Initial brightness decay
    sustain: 0.25,            // Sustained resonance
    release: 1.8              // Long release with damper simulation
  },
  modulation: {
    type: "sine"
  },
  modulationEnvelope: {
    attack: 0.001,            // Instant modulation for hammer transient
    decay: 0.15,              // Quick brightness decay (hammer leaves string)
    sustain: 0.05,            // Minimal sustained brightness
    release: 0.8              // Gradual harmonic decay
  }
}).connect(mainOutput);
piano.volume.value = -6;

// Second voice for string body resonance (sympathetic vibration)
// Skip on mobile to reduce CPU load
const resonance = __isMobile ? null : new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: {
    attack: 0.02,
    decay: 2.5,
    sustain: 0.1,
    release: 2.0
  }
}).connect(masterComp);
if (resonance) resonance.volume.value = -22;

// Hammer thump - simulates mechanical action
const hammerThump = new Tone.MembraneSynth({
  pitchDecay: 0.02,
  octaves: 1.5,
  envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(masterComp);
hammerThump.volume.value = -28;

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// Humanize velocity slightly
const humanize = (v) => v * (0.92 + Math.random() * 0.16);

// Play piano note with all layers
const playPiano = (note, time, velocity) => {
  const vel = humanize(velocity);
  piano.triggerAttackRelease(note, "2n", time, vel);
  // Add sympathetic resonance one octave down (quieter) - desktop only
  if (resonance && velocity > 0.4) {
    const resonanceNote = Tone.Frequency(note).transpose(-12).toNote();
    resonance.triggerAttackRelease(resonanceNote, "4n", time, vel * 0.3);
  }
  // Hammer thump on stronger notes
  if (velocity > 0.5) {
    hammerThump.triggerAttackRelease("C2", "32n", time, vel * 0.25);
  }
};

// ─────────────────────────────────────────────────────────────
// Musical Content - Gentle classical piece in C major
// Demonstrates realistic piano dynamics and pedaling
// ─────────────────────────────────────────────────────────────

// Right hand melody
const melodyPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const baseVel = section === 0 ? 0.5 : section === 2 ? 0.75 : 0.6;
  if (Array.isArray(n)) {
    playPiano(n, t, baseVel);
  } else {
    playPiano(n, t, baseVel);
  }
}, [
  // Bar 1-2: C major gentle opening
  "E5", null, "G5", null, "C6", null, "B5", null,
  "A5", null, "G5", null, "F5", null, "E5", null,
  // Bar 3-4: Descending phrase
  "D5", null, "E5", null, "F5", null, "G5", null,
  "E5", null, null, null, "D5", null, "C5", null,
  // Bar 5-6: Rising tension
  "E5", null, "F5", null, "G5", null, "A5", null,
  "B5", null, "C6", null, "D6", null, "E6", null,
  // Bar 7-8: Resolution
  "D6", null, "C6", null, "B5", null, "A5", null,
  "G5", null, null, null, null, null, null, null,
  // Bar 9-12: Repeat with variation
  "E5", "G5", null, null, "C6", null, "B5", null,
  "A5", null, "B5", null, "C6", null, "D6", null,
  "E6", null, "D6", null, "C6", null, "B5", null,
  "C6", null, null, null, null, null, null, null,
  // Bar 13-16: Expressive middle section
  "A5", null, "B5", null, "C6", null, "E6", null,
  "D6", null, "C6", null, "B5", null, "A5", null,
  "G5", null, "A5", null, "B5", null, "D6", null,
  "C6", null, null, null, null, null, null, null
], "8n").start(0);

// Left hand accompaniment - arpeggiated chords
const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const baseVel = section === 0 ? 0.35 : section === 2 ? 0.55 : 0.45;
  playPiano(n, t, baseVel);
}, [
  // C major arpeggio
  "C3", null, "E3", null, "G3", null, "C4", null,
  "G3", null, "E3", null, "C3", null, null, null,
  // G major
  "G2", null, "B2", null, "D3", null, "G3", null,
  "D3", null, "B2", null, "G2", null, null, null,
  // A minor
  "A2", null, "C3", null, "E3", null, "A3", null,
  "E3", null, "C3", null, "A2", null, null, null,
  // F major -> G major
  "F2", null, "A2", null, "C3", null, "F3", null,
  "G2", null, "B2", null, "D3", null, "G3", null,
  // C major with walking bass
  "C3", null, "E3", null, "G3", null, "E3", null,
  "C3", null, "D3", null, "E3", null, "G3", null,
  // Am -> Dm
  "A2", null, "C3", null, "E3", null, "C3", null,
  "D3", null, "F3", null, "A3", null, "F3", null,
  // G7 -> C resolution
  "G2", null, "B2", null, "D3", null, "F3", null,
  "E3", null, "D3", null, "C3", null, "B2", null,
  "C3", null, "E3", null, "G3", null, "C4", null,
  "C3", null, null, null, null, null, null, null
], "8n").start(0);

// Chord pads for fuller sound in climax
const chordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section < 2) return; // Only in later sections
  c.forEach((note, i) => {
    piano.triggerAttackRelease(note, "1n", t + i * 0.008, 0.35);
  });
}, [
  ["C4", "E4", "G4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  ["G3", "B3", "D4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  ["A3", "C4", "E4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  ["F3", "A3", "C4"], null, null, null, ["G3", "B3", "D4"], null, null, null,
  ["C4", "E4", "G4"], null, null, null, null, null, null, null
], "4n").start(0);

Tone.Transport.start();`,
};
