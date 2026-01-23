import { Preset } from "./types";

export const darkTechno: Preset = {
  id: "dark-techno",
  name: "Warehouse",
  genre: "Dark Techno",
  bpm: 132,
  description: "Hypnotic dark techno with industrial textures",
  code: `// ═══════════════════════════════════════════════════════════
// Warehouse - 32-bar Dark Techno
// Sections: A(intro) B(build) C(peak) D(breakdown)
// Key: Am
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 132;

// ─────────────────────────────────────────────────────────────
// Master Chain - industrial and aggressive
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const distortion = new Tone.Distortion(0.2).connect(limiter);
const masterComp = new Tone.Compressor({ threshold: -15, ratio: 5, attack: 0.01, release: 0.15 }).connect(distortion);
const darkReverb = new Tone.Reverb({ decay: 4.5, wet: 0.18 }).connect(masterComp);
const industrialDelay = new Tone.FeedbackDelay("8n.", 0.38).connect(darkReverb);
industrialDelay.wet.value = 0.15;
const darkFilter = new Tone.Filter(3000, "lowpass").connect(industrialDelay);
const bitCrusher = new Tone.BitCrusher(8).connect(darkFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - Industrial punch with layering
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 8, envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.2 }
}).connect(masterComp);
kick.volume.value = -3;

const kickLayer = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }
}).connect(masterComp);
kickLayer.volume.value = -18;

const kickSub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(masterComp);
kickSub.volume.value = -10;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(darkReverb);
clap.volume.value = -12;

const clapLayer = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(darkReverb);
clapLayer.volume.value = -16;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1
}).connect(darkFilter);
hat.volume.value = -20;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4500, octaves: 1
}).connect(darkFilter);
hatO.volume.value = -22;

const ride = new Tone.MetalSynth({
  envelope: { decay: 0.12 }, harmonicity: 8, modulationIndex: 20, resonance: 6000, octaves: 1
}).connect(darkFilter);
ride.volume.value = -22;

const tom = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 }
}).connect(darkReverb);
tom.volume.value = -12;

// 32-bar kick pattern with fills
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 3 ? 0.4 : 1;
  kick.triggerAttackRelease("C0", "16n", t, v * intensity);
  kickLayer.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  kickSub.triggerAttackRelease("C0", "16n", t, v * 0.3 * intensity);
}, [
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.7,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.6, 0.8,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.7,
  1, null, null, 0.5, 1, null, null, null, 1, null, 0.4, null, 1, null, 0.6, 0.8,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.7,
  1, null, 0.4, null, 1, null, null, 0.5, 1, null, null, null, 1, null, 0.7, 0.9,
  0.8, null, null, null, null, null, null, null, 0.7, null, null, null, null, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, 0.6, 0.7, 0.9
], "16n").start(0);

const clapPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  if (section === 2) clapLayer.triggerAttackRelease("16n", t, v * 0.4);
  clap.triggerAttackRelease("16n", t, v);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.4, null, null, null, null, 1, null, 0.5, 0.6,
  null, null, null, null, 1, null, null, null, null, null, 0.35, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.4, null, null, null, null, 0.45, 1, null, 0.55, 0.65,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.5, 0.65, 0.8
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.7 : 1;
  if (v > 0.85) hatO.triggerAttackRelease("32n", t, v * 0.45 * intensity);
  else hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4, 0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.5,
  0.75, 0.35, 0.55, 0.35, 0.7, 0.35, 0.55, 0.45, 0.7, 0.35, 0.5, 0.4, 0.75, 0.35, 0.65, 0.55,
  0.7, 0.35, 0.55, 0.35, 0.75, 0.35, 0.55, 0.45, 0.75, 0.35, 0.55, 0.4, 0.75, 0.35, 0.65, 0.55,
  0.75, 0.4, 0.6, 0.4, 0.75, 0.4, 0.6, 0.5, 0.75, 0.4, 0.55, 0.45, 0.8, 0.4, 0.9, 0.6
], "16n").start(0);

const ridePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 2) return;
  ride.triggerAttackRelease("32n", t, v);
}, [
  null, 0.4, null, null, null, 0.45, null, null, null, 0.4, null, null, null, 0.5, null, null,
  null, 0.45, null, null, null, 0.5, null, null, null, 0.45, null, null, null, 0.55, null, 0.4,
  null, 0.45, null, 0.35, null, 0.5, null, null, null, 0.45, null, 0.35, null, 0.55, null, 0.4,
  null, 0.5, null, 0.4, null, 0.55, null, 0.4, null, 0.5, null, 0.4, null, 0.6, 0.45, 0.5
], "16n").start(0);

const tomPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  tom.triggerAttackRelease(n, "8n", t, 0.7);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "G2", "E2", "C2", "A1",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "A2", "G2", "E2", "C2"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Acid Bass - Am key with resonant filter
// ─────────────────────────────────────────────────────────────
const acidFilter = new Tone.Filter(1500, "lowpass").connect(darkFilter);
acidFilter.Q.value = 8;
const acidBass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0.2, release: 0.1 },
  filterEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.1, baseFrequency: 150, octaves: 4 }
}).connect(acidFilter);
acidBass.volume.value = -9;

// Filter automation
const filterLFO = new Tone.LFO("4n", 600, 2500).connect(acidFilter.frequency).start();

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 2 ? 0.95 : section === 3 ? 0.5 : 0.8;
  acidBass.triggerAttackRelease(n, "16n", t, vel);
}, [
  "A1", null, "A1", "A2", null, "A1", null, "G1", "A1", null, "A1", "C2", null, "A1", null, "E1",
  "A1", null, "A1", "A2", null, "A1", "G1", "A1", "A1", null, "C2", "A1", null, "A1", "E1", "G1",
  "A1", null, "A1", "A2", null, "A1", null, "G1", "A1", null, "A1", "C2", null, "A1", null, "E1",
  "A1", "A2", "A1", null, "G1", "A1", null, "E1", "A1", null, "A2", "G1", "A1", null, "E1", "A1",
  "A1", null, "A1", "A2", null, "A1", null, "G1", "A1", null, "C2", "A1", null, "A1", null, "E1",
  "A1", null, "A2", "A1", null, "G1", "A1", "E1", "A1", null, "A1", "C2", "A1", "G1", "E1", "A1",
  "A1", null, null, null, "A1", null, null, null, "A1", null, null, null, null, null, null, null,
  "A1", null, "A1", "A2", null, "A1", "G1", "E1", "A1", "C2", "A1", "G1", "A1", "E1", "G1", "A2"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Dark Pad - atmospheric and evolving
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(800, "lowpass").connect(darkReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 2, decay: 2, sustain: 0.5, release: 3 }
}).connect(padFilter);
pad.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.3 : 0.2;
  pad.triggerAttackRelease(c, "1m", t, vel);
}, [
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Stab Synth - punchy accents
// ─────────────────────────────────────────────────────────────
const stabFilter = new Tone.Filter(2500, "lowpass").connect(industrialDelay);
const stab = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
}).connect(stabFilter);
stab.volume.value = -14;

const stabPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  stab.triggerAttackRelease(n, "32n", t, 0.7);
}, [
  null, null, null, "A4", null, null, null, null, null, null, null, null, null, null, "E4", null,
  null, null, null, "A4", null, null, null, null, null, null, null, null, "C5", null, null, null,
  null, null, null, "A4", null, null, null, "G4", null, null, null, null, null, null, "E4", null,
  null, null, null, "A4", null, null, "C5", null, null, "A4", null, null, "G4", null, "E4", null,
  null, null, null, "A4", null, null, null, null, null, null, "G4", null, null, null, "E4", null,
  null, null, null, "A4", null, null, null, "G4", null, null, "C5", null, null, "A4", "G4", "E4",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, "A4", null, null, "G4", null, null, "E4", null, null, "C5", "A4", "G4", "E4"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Industrial Noise Sweeps
// ─────────────────────────────────────────────────────────────
const noiseFilter = new Tone.Filter(2000, "bandpass").connect(bitCrusher);
noiseFilter.Q.value = 5;
const noise = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 1 }
}).connect(noiseFilter);
noise.volume.value = -26;

const noisePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section !== 2) return;
  noise.triggerAttackRelease("1m", t, v);
}, [
  0.25, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`,
};
