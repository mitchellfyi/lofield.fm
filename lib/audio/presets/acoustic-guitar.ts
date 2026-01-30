import { Preset } from "./types";

export const acousticGuitar: Preset = {
  id: "acoustic-guitar",
  name: "Nylon Strings",
  genre: "Folk",
  bpm: 84,
  description:
    "Realistic acoustic guitar using Karplus-Strong string synthesis with body resonance",
  tags: ["guitar", "acoustic", "folk", "realistic", "instrument", "fingerstyle"],
  code: `// ═══════════════════════════════════════════════════════════
// Nylon Strings - Realistic Acoustic Guitar
// Uses Karplus-Strong algorithm (PluckSynth) for string physics
// Added body resonance and room acoustics for realism
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 84;
Tone.Transport.swing = 0.05; // Subtle swing for natural feel

// ─────────────────────────────────────────────────────────────
// Room Acoustics - intimate room reverb
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({
  threshold: -18, ratio: 3, attack: 0.02, release: 0.15
}).connect(limiter);

// Room reverb - smaller space for intimate guitar sound
const roomReverb = new Tone.Reverb({
  decay: 1.8,
  wet: 0.2,
  preDelay: 0.01
}).connect(masterComp);

// Body resonance filter - simulates guitar body
const bodyResonance = new Tone.Filter({
  frequency: 180,
  type: "peaking",
  Q: 2,
  gain: 4
}).connect(roomReverb);

// High shelf for string brightness
const stringBrightness = new Tone.Filter({
  frequency: 3500,
  type: "highshelf",
  gain: -3
}).connect(bodyResonance);

// ─────────────────────────────────────────────────────────────
// String Voices - Multiple PluckSynths for different strings
// Karplus-Strong with tuned resonance and attack noise
// ─────────────────────────────────────────────────────────────

// High strings (E, B, G) - brighter, faster decay
const highStrings = new Tone.PluckSynth({
  attackNoise: 2.5,      // Fingernail/pick attack
  resonance: 0.97,       // High resonance for sustain
  dampening: 4500,       // Brighter strings
  release: 1.2
}).connect(stringBrightness);
highStrings.volume.value = -4;

// Low strings (D, A, E) - warmer, longer sustain
const lowStrings = new Tone.PluckSynth({
  attackNoise: 3.5,      // More body in attack
  resonance: 0.985,      // Longer sustain for bass
  dampening: 2800,       // Warmer tone
  release: 1.8
}).connect(bodyResonance);
lowStrings.volume.value = -2;

// Second voice for slight detuning (simulates real strings)
const detuneStrings = new Tone.PluckSynth({
  attackNoise: 1.8,
  resonance: 0.96,
  dampening: 3800,
  release: 1.0
}).connect(stringBrightness);
detuneStrings.volume.value = -14;

// Body thump for percussive strums
const bodyThump = new Tone.MembraneSynth({
  pitchDecay: 0.015,
  octaves: 2,
  envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 }
}).connect(masterComp);
bodyThump.volume.value = -24;

// Fret noise - subtle high frequency click
const fretNoise = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 }
}).connect(new Tone.Filter(6000, "highpass").connect(roomReverb));
fretNoise.volume.value = -32;

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// Determine which string set to use based on pitch
const isLowString = (note) => {
  const midi = Tone.Frequency(note).toMidi();
  return midi < 55; // Below G3
};

// Play guitar note with realistic layers
const playNote = (note, time, velocity) => {
  const vel = velocity * (0.9 + Math.random() * 0.2);

  if (isLowString(note)) {
    lowStrings.triggerAttack(note, time);
  } else {
    highStrings.triggerAttack(note, time);
  }

  // Subtle detuned layer for richness
  if (velocity > 0.3) {
    const cents = (Math.random() - 0.5) * 8; // ±4 cents
    const detuned = Tone.Frequency(note).transpose(cents / 100).toFrequency();
    detuneStrings.triggerAttack(detuned, time + 0.002);
  }

  // Fret noise on note changes
  if (Math.random() > 0.7) {
    fretNoise.triggerAttackRelease("16n", time);
  }
};

// Play chord (strum simulation)
const playChord = (notes, time, velocity, strumSpeed = 0.02) => {
  // Add body thump for full strums
  if (notes.length > 3 && velocity > 0.4) {
    bodyThump.triggerAttackRelease("G1", "32n", time, velocity * 0.3);
  }

  notes.forEach((note, i) => {
    const strumDelay = i * strumSpeed * (0.8 + Math.random() * 0.4);
    const noteVel = velocity * (0.85 + Math.random() * 0.3);
    playNote(note, time + strumDelay, noteVel);
  });
};

// ─────────────────────────────────────────────────────────────
// Musical Content - Fingerstyle folk piece
// Demonstrates realistic guitar techniques
// ─────────────────────────────────────────────────────────────

// Bass notes (thumb)
const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 0 ? 0.55 : section === 2 ? 0.75 : 0.65;
  playNote(n, t, vel);
}, [
  // Am pattern
  "A2", null, null, null, "E2", null, null, null,
  "A2", null, null, null, "E2", null, "A2", null,
  // C pattern
  "C3", null, null, null, "G2", null, null, null,
  "C3", null, null, null, "G2", null, "C3", null,
  // G pattern
  "G2", null, null, null, "D3", null, null, null,
  "G2", null, null, null, "D3", null, "G2", null,
  // Em pattern
  "E2", null, null, null, "B2", null, null, null,
  "E2", null, null, null, "B2", null, "E2", null,
  // F pattern
  "F2", null, null, null, "C3", null, null, null,
  "F2", null, null, null, "C3", null, "F2", null,
  // C -> G
  "C3", null, null, null, "G2", null, null, null,
  "G2", null, null, null, "D3", null, "G2", null,
  // Am -> E
  "A2", null, null, null, "E2", null, null, null,
  "E2", null, null, null, "B2", null, "E2", null,
  // Am resolution
  "A2", null, null, null, "E2", null, null, null,
  "A2", null, null, null, null, null, null, null
], "8n").start(0);

// Fingerpicked arpeggios (index, middle, ring)
const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 0 ? 0.45 : section === 2 ? 0.65 : 0.55;
  playNote(n, t, vel);
}, [
  // Am: A-C-E pattern
  null, "E4", "A4", "E4", null, "C4", "E4", "C4",
  null, "E4", "A4", "E4", null, "C4", "E4", "A3",
  // C: C-E-G pattern
  null, "E4", "G4", "E4", null, "C4", "E4", "C4",
  null, "E4", "G4", "E4", null, "C4", "G4", "E4",
  // G: G-B-D pattern
  null, "D4", "G4", "D4", null, "B3", "D4", "B3",
  null, "D4", "G4", "D4", null, "B3", "D4", "G3",
  // Em: E-G-B pattern
  null, "B4", "E5", "B4", null, "G4", "B4", "G4",
  null, "B4", "E5", "B4", null, "G4", "B4", "E4",
  // F: F-A-C pattern
  null, "C4", "F4", "C4", null, "A3", "C4", "A3",
  null, "C4", "F4", "C4", null, "A3", "C4", "F3",
  // C - G transition
  null, "E4", "G4", "E4", null, "C4", "E4", "C4",
  null, "D4", "G4", "D4", null, "B3", "D4", "B3",
  // Am - E transition
  null, "E4", "A4", "E4", null, "C4", "E4", "C4",
  null, "E4", "G#4", "E4", null, "B3", "E4", "B3",
  // Am final
  null, "E4", "A4", "E4", null, "C4", "E4", "C4",
  null, null, null, null, null, null, null, null
], "8n").start(0);

// Full chord strums on section changes
const strumPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0) return; // No strums in intro
  const vel = section === 2 ? 0.7 : 0.55;
  playChord(c, t, vel, 0.015);
}, [
  // Am
  null, null, null, null, null, null, null, null,
  ["A2", "E3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  // C
  null, null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "C4", "E4"], null, null, null, null, null, null, null,
  // G
  null, null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "G3", "B3", "G4"], null, null, null, null, null, null, null,
  // Em
  null, null, null, null, null, null, null, null,
  ["E2", "B2", "E3", "G3", "B3", "E4"], null, null, null, null, null, null, null,
  // F
  null, null, null, null, null, null, null, null,
  ["F2", "C3", "F3", "A3", "C4", "F4"], null, null, null, null, null, null, null,
  // C - G
  null, null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "G3", "B3", "G4"], null, null, null, null, null, null, null,
  // Am - E
  null, null, null, null, null, null, null, null,
  ["E2", "B2", "E3", "G#3", "B3", "E4"], null, null, null, null, null, null, null,
  // Am final
  ["A2", "E3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null
], "4n").start(0);

// Hammer-ons and pull-offs for realism
const ornamentPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 1) return;
  playNote(n[0], t, 0.4);
  playNote(n[1], t + 0.06, 0.35); // Hammer-on
}, [
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, [["G4", "A4"]], null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, [["E4", "F4"]], null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, [["F#4", "G4"]], null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, [["D4", "E4"]], null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null
], "8n").start(0);

Tone.Transport.start();`,
};
