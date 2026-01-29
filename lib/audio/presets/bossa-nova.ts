import { Preset } from "./types";

export const bossaNova: Preset = {
  id: "bossa-nova",
  name: "Café Sol",
  genre: "Bossa Nova",
  bpm: 105,
  description: "Brazilian-inspired warmth with gentle guitar and soft percussion",
  tags: ["latin", "brazilian", "warm", "sunny"],
  code: `// ═══════════════════════════════════════════════════════════
// Café Sol - 32-bar Bossa Nova arrangement
// Sections: A(intro) B(build) C(full) D(outro)
// Key: Am7 - D7 - Gmaj7 - Cmaj7 - F#m7b5 - B7 - Em7
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 105;
Tone.Transport.swing = 0.08;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm and intimate
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-4).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 2.5, attack: 0.12, release: 0.35 }).connect(limiter);
const roomReverb = new Tone.Reverb({ decay: 1.8, wet: 0.2 }).connect(masterComp);
const warmDelay = new Tone.FeedbackDelay("8n.", 0.22).connect(roomReverb);
warmDelay.wet.value = 0.15;
const chorus = new Tone.Chorus(1.8, 3, 0.3).connect(warmDelay).start();
const warmFilter = new Tone.Filter(7500, "lowpass").connect(chorus);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Percussion - soft and swaying
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.03, octaves: 3, envelope: { attack: 0.002, decay: 0.25, sustain: 0.01, release: 0.2 }
}).connect(masterComp);
kick.volume.value = -10;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" }, envelope: { attack: 0.005, decay: 0.08, sustain: 0.01, release: 0.06 }
}).connect(roomReverb);
snare.volume.value = -14;

const shaker = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.02 }
}).connect(warmFilter);
shaker.volume.value = -20;

const rim = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 }
}).connect(warmFilter);
rim.volume.value = -16;

const conga = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(roomReverb);
conga.volume.value = -14;

// Bossa nova kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.5 : section === 3 ? 0.55 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
}, [
  0.8, null, null, null, null, null, null, 0.5, null, null, null, null, 0.75, null, null, null,
  0.8, null, null, null, null, null, null, 0.5, null, null, null, null, 0.75, null, null, 0.45,
  0.82, null, null, null, null, null, null, 0.52, null, null, null, null, 0.78, null, null, null,
  0.82, null, null, null, null, null, null, 0.55, null, null, null, null, 0.78, null, 0.45, 0.5,
  0.85, null, null, null, null, null, null, 0.55, null, null, null, null, 0.8, null, null, null,
  0.85, null, null, null, null, null, null, 0.58, null, null, null, null, 0.8, null, 0.48, 0.52,
  0.75, null, null, null, null, null, null, null, null, null, null, null, 0.7, null, null, null,
  0.8, null, null, null, null, null, null, 0.5, null, null, null, null, 0.75, null, 0.5, 0.55
], "16n").start(0);

// Snare on 2 and 4 with ghost notes
const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.55 : 1;
  snare.triggerAttackRelease("16n", t, v * intensity);
}, [
  null, null, null, null, 0.75, null, null, null, null, null, null, null, 0.7, null, null, null,
  null, null, null, null, 0.75, null, null, 0.25, null, null, null, null, 0.7, null, null, 0.28,
  null, null, null, null, 0.78, null, null, null, null, null, null, null, 0.72, null, null, null,
  null, null, null, null, 0.78, null, 0.25, null, null, null, null, null, 0.72, null, 0.3, 0.35,
  null, null, null, null, 0.8, null, null, null, null, null, 0.25, null, 0.75, null, null, null,
  null, null, 0.22, null, 0.8, null, null, 0.28, null, null, null, null, 0.75, null, 0.32, 0.38,
  null, null, null, null, 0.68, null, null, null, null, null, null, null, 0.65, null, null, null,
  null, null, null, null, 0.72, null, null, null, null, null, null, null, 0.7, 0.35, 0.4, 0.48
], "16n").start(0);

// Shaker pattern - Brazilian style
const shakerPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1 : section === 0 ? 0.5 : 0.75;
  shaker.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.4, 0.25, 0.35, 0.55, 0.4, 0.25, 0.35, 0.58, 0.4, 0.25, 0.35, 0.55, 0.4, 0.28, 0.38, 0.6,
  0.42, 0.28, 0.38, 0.58, 0.42, 0.28, 0.38, 0.6, 0.42, 0.28, 0.38, 0.58, 0.42, 0.3, 0.4, 0.62,
  0.45, 0.3, 0.4, 0.6, 0.45, 0.3, 0.4, 0.62, 0.45, 0.3, 0.4, 0.6, 0.45, 0.32, 0.42, 0.65,
  0.48, 0.32, 0.42, 0.62, 0.48, 0.32, 0.42, 0.65, 0.48, 0.32, 0.42, 0.62, 0.48, 0.35, 0.45, 0.68
], "8n").start(0);

// Rim click accents
const rimPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1) return;
  rim.triggerAttackRelease("32n", t, v);
}, [
  null, null, 0.5, null, null, null, null, null, null, null, 0.48, null, null, null, null, null,
  null, null, 0.52, null, null, null, null, null, null, null, 0.5, null, null, null, 0.45, null,
  null, null, 0.55, null, null, null, null, null, null, null, 0.52, null, null, null, null, null,
  null, null, 0.55, null, null, null, null, null, null, null, 0.52, null, null, null, 0.48, null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - characteristic bossa bass line
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(600, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.3 },
  filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.35, baseFrequency: 150, octaves: 1.5 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 0 ? 0.5 : section === 2 ? 0.8 : 0.68;
  bass.triggerAttackRelease(n, "8n", t, vel);
}, [
  // Am7 - D7
  "A1", null, null, null, "E2", null, null, null, "A1", null, "G1", null, null, null, null, null,
  "D2", null, null, null, "A2", null, null, null, "D2", null, "C2", null, null, null, null, null,
  // Gmaj7 - Cmaj7
  "G1", null, null, null, "D2", null, null, null, "G1", null, "F#1", null, null, null, null, null,
  "C2", null, null, null, "G2", null, null, null, "C2", null, "B1", null, null, null, null, null,
  // F#m7b5 - B7
  "F#1", null, null, null, "C2", null, null, null, "F#1", null, "E1", null, null, null, null, null,
  "B1", null, null, null, "F#2", null, null, null, "B1", null, "A1", null, null, null, null, null,
  // Em7 - A7 (turnaround)
  "E1", null, null, null, "B1", null, null, null, "E1", null, "D1", null, null, null, null, null,
  "A1", null, null, null, "E2", null, null, null, "A1", null, "G1", null, "F#1", null, "E1", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Guitar - nylon string voicings
// ─────────────────────────────────────────────────────────────
const guitarFilter = new Tone.Filter(3500, "lowpass").connect(warmDelay);
const guitar = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 1.5, modulationIndex: 0.8,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.008, decay: 0.6, sustain: 0.2, release: 0.8 },
  modulationEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.15, release: 0.5 }
}).connect(guitarFilter);
guitar.volume.value = -10;

// Bossa nova guitar rhythm pattern
const guitarPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.35 : section === 2 ? 0.6 : 0.48;
  guitar.triggerAttackRelease(c, "8n", t, vel);
}, [
  // Am7
  null, null, null, ["A3", "C4", "E4", "G4"], null, null, ["A3", "E4", "G4"], null, null, null, null, ["A3", "C4", "E4"], null, null, ["C4", "G4"], null,
  // D7
  null, null, null, ["D3", "F#3", "A3", "C4"], null, null, ["D3", "A3", "C4"], null, null, null, null, ["D3", "F#3", "A3"], null, null, ["F#3", "C4"], null,
  // Gmaj7
  null, null, null, ["G3", "B3", "D4", "F#4"], null, null, ["G3", "D4", "F#4"], null, null, null, null, ["G3", "B3", "D4"], null, null, ["B3", "F#4"], null,
  // Cmaj7
  null, null, null, ["C3", "E3", "G3", "B3"], null, null, ["C3", "G3", "B3"], null, null, null, null, ["C3", "E3", "G3"], null, null, ["E3", "B3"], null,
  // F#m7b5
  null, null, null, ["F#3", "A3", "C4", "E4"], null, null, ["F#3", "C4", "E4"], null, null, null, null, ["F#3", "A3", "C4"], null, null, ["A3", "E4"], null,
  // B7
  null, null, null, ["B2", "D#3", "F#3", "A3"], null, null, ["B2", "F#3", "A3"], null, null, null, null, ["B2", "D#3", "F#3"], null, null, ["D#3", "A3"], null,
  // Em7
  null, null, null, ["E3", "G3", "B3", "D4"], null, null, ["E3", "B3", "D4"], null, null, null, null, ["E3", "G3", "B3"], null, null, null, null,
  // A7 (turnaround)
  null, null, null, ["A2", "C#3", "E3", "G3"], null, null, ["A2", "E3", "G3"], null, null, null, null, ["A2", "C#3", "E3"], null, null, ["C#3", "G3"], null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - soft background warmth
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(2000, "lowpass").connect(roomReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.5, release: 2 }
}).connect(padFilter);
pad.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.3 : section === 0 ? 0.12 : 0.22;
  pad.triggerAttackRelease(c, "1m", t, vel);
}, [
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G3", "D4"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["F#3", "C4"], null, null, null, null, null, null, null,
  ["B3", "F#4"], null, null, null, null, null, null, null,
  ["E3", "B3"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Flute - melodic embellishments
// ─────────────────────────────────────────────────────────────
const fluteFilter = new Tone.Filter(4500, "lowpass").connect(warmDelay);
const flute = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.08, decay: 0.3, sustain: 0.5, release: 0.5 }
}).connect(fluteFilter);
flute.volume.value = -14;

const flutePat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 2) return;
  flute.triggerAttackRelease(n, "8n", t, 0.5);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G4", "A4",
  "B4", null, null, null, null, null, null, null, "A4", null, "G4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D4", "E4",
  "F#4", null, null, null, null, null, null, null, "E4", null, "D4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "C4", "D4",
  "E4", null, null, null, null, null, null, null, "D#4", null, "C4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "E5", null, "D5", null, "C5", null, "B4", null, "A4", null, "G4", null, null, null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Vibes - bell accents
// ─────────────────────────────────────────────────────────────
const vibesFilter = new Tone.Filter(6000, "lowpass").connect(warmDelay);
const vibes = new Tone.FMSynth({
  harmonicity: 5, modulationIndex: 1.5,
  envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1 }
}).connect(vibesFilter);
vibes.volume.value = -20;

const vibesPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 1) return;
  vibes.triggerAttackRelease(n, "8n", t, 0.35);
}, [
  "E5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "A5", null, null, null,
  "D5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "G5", null, null, null,
  "C5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "F#5", null, null, null,
  "B4", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, "E5", null, null, null, null, null, null, null
], "4n").start(0);

Tone.Transport.start();`,
};
