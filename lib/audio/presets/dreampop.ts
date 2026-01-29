import { Preset } from "./types";

export const dreampop: Preset = {
  id: "dreampop",
  name: "Velvet Haze",
  genre: "Dreampop",
  bpm: 75,
  description: "Lush reverb-drenched soundscapes with ethereal textures",
  tags: ["ethereal", "shoegaze", "lush", "dreamy"],
  code: `// ═══════════════════════════════════════════════════════════
// Velvet Haze - 32-bar Dreampop arrangement
// Sections: A(intro) B(build) C(full) D(outro)
// Key: Em - C - G - D
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 75;
Tone.Transport.swing = 0.02;

// ─────────────────────────────────────────────────────────────
// Master Chain - massive reverb and shimmer
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-4).toDestination();
const masterComp = new Tone.Compressor({ threshold: -24, ratio: 2, attack: 0.2, release: 0.5 }).connect(limiter);
const hugeReverb = new Tone.Reverb({ decay: 8, wet: 0.55 }).connect(masterComp);
const shimmerDelay = new Tone.FeedbackDelay("4n.", 0.55).connect(hugeReverb);
shimmerDelay.wet.value = 0.4;
const secondDelay = new Tone.FeedbackDelay("8n", 0.35).connect(shimmerDelay);
secondDelay.wet.value = 0.25;
const dreamChorus = new Tone.Chorus(0.8, 6, 0.7).connect(secondDelay).start();
const warmFilter = new Tone.Filter(6000, "lowpass").connect(dreamChorus);
const phaser = new Tone.Phaser({ frequency: 0.15, octaves: 3, baseFrequency: 500 }).connect(warmFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - soft and distant
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.002, decay: 0.5, sustain: 0.02, release: 0.5 }
}).connect(masterComp);
kick.volume.value = -10;

const snare = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.02, release: 0.15 }
}).connect(hugeReverb);
snare.volume.value = -14;

const hihat = new Tone.MetalSynth({
  envelope: { decay: 0.06 }, harmonicity: 5, resonance: 4000, octaves: 1
}).connect(shimmerDelay);
hihat.volume.value = -24;

const tom = new Tone.MembraneSynth({
  pitchDecay: 0.04, octaves: 3, envelope: { attack: 0.002, decay: 0.3, sustain: 0.01, release: 0.2 }
}).connect(hugeReverb);
tom.volume.value = -18;

const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.4 : section === 3 ? 0.5 : 1;
  kick.triggerAttackRelease("C1", "4n", t, v * intensity);
}, [
  0.85, null, null, null, null, null, null, null, 0.8, null, null, null, null, null, null, null,
  0.85, null, null, null, null, null, null, null, 0.8, null, null, null, null, null, null, 0.4,
  0.88, null, null, null, null, null, null, null, 0.82, null, null, null, null, null, null, null,
  0.88, null, null, null, null, null, null, 0.4, 0.82, null, null, null, null, null, 0.4, 0.5,
  0.9, null, null, null, null, null, null, null, 0.85, null, null, null, null, null, null, null,
  0.9, null, null, null, null, null, null, 0.45, 0.85, null, null, null, null, null, 0.45, 0.55,
  0.8, null, null, null, null, null, null, null, 0.75, null, null, null, null, null, null, null,
  0.85, null, null, null, null, null, null, null, 0.8, null, null, null, null, null, 0.45, 0.55
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0) return;
  snare.triggerAttackRelease("8n", t, v * 0.75);
}, [
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, 0.3,
  null, null, null, null, 0.82, null, null, null, null, null, null, null, 0.78, null, null, null,
  null, null, null, null, 0.82, null, null, 0.3, null, null, null, null, 0.78, null, 0.35, 0.42,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 0.85, null, 0.3, null, null, null, null, null, 0.8, null, 0.38, 0.48,
  null, null, null, null, 0.72, null, null, null, null, null, null, null, 0.68, null, null, null,
  null, null, null, null, 0.78, null, null, null, null, null, null, null, 0.75, 0.4, 0.48, 0.58
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  hihat.triggerAttackRelease("32n", t, v * 0.6);
}, [
  0.4, null, 0.35, null, 0.42, null, 0.35, null, 0.4, null, 0.35, null, 0.42, null, 0.38, null,
  0.42, null, 0.38, null, 0.45, null, 0.38, null, 0.42, null, 0.38, null, 0.45, null, 0.4, null,
  0.45, null, 0.4, null, 0.48, null, 0.4, null, 0.45, null, 0.4, null, 0.48, null, 0.42, null,
  0.48, null, 0.42, null, 0.5, null, 0.42, null, 0.48, null, 0.42, null, 0.5, null, 0.45, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - soft and pillowy
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(400, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.1, decay: 0.4, sustain: 0.6, release: 0.8 },
  filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, baseFrequency: 80, octaves: 1 }
}).connect(bassFilter);
bass.volume.value = -10;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.75 : section === 3 ? 0.5 : 0.62;
  bass.triggerAttackRelease(n, "2n", t, vel);
}, [
  // Em
  "E1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "E1", null, null, null, null, null, null, null, null, null, null, null, "G1", null, null, null,
  // C
  "C1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "C1", null, null, null, null, null, null, null, null, null, null, null, "E1", null, null, null,
  // G
  "G1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "G1", null, null, null, null, null, null, null, null, null, null, null, "B1", null, null, null,
  // D
  "D1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "D1", null, null, null, null, null, null, null, null, null, null, null, "F#1", null, null, null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pads - massive and evolving
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(2500, "lowpass").connect(hugeReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 3, decay: 2, sustain: 0.7, release: 5 }
}).connect(padFilter);
pad.volume.value = -14;

const padWarm = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 4, decay: 3, sustain: 0.6, release: 6 }
}).connect(phaser);
padWarm.volume.value = -18;

const padHigh = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 5, decay: 4, sustain: 0.5, release: 7 }
}).connect(shimmerDelay);
padHigh.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.5 : section === 0 ? 0.18 : 0.35;
  pad.triggerAttackRelease(c, "1m", t, vel);
  padWarm.triggerAttackRelease(c, "1m", t + 0.5, vel * 0.7);
  if (section >= 1) padHigh.triggerAttackRelease(c, "1m", t + 1, vel * 0.5);
}, [
  ["E3", "G3", "B3", "D4"], null, null, null, null, null, null, null,
  ["E3", "G3", "B3", "D4"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null,
  ["D3", "F#3", "A3", "C4"], null, null, null, null, null, null, null,
  ["D3", "F#3", "A3", "C4"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Guitar shimmer - clean with heavy reverb
// ─────────────────────────────────────────────────────────────
const guitarFilter = new Tone.Filter(4000, "lowpass").connect(shimmerDelay);
const guitar = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.8, sustain: 0.3, release: 1.5 }
}).connect(guitarFilter);
guitar.volume.value = -14;

const guitarPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.25 : section === 2 ? 0.5 : 0.38;
  guitar.triggerAttackRelease(c, "4n", t, vel);
}, [
  ["E4", "B4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G4", "D5"], null,
  ["E4", "B4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["B4", "E5"], null,
  ["C4", "G4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["E4", "B4"], null,
  ["C4", "G4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G4", "C5"], null,
  ["G3", "D4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["B3", "F#4"], null,
  ["G3", "D4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["D4", "G4"], null,
  ["D4", "A4"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null, ["F#4", "C5"], null, null, null, ["A4", "D5"], null, ["D4", "A4", "F#5"], null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - gentle cascading notes
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(3500, "lowpass").connect(secondDelay);
const arp = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.6, sustain: 0.15, release: 1 }
}).connect(arpFilter);
arp.volume.value = -18;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  arp.triggerAttackRelease(n, "8n", t, 0.4);
}, [
  "E4", null, "G4", null, "B4", null, "D5", null, "B4", null, "G4", null, "E4", null, "D4", null,
  "E4", null, "G4", null, "B4", null, "E5", null, "D5", null, "B4", null, "G4", null, "E4", null,
  "C4", null, "E4", null, "G4", null, "B4", null, "G4", null, "E4", null, "C4", null, "B3", null,
  "C4", null, "E4", null, "G4", null, "C5", null, "B4", null, "G4", null, "E4", null, "C4", null,
  "G3", null, "B3", null, "D4", null, "F#4", null, "D4", null, "B3", null, "G3", null, "F#3", null,
  "G3", null, "B3", null, "D4", null, "G4", null, "F#4", null, "D4", null, "B3", null, "G3", null,
  "D4", null, "F#4", null, "A4", null, "C5", null, "A4", null, "F#4", null, "D4", null, "C4", null,
  "D4", null, "F#4", null, "A4", null, "D5", null, "C5", null, "A4", null, "F#4", null, "D4", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - distant and ethereal
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(2500, "lowpass").connect(shimmerDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.2, decay: 0.8, sustain: 0.4, release: 1.5 }
}).connect(leadFilter);
lead.volume.value = -16;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 2) return;
  lead.triggerAttackRelease(n, "2n", t, 0.45);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "B5", null, null, null, null, null, null, null, "G5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "E5", null, null, null, null, null, null, null, "D5", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "D5", null, null, null, null, null, null, null, "B4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "A4", null, null, null, null, null, null, null, "F#4", null, null, null, null, null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Texture - swelling noise
// ─────────────────────────────────────────────────────────────
const textureFilter = new Tone.Filter(1500, "lowpass").connect(hugeReverb);
const texture = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 5, decay: 3, sustain: 0.4, release: 6 }
}).connect(textureFilter);
texture.volume.value = -26;

const texturePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0) return;
  texture.triggerAttackRelease("2m", t, v);
}, [
  0.3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.35, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`,
};
