import { Preset } from "./types";

export const chillwave: Preset = {
  id: "chillwave",
  name: "Neon Dreams",
  genre: "Chillwave",
  bpm: 100,
  description: "Dreamy retro synths with shimmering pads and nostalgic warmth",
  tags: ["dreamy", "retro", "synthwave", "nostalgic"],
  code: `// ═══════════════════════════════════════════════════════════
// Neon Dreams - 32-bar Chillwave arrangement
// Sections: A(intro) B(build) C(full) D(outro)
// Key: Cmaj7 - Am7 - Fmaj7 - G
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 100;
Tone.Transport.swing = 0.03;

// ─────────────────────────────────────────────────────────────
// Master Chain - lush and warm
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -22, ratio: 2.5, attack: 0.1, release: 0.35 }).connect(limiter);
const lushReverb = new Tone.Reverb({ decay: 5, wet: 0.4 }).connect(masterComp);
const dreamDelay = new Tone.FeedbackDelay("8n.", 0.45).connect(lushReverb);
dreamDelay.wet.value = 0.3;
const chorus = new Tone.Chorus(1.5, 4, 0.6).connect(dreamDelay).start();
const warmFilter = new Tone.Filter(7000, "lowpass").connect(chorus);
const vibrato = new Tone.Vibrato(3, 0.15).connect(warmFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - soft and electronic
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.06, octaves: 4, envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.35 }
}).connect(masterComp);
kick.volume.value = -6;

const snare = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.003, decay: 0.15, sustain: 0.01, release: 0.1 }
}).connect(lushReverb);
snare.volume.value = -10;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.008, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(lushReverb);
clap.volume.value = -14;

const hihat = new Tone.MetalSynth({
  envelope: { decay: 0.035 }, harmonicity: 5, resonance: 4500, octaves: 1
}).connect(warmFilter);
hihat.volume.value = -22;

const shaker = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }
}).connect(warmFilter);
shaker.volume.value = -24;

const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.55 : section === 3 ? 0.6 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
}, [
  0.9, null, null, null, null, null, null, null, 0.85, null, null, null, null, null, null, null,
  0.9, null, null, null, null, null, null, 0.4, 0.85, null, null, null, null, null, null, 0.45,
  0.92, null, null, null, null, null, null, null, 0.88, null, null, null, null, null, null, null,
  0.92, null, null, 0.4, null, null, null, 0.45, 0.88, null, null, null, null, null, 0.4, 0.5,
  0.95, null, null, null, null, null, null, null, 0.9, null, null, null, null, null, null, null,
  0.95, null, null, 0.45, null, null, null, 0.5, 0.9, null, null, null, null, null, 0.45, 0.55,
  0.85, null, null, null, null, null, null, null, 0.8, null, null, null, null, null, null, null,
  0.88, null, null, null, null, null, null, null, 0.85, null, null, 0.4, null, null, 0.45, 0.55
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0) return;
  snare.triggerAttackRelease("16n", t, v * 0.85);
  if (section === 2) clap.triggerAttackRelease("16n", t, v * 0.5);
}, [
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.35,
  null, null, null, null, 0.92, null, null, null, null, null, null, null, 0.88, null, null, null,
  null, null, null, null, 0.92, null, null, 0.3, null, null, null, null, 0.88, null, 0.35, 0.45,
  null, null, null, null, 0.95, null, null, null, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.35, null, null, null, null, null, 0.9, null, 0.4, 0.5,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 0.88, null, null, null, null, null, null, null, 0.85, 0.4, 0.5, 0.6
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1 : section === 0 ? 0.5 : 0.8;
  hihat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.5, 0.3, 0.45, 0.3, 0.5, 0.3, 0.45, 0.35, 0.5, 0.3, 0.45, 0.3, 0.5, 0.35, 0.5, 0.35,
  0.52, 0.32, 0.48, 0.32, 0.52, 0.32, 0.48, 0.38, 0.52, 0.32, 0.48, 0.32, 0.52, 0.38, 0.52, 0.38,
  0.55, 0.35, 0.5, 0.35, 0.55, 0.35, 0.5, 0.4, 0.55, 0.35, 0.5, 0.35, 0.55, 0.4, 0.55, 0.4,
  0.58, 0.38, 0.52, 0.38, 0.58, 0.38, 0.52, 0.42, 0.58, 0.38, 0.52, 0.38, 0.58, 0.42, 0.58, 0.45
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - warm analog-style
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(700, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "square" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 },
  filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 150, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.85 : section === 3 ? 0.6 : 0.72;
  bass.triggerAttackRelease(n, "8n", t, vel);
}, [
  // Cmaj7
  "C2", null, "C2", null, null, null, "E2", null, "C2", null, "C2", null, null, "G1", null, null,
  "C2", null, "C2", null, null, "E2", null, "G2", "C2", null, "C2", null, "B1", null, "G1", null,
  // Am7
  "A1", null, "A1", null, null, null, "C2", null, "A1", null, "A1", null, null, "E2", null, null,
  "A1", null, "A1", null, null, "C2", null, "E2", "A1", null, "A1", null, "G1", null, "E1", null,
  // Fmaj7
  "F1", null, "F1", null, null, null, "A1", null, "F1", null, "F1", null, null, "C2", null, null,
  "F1", null, "F1", null, null, "A1", null, "C2", "F1", null, "F1", null, "E1", null, "C1", null,
  // G
  "G1", null, "G1", null, null, null, "B1", null, "G1", null, "G1", null, null, "D2", null, null,
  "G1", null, "G1", null, null, "B1", null, "D2", "G1", null, "G1", null, "F1", null, "D1", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Synth Pads - lush and evolving
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(3500, "lowpass").connect(lushReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.6, release: 2.5 }
}).connect(padFilter);
pad.volume.value = -14;

const padWarm = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 2, decay: 1.5, sustain: 0.5, release: 3 }
}).connect(chorus);
padWarm.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.5 : section === 0 ? 0.22 : 0.38;
  pad.triggerAttackRelease(c, "1m", t, vel);
  padWarm.triggerAttackRelease(c, "1m", t + 0.3, vel * 0.7);
}, [
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - shimmering 80s style
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(4000, "lowpass").connect(dreamDelay);
const arp = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 }
}).connect(arpFilter);
arp.volume.value = -16;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.6 : section === 3 ? 0.35 : 0.48;
  arp.triggerAttackRelease(n, "16n", t, vel);
}, [
  "C4", "E4", "G4", "B4", "G4", "E4", "C4", "B3", "C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4",
  "C4", "E4", "G4", "B4", "G4", "E4", "C4", "E4", "G4", "B4", "C5", "E5", "C5", "B4", "G4", "E4",
  "A3", "C4", "E4", "G4", "E4", "C4", "A3", "G3", "A3", "C4", "E4", "G4", "A4", "G4", "E4", "C4",
  "A3", "C4", "E4", "G4", "E4", "C4", "A3", "C4", "E4", "G4", "A4", "C5", "A4", "G4", "E4", "C4",
  "F3", "A3", "C4", "E4", "C4", "A3", "F3", "E3", "F3", "A3", "C4", "E4", "F4", "E4", "C4", "A3",
  "F3", "A3", "C4", "E4", "C4", "A3", "F3", "A3", "C4", "E4", "F4", "A4", "F4", "E4", "C4", "A3",
  "G3", "B3", "D4", "F4", "D4", "B3", "G3", "F3", "G3", "B3", "D4", "F4", "G4", "F4", "D4", "B3",
  "G3", "B3", "D4", "F4", "D4", "B3", "G3", "B3", "D4", "F4", "G4", "B4", "G4", "F4", "D4", "B3"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - soft melodic lines
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(3000, "lowpass").connect(vibrato);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.1, decay: 0.5, sustain: 0.4, release: 0.8 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 2) return;
  lead.triggerAttackRelease(n, "4n", t, 0.5);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G4", null,
  "E5", null, null, null, "D5", null, null, null, "C5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "E4", null,
  "C5", null, null, null, "B4", null, null, null, "A4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "C4", null,
  "A4", null, null, null, "G4", null, null, null, "F4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D4", null,
  "B4", null, null, null, "A4", null, null, null, "G4", null, null, null, null, null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Shimmer - high sparkle texture
// ─────────────────────────────────────────────────────────────
const shimmerFilter = new Tone.Filter(8000, "lowpass").connect(dreamDelay);
const shimmer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 2 }
}).connect(shimmerFilter);
shimmer.volume.value = -24;

const shimmerPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 1 || section === 3) return;
  shimmer.triggerAttackRelease(n, "16n", t, 0.35);
}, [
  null, null, null, null, null, null, null, null, "C6", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "G5", null, null, null, null, null, null, null, "B5", null,
  null, null, null, null, null, null, null, null, "A5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "E5", null, null, null, null, null, null, null, "G5", null,
  null, null, null, null, null, null, null, null, "F5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "C5", null, null, null, null, null, null, null, "E5", null,
  null, null, null, null, null, null, null, null, "G5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "D5", null, null, null, null, null, null, null, "F5", null
], "8n").start(0);

Tone.Transport.start();`,
};
