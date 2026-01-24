import { Preset } from "./types";

export const rnbSoul: Preset = {
  id: "rnb-soul",
  name: "Velvet",
  genre: "R&B / Neo-Soul",
  bpm: 75,
  description: "Smooth R&B with silky chords and laid-back groove",
  tags: ["smooth", "soulful", "romantic", "laid-back"],
  code: `// ═══════════════════════════════════════════════════════════
// Velvet - 32-bar R&B / Neo-Soul
// Sections: A(intro) B(verse) C(chorus) D(outro)
// Key: Bbmaj9 / Ebmaj9 / Abmaj7 / Gm7
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 75;
Tone.Transport.swing = 0.12;

// ─────────────────────────────────────────────────────────────
// Master Chain - silky and warm
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.08, release: 0.25 }).connect(limiter);
const silkyReverb = new Tone.Reverb({ decay: 2.8, wet: 0.24 }).connect(masterComp);
const smoothDelay = new Tone.FeedbackDelay("8n", 0.32).connect(silkyReverb);
smoothDelay.wet.value = 0.18;
const warmChorus = new Tone.Chorus(2, 4, 0.35).connect(smoothDelay).start();
const velvetFilter = new Tone.Filter(6500, "lowpass").connect(warmChorus);
const stereoWidener = new Tone.StereoWidener(0.6).connect(velvetFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - soft, bouncy, and organic
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.1, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 }
}).connect(masterComp);
kick.volume.value = -6;

const kickLayer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 }
}).connect(masterComp);
kickLayer.volume.value = -14;

const snare = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.15 }
}).connect(silkyReverb);
snare.volume.value = -10;

const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(silkyReverb);
snareBody.volume.value = -16;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.04 }, harmonicity: 5.1, resonance: 3000, octaves: 1
}).connect(velvetFilter);
hat.volume.value = -20;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.12 }, harmonicity: 5.1, resonance: 2800, octaves: 1
}).connect(velvetFilter);
hatO.volume.value = -22;

const rim = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }
}).connect(velvetFilter);
rim.volume.value = -16;

const shaker = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 }
}).connect(velvetFilter);
shaker.volume.value = -22;

// Smooth kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.7 : section === 3 ? 0.8 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
  kickLayer.triggerAttackRelease("C1", "16n", t, v * 0.4 * intensity);
}, [
  0.9, null, null, 0.5, null, null, 0.85, null, null, 0.4, 0.9, null, null, null, 0.5, null,
  0.9, null, null, 0.5, null, null, 0.85, null, null, 0.45, 0.9, null, null, null, 0.55, 0.4,
  0.95, null, null, 0.55, null, null, 0.9, null, null, 0.45, 0.9, null, null, null, 0.5, null,
  0.95, null, null, 0.55, null, 0.3, 0.9, null, null, 0.5, 0.95, null, null, 0.4, 0.55, 0.5,
  0.95, null, null, 0.55, null, null, 0.9, null, null, 0.5, 0.95, null, null, null, 0.55, null,
  0.95, null, 0.3, 0.55, null, null, 0.9, null, 0.35, 0.5, 0.95, null, null, 0.45, 0.6, 0.55,
  0.85, null, null, 0.45, null, null, 0.8, null, null, null, 0.85, null, null, null, null, null,
  0.9, null, null, 0.5, null, null, 0.85, null, null, 0.5, 0.9, null, null, 0.5, 0.6, 0.7
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 3 ? 0.6 : 1;
  snare.triggerAttackRelease("16n", t, v * intensity);
  snareBody.triggerAttackRelease("E3", "16n", t, v * 0.5 * intensity);
}, [
  null, null, null, null, 0.85, null, null, 0.3, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.85, null, null, 0.35, null, null, null, null, 0.9, null, null, 0.4,
  null, null, null, null, 0.9, null, null, 0.3, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.9, null, 0.3, 0.35, null, null, null, null, 0.95, null, 0.45, 0.5,
  null, null, null, null, 0.9, null, null, 0.35, null, null, 0.25, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.35, null, null, null, null, 0.4, 0.95, null, 0.5, 0.6,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.9, 0.5, 0.6, 0.7
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.1 : section === 0 ? 0.7 : 1;
  if (v > 0.75) hatO.triggerAttackRelease("32n", t, v * 0.45 * intensity);
  else hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.45, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.5, 0.35,
  0.55, 0.25, 0.45, 0.3, 0.5, 0.25, 0.5, 0.35, 0.55, 0.25, 0.45, 0.3, 0.55, 0.25, 0.8, 0.4,
  0.52, 0.22, 0.42, 0.28, 0.52, 0.22, 0.48, 0.32, 0.52, 0.22, 0.42, 0.28, 0.52, 0.22, 0.52, 0.38,
  0.58, 0.28, 0.48, 0.32, 0.52, 0.28, 0.52, 0.38, 0.58, 0.28, 0.48, 0.32, 0.58, 0.28, 0.85, 0.42
], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  rim.triggerAttackRelease("32n", t, v);
}, [
  null, null, null, null, null, null, null, 0.5, null, null, null, null, null, null, null, 0.55,
  null, null, null, 0.45, null, null, null, 0.5, null, null, null, null, null, null, 0.55, 0.5,
  null, null, null, null, null, null, null, 0.52, null, null, null, 0.48, null, null, null, 0.55,
  null, null, 0.45, null, null, null, null, 0.52, null, null, null, null, null, 0.5, 0.55, null
], "16n").start(0);

const shakerPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 2) return;
  shaker.triggerAttackRelease("32n", t, v);
}, [
  0.3, 0.2, 0.25, 0.2, 0.3, 0.2, 0.25, 0.22, 0.3, 0.2, 0.25, 0.2, 0.3, 0.22, 0.28, 0.22,
  0.32, 0.22, 0.28, 0.22, 0.32, 0.22, 0.28, 0.25, 0.32, 0.22, 0.28, 0.22, 0.35, 0.25, 0.3, 0.25
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - smooth and round
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(400, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
  filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, baseFrequency: 100, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const intensity = section === 0 ? 0.6 : 1;
  bass.triggerAttackRelease(n, "8n", t, 0.85 * intensity);
}, [
  // Bbmaj9
  "Bb1", null, "Bb1", null, "D2", null, null, null, "Bb1", null, "Bb1", null, "F2", null, null, null,
  "Bb1", null, "Bb1", null, "D2", null, "F2", null, "Bb1", null, "D2", null, "F2", null, "D2", null,
  // Ebmaj9
  "Eb2", null, "Eb2", null, "G2", null, null, null, "Eb2", null, "Eb2", null, "Bb2", null, null, null,
  "Eb2", null, "Eb2", null, "G2", null, "Bb2", null, "Eb2", null, "G2", null, "Bb2", null, "G2", null,
  // Abmaj7
  "Ab1", null, "Ab1", null, "C2", null, null, null, "Ab1", null, "Ab1", null, "Eb2", null, null, null,
  "Ab1", null, "Ab1", null, "C2", null, "Eb2", null, "Ab1", null, "C2", null, "Eb2", null, "C2", null,
  // Gm7
  "G1", null, "G1", null, "Bb1", null, null, null, "G1", null, "G1", null, "D2", null, null, null,
  "G1", null, "G1", null, "Bb1", null, "D2", null, "G1", null, "Bb1", "D2", "G2", "D2", "Bb1", "G1"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Electric Piano - Bbmaj9 / Ebmaj9 / Abmaj7 / Gm7
// ─────────────────────────────────────────────────────────────
const epianoFilter = new Tone.Filter(3000, "lowpass").connect(warmChorus);
const epiano = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.5,
  envelope: { attack: 0.01, decay: 1, sustain: 0.4, release: 1.5 }
}).connect(epianoFilter);
epiano.volume.value = -11;

const epianoLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.8, sustain: 0.3, release: 1 }
}).connect(epianoFilter);
epianoLayer.volume.value = -16;

const chordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.3 : section === 2 ? 0.5 : 0.4;
  epiano.triggerAttackRelease(c, "2n", t, vel);
  // Layer in fuller sections
  if (section >= 1) {
    epianoLayer.triggerAttackRelease(c, "2n", t + 0.02, vel * 0.4);
  }
}, [
  // Bbmaj9
  ["Bb3", "D4", "F4", "A4", "C5"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Bb3", "D4", "A4"], null,
  ["Bb3", "D4", "F4", "A4", "C5"], null, null, null, null, null, null, null, null, null, null, null, ["Bb3", "F4", "C5"], null, null, null,
  // Ebmaj9
  ["Eb3", "G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Eb3", "Bb3", "D4"], null,
  ["Eb3", "G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, ["Eb3", "G3", "F4"], null, null, null,
  // Abmaj7
  ["Ab3", "C4", "Eb4", "G4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Ab3", "Eb4", "G4"], null,
  ["Ab3", "C4", "Eb4", "G4"], null, null, null, null, null, null, null, null, null, null, null, ["Ab3", "C4", "G4"], null, null, null,
  // Gm7
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, ["G3", "D4", "F4"], null, null, null,
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, ["G3", "Bb3", "F4"], null, null, null, ["G3", "D4", "F4", "A4"], null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - melodic fills
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(4000, "lowpass").connect(smoothDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.8 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.52);
}, [
  null, null, null, null, null, null, "D5", "C5", "Bb4", null, null, null, null, null, null, null,
  null, null, null, null, "F5", null, "D5", null, "C5", null, null, null, null, null, null, null,
  null, null, null, null, "Eb5", null, "D5", null, "Bb4", null, "G4", null, null, null, null, null,
  null, null, null, null, null, null, "G5", null, "F5", null, "Eb5", null, null, null, null, null,
  null, null, null, null, null, null, "Eb5", "C5", "Ab4", null, null, null, null, null, null, null,
  null, null, null, null, "G5", null, "Eb5", null, "C5", null, null, null, null, null, null, null,
  null, null, null, null, "D5", null, "Bb4", "G4", "F4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "A4", null, "Bb4", null, "D5", null, "F5", null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - warm atmosphere
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1500, "lowpass").connect(silkyReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 2 }
}).connect(padFilter);
pad.volume.value = -20;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.35 : section === 0 ? 0.15 : 0.25;
  pad.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["Bb4", "D5"], null, null, null, null, null, null, null,
  ["Bb4", "D5", "F5"], null, null, null, null, null, null, null,
  ["Eb4", "G4"], null, null, null, null, null, null, null,
  ["Eb4", "G4", "Bb4"], null, null, null, null, null, null, null,
  ["Ab4", "C5"], null, null, null, null, null, null, null,
  ["Ab4", "C5", "Eb5"], null, null, null, null, null, null, null,
  ["G4", "Bb4"], null, null, null, null, null, null, null,
  ["G4", "Bb4", "D5"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// String Layer - subtle texture
// ─────────────────────────────────────────────────────────────
const stringFilter = new Tone.Filter(2000, "lowpass").connect(silkyReverb);
const strings = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 1, decay: 0.5, sustain: 0.6, release: 1.5 }
}).connect(stringFilter);
strings.volume.value = -26;

const stringPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section < 2) return;
  strings.triggerAttackRelease(c, "1n", t, 0.25);
}, [
  ["D5", "F5"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["G4", "Bb4"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["C5", "Eb5"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["Bb4", "D5"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "4n").start(0);

Tone.Transport.start();`,
};
