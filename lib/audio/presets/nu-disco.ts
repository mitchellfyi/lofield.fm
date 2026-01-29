import { Preset } from "./types";

export const nuDisco: Preset = {
  id: "nu-disco",
  name: "Groove Machine",
  genre: "Nu Disco",
  bpm: 115,
  description: "Funky danceable grooves with warm synths and slap bass",
  tags: ["funky", "disco", "danceable", "groovy"],
  code: `// ═══════════════════════════════════════════════════════════
// Groove Machine - 32-bar Nu Disco arrangement
// Sections: A(intro) B(build) C(drop) D(breakdown)
// Key: Gm - Cm - F - Bb
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 115;
Tone.Transport.swing = 0.04;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm and punchy
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({ threshold: -16, ratio: 4, attack: 0.015, release: 0.15 }).connect(limiter);
const plateReverb = new Tone.Reverb({ decay: 2, wet: 0.18 }).connect(masterComp);
const stereoDelay = new Tone.PingPongDelay("8n", 0.25).connect(plateReverb);
stereoDelay.wet.value = 0.15;
const warmChorus = new Tone.Chorus(2.5, 4, 0.45).connect(stereoDelay).start();
const warmFilter = new Tone.Filter(9000, "lowpass").connect(warmChorus);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - punchy disco kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.25 }
}).connect(masterComp);
kick.volume.value = -4;

const kickLayer = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.008 }
}).connect(masterComp);
kickLayer.volume.value = -18;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.003, decay: 0.15, sustain: 0.01, release: 0.1 }
}).connect(plateReverb);
snare.volume.value = -10;

const clap = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.008, decay: 0.08, sustain: 0, release: 0.06 }
}).connect(plateReverb);
clap.volume.value = -14;

const hihatC = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5, resonance: 4500, octaves: 1
}).connect(warmFilter);
hihatC.volume.value = -18;

const hihatO = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 4.5, resonance: 3500, octaves: 1
}).connect(warmFilter);
hihatO.volume.value = -20;

const cowbell = new Tone.MetalSynth({
  envelope: { decay: 0.12 }, harmonicity: 2, resonance: 1000, octaves: 0.5
}).connect(warmFilter);
cowbell.volume.value = -22;

const shaker = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.015 }
}).connect(warmFilter);
shaker.volume.value = -22;

// Four-on-floor kick
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.6 : section === 3 ? 0.55 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
  kickLayer.triggerAttackRelease("32n", t, v * 0.35 * intensity);
}, [
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.5,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.55, 0.65,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.6, 0.7,
  0.85, null, null, null, 0.8, null, null, null, null, null, null, null, 0.85, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.65, 0.75
], "16n").start(0);

// Snare with clap layer
const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  snare.triggerAttackRelease("16n", t, v);
  if (section === 2) clap.triggerAttackRelease("16n", t, v * 0.6);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.4,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.35, null, null, null, null, 1, null, 0.45, 0.55,
  null, null, null, null, 1, null, null, null, null, null, 0.3, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.35, null, null, null, null, 0.4, 1, null, 0.5, 0.6,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.5, 0.6, 0.7
], "16n").start(0);

// Disco hi-hat pattern
const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.1 : section === 0 ? 0.55 : 1;
  if (v > 0.85) hihatO.triggerAttackRelease("32n", t, v * 0.55 * intensity);
  else hihatC.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.6, 0.55, 0.9, 0.5, 0.6, 0.55, 0.92, 0.52, 0.6, 0.55, 0.9, 0.5, 0.6, 0.55, 0.92, 0.55,
  0.62, 0.58, 0.92, 0.52, 0.62, 0.58, 0.95, 0.55, 0.62, 0.58, 0.92, 0.52, 0.62, 0.58, 0.95, 0.58,
  0.65, 0.6, 0.95, 0.55, 0.65, 0.6, 0.98, 0.58, 0.65, 0.6, 0.95, 0.55, 0.65, 0.6, 0.98, 0.6,
  0.68, 0.62, 0.98, 0.58, 0.68, 0.62, 1, 0.6, 0.68, 0.62, 0.98, 0.58, 0.68, 0.65, 1, 0.65
], "8n").start(0);

// Cowbell accents
const cowbellPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1 || section === 3) return;
  cowbell.triggerAttackRelease("16n", t, v);
}, [
  null, null, null, null, null, null, null, null, 0.5, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, 0.52, null, null, null, null, null, 0.45, null,
  null, null, null, null, null, null, null, null, 0.55, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, 0.55, null, null, null, null, null, 0.5, null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - funky slap style
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(1200, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.008, decay: 0.15, sustain: 0.3, release: 0.2 },
  filterEnvelope: { attack: 0.005, decay: 0.08, sustain: 0.25, baseFrequency: 300, octaves: 3 }
}).connect(bassFilter);
bass.volume.value = -7;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.9 : section === 3 ? 0.6 : 0.78;
  bass.triggerAttackRelease(n, "16n", t, vel);
}, [
  // Gm
  "G1", null, "G2", "G1", null, null, "Bb1", null, "G1", null, "G2", null, null, "D2", null, "G1",
  "G1", null, "Bb1", "G1", null, "D2", null, "G2", "G1", null, "G2", "Bb1", null, "D2", null, "G1",
  // Cm
  "C2", null, "C3", "C2", null, null, "Eb2", null, "C2", null, "C3", null, null, "G2", null, "C2",
  "C2", null, "Eb2", "C2", null, "G2", null, "C3", "C2", null, "C3", "Eb2", null, "G2", null, "C2",
  // F
  "F1", null, "F2", "F1", null, null, "A1", null, "F1", null, "F2", null, null, "C2", null, "F1",
  "F1", null, "A1", "F1", null, "C2", null, "F2", "F1", null, "F2", "A1", null, "C2", "A1", "F1",
  // Bb
  "Bb1", null, "Bb2", "Bb1", null, null, "D2", null, "Bb1", null, "Bb2", null, null, "F2", null, "Bb1",
  "Bb1", null, "D2", "Bb1", null, "F2", "D2", null, "Bb1", null, "Bb2", "D2", null, "F2", "Bb2", "Bb1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Chords - disco strings and stabs
// ─────────────────────────────────────────────────────────────
const stringsFilter = new Tone.Filter(4000, "lowpass").connect(plateReverb);
const strings = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 0.8 }
}).connect(stringsFilter);
strings.volume.value = -13;

const stabFilter = new Tone.Filter(3000, "lowpass").connect(stereoDelay);
const stab = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(stabFilter);
stab.volume.value = -12;

const stringsPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.25 : section === 2 ? 0.55 : 0.42;
  strings.triggerAttackRelease(c, "1n", t, vel);
}, [
  ["G3", "Bb3", "D4"], null, null, null, null, null, null, null,
  ["G3", "Bb3", "D4"], null, null, null, null, null, null, null,
  ["C3", "Eb3", "G3"], null, null, null, null, null, null, null,
  ["C3", "Eb3", "G3"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["Bb3", "D4", "F4"], null, null, null, null, null, null, null,
  ["Bb3", "D4", "F4"], null, null, null, null, null, null, null
], "2n").start(0);

const stabPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  stab.triggerAttackRelease(c, "16n", t, 0.65);
}, [
  null, null, null, ["G4", "Bb4", "D5"], null, null, null, null, null, null, null, ["G4", "Bb4"], null, null, null, null,
  null, null, null, ["G4", "Bb4", "D5"], null, null, null, null, null, null, ["Bb4", "D5"], null, null, null, null, null,
  null, null, null, ["C4", "Eb4", "G4"], null, null, null, null, null, null, null, ["C4", "Eb4"], null, null, null, null,
  null, null, null, ["C4", "Eb4", "G4"], null, null, null, null, null, null, ["Eb4", "G4"], null, null, null, null, null,
  null, null, null, ["F4", "A4", "C5"], null, null, null, null, null, null, null, ["F4", "A4"], null, null, null, null,
  null, null, null, ["F4", "A4", "C5"], null, null, null, null, null, null, ["A4", "C5"], null, null, null, null, null,
  null, null, null, ["Bb4", "D5", "F5"], null, null, null, null, null, null, null, ["Bb4", "D5"], null, null, null, null,
  null, null, null, ["Bb4", "D5", "F5"], null, null, null, null, null, null, ["D5", "F5"], null, null, null, null, null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead synth - funky melodic fills
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(5000, "lowpass").connect(stereoDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.6);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D5", "Bb4",
  "G4", null, null, null, null, null, null, null, "D5", null, "Bb4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G5", "Eb5",
  "C5", null, null, null, null, null, null, null, "G5", null, "Eb5", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "C5", "A4",
  "F4", null, null, null, null, null, null, null, "C5", null, "A4", null, "F4", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "F5", null, "D5", null, "Bb4", null, null, null, "C5", null, "D5", null, "F5", null, "D5", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Clavinet - funky rhythm
// ─────────────────────────────────────────────────────────────
const clavFilter = new Tone.Filter(3500, "lowpass").connect(warmChorus);
const clav = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "pulse" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.1 }
}).connect(clavFilter);
clav.volume.value = -14;

const clavPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section < 2) return;
  clav.triggerAttackRelease(c, "16n", t, 0.5);
}, [
  null, null, ["G3", "Bb3"], null, null, null, null, ["D4", "G4"], null, null, ["Bb3", "D4"], null, null, null, null, null,
  null, null, ["G3", "Bb3"], null, null, null, null, ["D4", "G4"], null, null, null, ["Bb3", "D4"], null, null, ["G3", "D4"], null,
  null, null, ["C3", "Eb3"], null, null, null, null, ["G3", "C4"], null, null, ["Eb3", "G3"], null, null, null, null, null,
  null, null, ["C3", "Eb3"], null, null, null, null, ["G3", "C4"], null, null, null, ["Eb3", "G3"], null, null, ["C3", "G3"], null,
  null, null, ["F3", "A3"], null, null, null, null, ["C4", "F4"], null, null, ["A3", "C4"], null, null, null, null, null,
  null, null, ["F3", "A3"], null, null, null, null, ["C4", "F4"], null, null, null, ["A3", "C4"], null, null, ["F3", "C4"], null,
  null, null, ["Bb3", "D4"], null, null, null, null, ["F4", "Bb4"], null, null, ["D4", "F4"], null, null, null, null, null,
  null, null, ["Bb3", "D4"], null, null, null, null, ["F4", "Bb4"], null, null, null, ["D4", "F4"], null, null, ["Bb3", "F4"], null
], "16n").start(0);

Tone.Transport.start();`,
};
