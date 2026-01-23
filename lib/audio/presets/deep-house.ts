import { Preset } from './types';

export const deepHouse: Preset = {
  id: 'deep-house',
  name: 'Sunset Drive',
  genre: 'Deep House',
  bpm: 122,
  description: 'Groovy four-on-floor with warm pads and funky bass',
  code: `// ═══════════════════════════════════════════════════════════
// Sunset Drive - 32-bar Deep House arrangement
// Sections: A(intro) B(build) C(drop) D(breakdown)
// Key: Fm - Bbm - Eb - Ab
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 122;
Tone.Transport.swing = 0.02;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm and punchy
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.02, release: 0.2 }).connect(limiter);
const masterReverb = new Tone.Reverb({ decay: 2.8, wet: 0.22 }).connect(masterComp);
const pingPong = new Tone.PingPongDelay("8n", 0.28).connect(masterReverb);
pingPong.wet.value = 0.18;
const warmChorus = new Tone.Chorus(2, 4, 0.4).connect(pingPong).start();
const warmFilter = new Tone.Filter(6000, "lowpass").connect(warmChorus);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - punchy and groovy
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 }
}).connect(masterComp);
kick.volume.value = -4;

const kickLayer = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 }
}).connect(masterComp);
kickLayer.volume.value = -20;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 }
}).connect(masterReverb);
clap.volume.value = -10;

const snareLayer = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(masterReverb);
snareLayer.volume.value = -16;

const hatC = new Tone.MetalSynth({
  envelope: { decay: 0.03 }, harmonicity: 5.1, resonance: 4000, octaves: 1
}).connect(warmFilter);
hatC.volume.value = -18;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.1 }, harmonicity: 5.1, resonance: 3500, octaves: 1
}).connect(warmFilter);
hatO.volume.value = -20;

const perc = new Tone.MembraneSynth({
  pitchDecay: 0.01, octaves: 3, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(masterReverb);
perc.volume.value = -14;

const rimshot = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }
}).connect(warmFilter);
rimshot.volume.value = -14;

// Four-on-floor with section variation
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.6 : section === 3 ? 0.5 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
  kickLayer.triggerAttackRelease("32n", t, v * 0.4 * intensity);
}, [
  // 8 bars = 128 16th notes
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.5,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.6, 0.7,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.6,
  0.8, null, null, null, 0.7, null, null, null, null, null, null, null, 0.8, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, 0.7, 0.8
], "16n").start(0);

const clapPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  if (section === 2) snareLayer.triggerAttackRelease("16n", t, v * 0.4);
  clap.triggerAttackRelease("8n", t, v);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.4,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.3, null, null, null, null, 1, null, 0.4, 0.5,
  null, null, null, null, 1, null, null, null, null, null, 0.3, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.4, null, null, null, null, null, 1, null, 0.5, 0.6,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.5, 0.6, 0.7
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.1 : section === 0 ? 0.6 : 1;
  if (v > 0.8) hatO.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hatC.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.5, 0.9, 0.5, 0.6, 0.5, 0.9, 0.5, 0.7, 0.5, 0.9, 0.5, 0.6, 0.5, 0.9, 0.5, 0.7,
  0.55, 0.9, 0.5, 0.65, 0.5, 0.85, 0.55, 0.7, 0.5, 0.9, 0.55, 0.6, 0.5, 0.9, 0.6, 0.75,
  0.5, 0.92, 0.52, 0.62, 0.52, 0.9, 0.52, 0.72, 0.52, 0.9, 0.52, 0.62, 0.52, 0.92, 0.55, 0.72,
  0.55, 0.92, 0.55, 0.68, 0.55, 0.88, 0.58, 0.72, 0.55, 0.92, 0.58, 0.65, 0.55, 0.92, 0.65, 0.78
], "8n").start(0);

const percPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 1) return;
  perc.triggerAttackRelease(n, "16n", t, 0.6);
}, [
  null, null, null, "G3", null, null, null, null, null, null, null, "G3", null, null, null, null,
  null, null, null, "G3", null, null, null, "A3", null, null, null, "G3", null, null, "A3", null,
  null, null, null, "G3", null, null, null, null, null, null, null, "G3", null, null, "F3", null,
  null, null, null, "G3", null, null, "A3", null, null, null, null, "G3", null, "A3", null, "Bb3"
], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  rimshot.triggerAttackRelease("32n", t, v);
}, [
  null, null, null, null, null, null, null, 0.5, null, null, null, null, null, null, null, 0.55,
  null, null, 0.4, null, null, null, null, 0.5, null, null, null, 0.45, null, null, 0.5, null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - Fm - Bbm - Eb - Ab progression with funky variations
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(800, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 },
  filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 3 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.9 : section === 3 ? 0.6 : 0.75;
  bass.triggerAttackRelease(n, "16n", t, vel);
}, [
  // Fm (F Ab C)
  "F1", null, "F2", "F1", null, "Ab1", null, null, "F1", null, "F2", "F1", null, "Ab1", null, "F1",
  "F1", null, "C2", "F1", null, "Ab1", null, "C2", "F1", null, "F2", "Ab1", null, "C2", null, "F1",
  // Bbm (Bb Db F)
  "Bb1", null, "Bb2", "Bb1", null, "Db2", null, null, "Bb1", null, "Bb2", "Bb1", null, "Db2", null, "Bb1",
  "Bb1", null, "F2", "Bb1", null, "Db2", null, "F2", "Bb1", null, "Bb2", "Db2", null, "F2", null, "Bb1",
  // Eb (Eb G Bb)
  "Eb1", null, "Eb2", "Eb1", null, "G1", null, null, "Eb1", null, "Eb2", "Eb1", null, "G1", null, "Eb1",
  "Eb1", null, "Bb1", "Eb1", null, "G1", null, "Bb1", "Eb1", null, "Eb2", "G1", null, "Bb1", null, "Eb1",
  // Ab (Ab C Eb)
  "Ab1", null, "Ab2", "Ab1", null, "C2", null, null, "Ab1", null, "Ab2", "Ab1", null, "C2", null, "Ab1",
  "Ab1", null, "Eb2", "Ab1", null, "C2", "Eb2", null, "Ab1", null, "Ab2", "C2", null, "Eb2", "C2", "Ab1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Chords and Pads - warm and evolving
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(3000, "lowpass").connect(warmFilter);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.5, decay: 0.5, sustain: 0.6, release: 1 }
}).connect(padFilter);
pad.volume.value = -14;

const stabFilter = new Tone.Filter(2500, "lowpass").connect(pingPong);
const stab = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(stabFilter);
stab.volume.value = -12;

const organFilter = new Tone.Filter(2000, "lowpass").connect(warmChorus);
const organ = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 1, modulationIndex: 0.5,
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5 }
}).connect(organFilter);
organ.volume.value = -16;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.25 : section === 2 ? 0.45 : 0.35;
  pad.triggerAttackRelease(c, "1n", t, vel);
}, [
  ["F3", "Ab3", "C4"], null, null, null, null, null, null, null,
  ["F3", "Ab3", "C4"], null, null, null, null, null, null, null,
  ["Bb3", "Db4", "F4"], null, null, null, null, null, null, null,
  ["Bb3", "Db4", "F4"], null, null, null, null, null, null, null,
  ["Eb3", "G3", "Bb3"], null, null, null, null, null, null, null,
  ["Eb3", "G3", "Bb3"], null, null, null, null, null, null, null,
  ["Ab3", "C4", "Eb4"], null, null, null, null, null, null, null,
  ["Ab3", "C4", "Eb4"], null, null, null, null, null, null, null
], "2n").start(0);

const stabPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  stab.triggerAttackRelease(c, "16n", t, 0.6);
}, [
  null, null, null, ["F4", "Ab4", "C5"], null, null, null, null, null, null, null, ["F4", "Ab4"], null, null, null, null,
  null, null, null, ["F4", "Ab4", "C5"], null, null, null, null, null, null, ["Ab4", "C5"], null, null, null, null, null,
  null, null, null, ["Bb4", "Db5", "F5"], null, null, null, null, null, null, null, ["Bb4", "Db5"], null, null, null, null,
  null, null, null, ["Bb4", "Db5", "F5"], null, null, null, null, null, null, ["Db5", "F5"], null, null, null, null, null,
  null, null, null, ["Eb4", "G4", "Bb4"], null, null, null, null, null, null, null, ["Eb4", "G4"], null, null, null, null,
  null, null, null, ["Eb4", "G4", "Bb4"], null, null, null, null, null, null, ["G4", "Bb4"], null, null, null, null, null,
  null, null, null, ["Ab4", "C5", "Eb5"], null, null, null, null, null, null, null, ["Ab4", "C5"], null, null, null, null,
  null, null, null, ["Ab4", "C5", "Eb5"], null, null, null, null, null, null, ["C5", "Eb5"], null, null, null, null, null
], "16n").start(0);

const organPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section < 2) return;
  organ.triggerAttackRelease(c, "8n", t, 0.4);
}, [
  null, null, null, null, null, null, ["F3", "Ab3"], null, null, null, null, null, null, null, ["C4", "Eb4"], null,
  null, null, null, null, null, null, ["Bb3", "Db4"], null, null, null, null, null, null, null, ["F4", "Ab4"], null,
  null, null, null, null, null, null, ["Eb3", "G3"], null, null, null, null, null, null, null, ["Bb3", "Db4"], null,
  null, null, null, null, null, null, ["Ab3", "C4"], null, null, null, null, null, null, null, ["Eb4", "G4"], null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - melodic fills in sections B and C
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(4000, "lowpass").connect(pingPong);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.5 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.55);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "C5", "Ab4",
  null, null, null, null, null, null, null, null, null, null, null, null, "F5", null, "Eb5", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "F5", "Db5",
  null, null, null, null, null, null, null, null, null, null, null, null, "Ab5", null, "G5", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Bb4", "G4",
  null, null, null, null, null, null, null, null, null, null, null, null, "Eb5", null, "Db5", null,
  null, null, null, null, null, null, null, null, "Eb5", null, "C5", null, "Ab4", null, null, null,
  null, null, null, null, null, null, null, null, "C5", null, "Eb5", null, "Ab5", null, "G5", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - subtle movement
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(3500, "lowpass").connect(pingPong);
const arp = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
}).connect(arpFilter);
arp.volume.value = -16;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  arp.triggerAttackRelease(n, "16n", t, 0.45);
}, [
  "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Eb5",
  "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Ab4", "Eb5", "C5", "Ab4", "F4",
  "Bb4", "Db5", "F5", "Db5", "Bb4", "Db5", "F5", "Db5", "Bb4", "Db5", "F5", "Db5", "Bb4", "Db5", "F5", "Ab5",
  "Bb4", "Db5", "F5", "Db5", "Bb4", "Db5", "F5", "Db5", "Bb4", "Db5", "F5", "Db5", "Ab5", "F5", "Db5", "Bb4",
  "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "Db5",
  "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "G4", "Db5", "Bb4", "G4", "Eb4",
  "Ab4", "C5", "Eb5", "C5", "Ab4", "C5", "Eb5", "C5", "Ab4", "C5", "Eb5", "C5", "Ab4", "C5", "Eb5", "G5",
  "Ab4", "C5", "Eb5", "C5", "Ab4", "C5", "Eb5", "C5", "Ab4", "C5", "Eb5", "C5", "G5", "Eb5", "C5", "Ab4"
], "16n").start(0);

Tone.Transport.start();`
};
