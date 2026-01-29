import { Preset } from "./types";

export const jazzFusion: Preset = {
  id: "jazz-fusion",
  name: "After Hours",
  genre: "Jazz Fusion",
  bpm: 95,
  description: "Smooth jazz-influenced grooves with sophisticated harmonies",
  tags: ["smooth", "jazzy", "sophisticated", "groovy"],
  code: `// ═══════════════════════════════════════════════════════════
// After Hours - 32-bar Jazz Fusion arrangement
// Sections: A(intro) B(build) C(full) D(outro)
// Key: Dm9 - G13 - Cmaj9 - A7alt
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 95;
Tone.Transport.swing = 0.12;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm and open
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-4).toDestination();
const masterComp = new Tone.Compressor({ threshold: -18, ratio: 2.5, attack: 0.15, release: 0.4 }).connect(limiter);
const roomReverb = new Tone.Reverb({ decay: 2.2, wet: 0.22 }).connect(masterComp);
const tapeDelay = new Tone.FeedbackDelay("8n", 0.28).connect(roomReverb);
tapeDelay.wet.value = 0.18;
const chorus = new Tone.Chorus(2, 3.5, 0.35).connect(tapeDelay).start();
const warmFilter = new Tone.Filter(8000, "lowpass").connect(chorus);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - brushy and dynamic
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.04, octaves: 4, envelope: { attack: 0.002, decay: 0.3, sustain: 0.01, release: 0.3 }
}).connect(masterComp);
kick.volume.value = -8;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" }, envelope: { attack: 0.003, decay: 0.12, sustain: 0.02, release: 0.1 }
}).connect(roomReverb);
snare.volume.value = -12;

const brush = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.02, decay: 0.08, sustain: 0.02, release: 0.06 }
}).connect(roomReverb);
brush.volume.value = -18;

const hihat = new Tone.MetalSynth({
  envelope: { decay: 0.06 }, harmonicity: 5, resonance: 3500, octaves: 1
}).connect(warmFilter);
hihat.volume.value = -20;

const ride = new Tone.MetalSynth({
  envelope: { decay: 0.2 }, harmonicity: 3.5, resonance: 2000, octaves: 1.5
}).connect(warmFilter);
ride.volume.value = -18;

const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.5 : section === 3 ? 0.6 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
}, [
  0.85, null, null, null, null, null, 0.5, null, null, null, null, null, 0.8, null, null, null,
  0.85, null, null, null, null, null, null, 0.45, null, null, 0.5, null, 0.8, null, null, null,
  0.88, null, null, null, null, null, 0.55, null, null, null, null, null, 0.82, null, null, 0.45,
  0.88, null, null, 0.4, null, null, null, 0.5, null, null, 0.55, null, 0.85, null, 0.5, 0.55,
  0.9, null, null, null, null, null, 0.6, null, null, null, null, 0.45, 0.85, null, null, null,
  0.9, null, null, 0.45, null, null, null, 0.55, null, null, 0.6, null, 0.88, null, 0.55, 0.6,
  0.75, null, null, null, null, null, null, null, null, null, null, null, 0.7, null, null, null,
  0.82, null, null, null, null, null, 0.5, null, null, null, 0.55, null, 0.8, null, 0.55, 0.65
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.6 : 1;
  snare.triggerAttackRelease("16n", t, v * intensity);
}, [
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 0.85, null, null, 0.35, null, null, null, null, 0.8, null, null, 0.38,
  null, null, null, null, 0.88, null, null, null, null, null, 0.3, null, 0.82, null, null, null,
  null, null, null, null, 0.88, null, 0.35, null, null, null, null, 0.35, 0.85, null, 0.4, 0.5,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, 0.3, null, 0.9, null, null, 0.4, null, null, 0.35, null, 0.88, null, 0.45, 0.55,
  null, null, null, null, 0.75, null, null, null, null, null, null, null, 0.7, null, null, null,
  null, null, null, null, 0.82, null, null, null, null, null, null, null, 0.8, 0.45, 0.55, 0.65
], "16n").start(0);

const ridePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0) return;
  const intensity = section === 2 ? 1 : 0.75;
  ride.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.6, null, 0.4, null, 0.65, null, 0.45, null, 0.6, null, 0.42, null, 0.65, null, 0.5, null,
  0.62, null, 0.42, null, 0.68, null, 0.48, null, 0.62, null, 0.45, null, 0.68, null, 0.52, null,
  0.65, null, 0.45, null, 0.7, null, 0.5, null, 0.65, null, 0.48, null, 0.7, null, 0.55, null,
  0.68, null, 0.48, 0.35, 0.72, null, 0.52, null, 0.68, null, 0.5, 0.38, 0.72, null, 0.58, 0.4
], "8n").start(0);

const brushPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 2) return;
  brush.triggerAttackRelease("16n", t, v);
}, [
  0.3, 0.2, 0.35, 0.22, 0.32, 0.2, 0.38, 0.25, 0.3, 0.22, 0.35, 0.22, 0.32, 0.25, 0.38, 0.28,
  0.32, 0.22, 0.38, 0.25, 0.35, 0.22, 0.4, 0.28, 0.32, 0.25, 0.38, 0.25, 0.35, 0.28, 0.42, 0.3
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - walking style with chromaticism
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(800, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.3 },
  filterEnvelope: { attack: 0.01, decay: 0.08, sustain: 0.4, baseFrequency: 200, octaves: 1.5 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 0 ? 0.55 : section === 2 ? 0.85 : 0.72;
  bass.triggerAttackRelease(n, "8n", t, vel);
}, [
  // Dm9
  "D2", null, "F2", null, "A2", null, "C3", null, "D2", null, "E2", null, "F2", null, "G2", null,
  "D2", null, "A1", null, "D2", null, "F2", null, "E2", null, "D2", null, "C2", null, "B1", null,
  // G13
  "G1", null, "B1", null, "D2", null, "F2", null, "G1", null, "A1", null, "B1", null, "C2", null,
  "G1", null, "D2", null, "G2", null, "F2", null, "E2", null, "D2", null, "Db2", null, "C2", null,
  // Cmaj9
  "C2", null, "E2", null, "G2", null, "B2", null, "C2", null, "D2", null, "E2", null, "F2", null,
  "C2", null, "G1", null, "C2", null, "E2", null, "D2", null, "C2", null, "B1", null, "Bb1", null,
  // A7alt
  "A1", null, "C#2", null, "E2", null, "G2", null, "A1", null, "B1", null, "C#2", null, "D2", null,
  "A1", null, "E1", null, "A1", null, "Bb1", null, "B1", null, "C2", null, "C#2", null, "D2", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes - rich voicings
// ─────────────────────────────────────────────────────────────
const rhodesFilter = new Tone.Filter(2500, "lowpass").connect(chorus);
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.8,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.008, decay: 1.2, sustain: 0.35, release: 1.5 },
  modulation: { type: "sine" },
  modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.8 }
}).connect(rhodesFilter);
rhodes.volume.value = -11;

const rhodesPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.32 : section === 2 ? 0.58 : 0.45;
  rhodes.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["D3", "F3", "A3", "C4", "E4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["D3", "A3", "E4"], null,
  ["D3", "F3", "A3", "C4", "E4"], null, null, null, null, null, null, null, null, null, ["F3", "C4"], null, null, null, ["D3", "A3"], null,
  ["G2", "B2", "D3", "F3", "A3", "E4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G2", "F3", "E4"], null,
  ["G2", "B2", "D3", "F3", "A3", "E4"], null, null, null, null, null, null, null, null, null, ["D3", "A3"], null, null, null, ["B2", "F3"], null,
  ["C3", "E3", "G3", "B3", "D4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["C3", "G3", "D4"], null,
  ["C3", "E3", "G3", "B3", "D4"], null, null, null, null, null, null, null, null, null, ["E3", "B3"], null, null, null, ["C3", "G3"], null,
  ["A2", "C#3", "E3", "G3", "B3"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["A2", "C#3", "Eb3", "G3", "Bb3"], null, null, null, null, null, null, null, ["A2", "Eb3", "Bb3"], null, null, null, ["C#3", "G3"], null, ["A2", "E3", "G3", "B3"], null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - warm background
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1800, "lowpass").connect(roomReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.6, release: 2 }
}).connect(padFilter);
pad.volume.value = -20;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.35 : section === 0 ? 0.15 : 0.25;
  pad.triggerAttackRelease(c, "1m", t, vel);
}, [
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "E5"], null, null, null, null, null, null, null,
  ["G4", "E5"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["A4", "E5"], null, null, null, null, null, null, null,
  ["A4", "E5"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - saxophone-like melodic lines
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(4000, "lowpass").connect(tapeDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.05, decay: 0.4, sustain: 0.5, release: 0.6 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.55);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "A4", "C5",
  "D5", null, null, null, "E5", null, null, null, "F5", null, "E5", null, "D5", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D5", "E5",
  "F5", null, null, null, "A5", null, null, null, "G5", null, "F5", null, "E5", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G4", "B4",
  "C5", null, null, null, "D5", null, null, null, "E5", null, "D5", null, "C5", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "E5", null, "C#5", null, "A4", null, null, null, "Bb4", null, "B4", null, "C5", null, "C#5", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Vibraphone - bell-like accents
// ─────────────────────────────────────────────────────────────
const vibesFilter = new Tone.Filter(5000, "lowpass").connect(tapeDelay);
const vibes = new Tone.FMSynth({
  harmonicity: 6, modulationIndex: 2,
  envelope: { attack: 0.01, decay: 2, sustain: 0, release: 1.5 }
}).connect(vibesFilter);
vibes.volume.value = -18;

const vibesPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 1) return;
  vibes.triggerAttackRelease(n, "8n", t, 0.4);
}, [
  "A5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "E5", null, null, null,
  null, null, null, null, "F5", null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "A5", null, null, null,
  "G5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "D5", null, null, null,
  null, null, null, null, "E5", null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, "G5", null, null, null, null, null, null, null
], "4n").start(0);

Tone.Transport.start();`,
};
