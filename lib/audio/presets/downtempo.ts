import { Preset } from "./types";

export const downtempo: Preset = {
  id: "downtempo",
  name: "Night City",
  genre: "Downtempo",
  bpm: 90,
  description: "Moody trip-hop vibes with deep bass and atmospheric textures",
  tags: ["moody", "atmospheric", "trip-hop", "nocturnal"],
  code: `// ═══════════════════════════════════════════════════════════
// Night City - 32-bar Downtempo arrangement
// Sections: A(sparse) B(build) C(full) D(breakdown)
// Key: Am - Dm - Em - Fmaj7
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 90;
Tone.Transport.swing = 0.05;

// ─────────────────────────────────────────────────────────────
// Master Chain - dark and spacious
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3.5, attack: 0.08, release: 0.3 }).connect(limiter);
const darkReverb = new Tone.Reverb({ decay: 4, wet: 0.35 }).connect(masterComp);
const stereoDelay = new Tone.PingPongDelay("8n.", 0.4).connect(darkReverb);
stereoDelay.wet.value = 0.25;
const warmFilter = new Tone.Filter(5000, "lowpass").connect(stereoDelay);
const phaser = new Tone.Phaser({ frequency: 0.3, octaves: 2, baseFrequency: 600 }).connect(warmFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - crisp and deep
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 5, envelope: { attack: 0.001, decay: 0.5, sustain: 0.02, release: 0.5 }
}).connect(masterComp);
kick.volume.value = -5;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.002, decay: 0.18, sustain: 0.01, release: 0.12 }
}).connect(darkReverb);
snare.volume.value = -9;

const hihat = new Tone.MetalSynth({
  envelope: { decay: 0.04 }, harmonicity: 4.5, resonance: 3000, octaves: 1
}).connect(warmFilter);
hihat.volume.value = -20;

const hatOpen = new Tone.MetalSynth({
  envelope: { decay: 0.12 }, harmonicity: 4, resonance: 2500, octaves: 1
}).connect(warmFilter);
hatOpen.volume.value = -22;

const perc = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(darkReverb);
perc.volume.value = -16;

const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.5 : section === 3 ? 0.6 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
}, [
  0.95, null, null, null, null, null, null, null, 0.5, null, null, 0.4, 0.9, null, null, null,
  0.95, null, null, null, null, null, 0.45, null, 0.5, null, null, 0.4, 0.9, null, null, 0.5,
  0.95, null, null, null, null, null, null, null, 0.5, null, null, 0.45, 0.9, null, null, null,
  0.95, null, null, 0.4, null, null, 0.5, null, 0.55, null, null, 0.4, 0.9, null, 0.45, 0.55,
  0.98, null, null, null, null, null, null, null, 0.55, null, null, 0.5, 0.92, null, null, null,
  0.98, null, null, 0.45, null, null, 0.5, null, 0.55, null, null, 0.5, 0.92, null, 0.5, 0.6,
  0.85, null, null, null, null, null, null, null, null, null, null, null, 0.8, null, null, null,
  0.9, null, null, null, null, null, null, null, 0.5, null, null, 0.45, 0.88, null, 0.5, 0.6
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0) return;
  snare.triggerAttackRelease("16n", t, v);
}, [
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, 0.9, null, null, 0.3, null, null, null, null, 0.85, null, null, 0.35,
  null, null, null, null, 0.92, null, null, null, null, null, null, null, 0.88, null, null, null,
  null, null, null, null, 0.92, null, null, 0.35, null, null, null, null, 0.88, null, 0.4, 0.5,
  null, null, null, null, 0.95, null, null, null, null, null, 0.3, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.35, null, null, null, null, 0.35, 0.9, null, 0.45, 0.55,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.88, null, null, null, null, null, null, null, 0.85, 0.5, 0.55, 0.65
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.1 : section === 0 ? 0.6 : 1;
  if (v > 0.7) hatOpen.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hihat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.5, 0.25, 0.4, 0.2, 0.75, 0.3, 0.45, 0.25, 0.5, 0.2, 0.4, 0.25, 0.5, 0.25, 0.8, 0.3,
  0.5, 0.25, 0.42, 0.22, 0.5, 0.28, 0.45, 0.28, 0.52, 0.22, 0.42, 0.25, 0.52, 0.28, 0.78, 0.32,
  0.55, 0.28, 0.45, 0.25, 0.8, 0.32, 0.48, 0.28, 0.55, 0.25, 0.45, 0.28, 0.55, 0.28, 0.82, 0.35,
  0.55, 0.28, 0.48, 0.28, 0.55, 0.32, 0.5, 0.32, 0.58, 0.28, 0.48, 0.3, 0.58, 0.32, 0.85, 0.38
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - deep sub with movement
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(500, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
  filterEnvelope: { attack: 0.02, decay: 0.15, sustain: 0.3, baseFrequency: 100, octaves: 1.5 }
}).connect(bassFilter);
bass.volume.value = -6;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 0 ? 0.5 : section === 2 ? 0.85 : 0.7;
  bass.triggerAttackRelease(n, "8n", t, vel);
}, [
  // Am
  "A1", null, null, null, null, null, "A1", null, null, "C2", null, null, "A1", null, null, null,
  "A1", null, null, "E1", null, null, "A1", null, null, "C2", null, "E2", "A1", null, null, "G1",
  // Dm
  "D2", null, null, null, null, null, "D2", null, null, "F2", null, null, "D2", null, null, null,
  "D2", null, null, "A1", null, null, "D2", null, null, "F2", null, "A2", "D2", null, null, "C2",
  // Em
  "E1", null, null, null, null, null, "E1", null, null, "G1", null, null, "E1", null, null, null,
  "E1", null, null, "B1", null, null, "E2", null, null, "G2", null, "B2", "E2", null, null, "D2",
  // Fmaj7
  "F1", null, null, null, null, null, "F1", null, null, "A1", null, null, "F1", null, null, null,
  "F1", null, null, "C2", null, null, "F2", null, null, "A2", null, "E2", "F2", null, "C2", "A1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pads - atmospheric layers
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(2000, "lowpass").connect(darkReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 2, decay: 1.5, sustain: 0.7, release: 3 }
}).connect(padFilter);
pad.volume.value = -16;

const padDark = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 3, decay: 2, sustain: 0.5, release: 4 }
}).connect(phaser);
padDark.volume.value = -20;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.45 : section === 0 ? 0.2 : 0.32;
  pad.triggerAttackRelease(c, "1m", t, vel);
  if (section >= 1) padDark.triggerAttackRelease(c, "1m", t + 0.5, vel * 0.6);
}, [
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["E2", "G2", "B2", "D3"], null, null, null, null, null, null, null,
  ["E2", "G2", "B2", "D3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Electric Piano - Rhodes-like chords
// ─────────────────────────────────────────────────────────────
const epFilter = new Tone.Filter(2500, "lowpass").connect(stereoDelay);
const ep = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.2,
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.2 },
  modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
}).connect(epFilter);
ep.volume.value = -12;

const epPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.3 : section === 2 ? 0.55 : 0.42;
  ep.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["A3", "C4", "E4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["A3", "E4"], null,
  ["A3", "C4", "E4", "G4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["C4", "G4"], null,
  ["D3", "F3", "A3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["D3", "A3"], null,
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["F3", "C4"], null,
  ["E3", "G3", "B3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["E3", "B3"], null,
  ["E3", "G3", "B3", "D4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G3", "D4"], null,
  ["F3", "A3", "C4"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null, ["F3", "C4", "E4"], null, null, null, ["A3", "E4"], null, ["F3", "A3", "C4", "E4"], null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead synth - melodic phrases
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(3500, "lowpass").connect(stereoDelay);
const lead = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.8 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.5);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "E4", "G4",
  "A4", null, null, null, null, null, null, null, "G4", null, "E4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "A4", "C5",
  "D5", null, null, null, null, null, null, null, "C5", null, "A4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "B4", "D5",
  "E5", null, null, null, null, null, null, null, "D5", null, "B4", null, "G4", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "C5", null, "A4", null, "E4", null, null, null, "F4", null, "E4", null, "C4", null, "A3", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Texture - noise atmosphere
// ─────────────────────────────────────────────────────────────
const textureFilter = new Tone.Filter(1200, "lowpass").connect(darkReverb);
const texture = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 3, decay: 2, sustain: 0.4, release: 4 }
}).connect(textureFilter);
texture.volume.value = -26;

const texturePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1) return;
  texture.triggerAttackRelease("2m", t, v);
}, [
  0.3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.35, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`,
};
