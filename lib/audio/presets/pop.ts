import { Preset } from './types';

export const pop: Preset = {
  id: 'pop',
  name: 'Sunlight',
  genre: 'Pop',
  bpm: 118,
  description: 'Radio-ready pop with acoustic guitar, bright piano, and polished drums',
  code: `// ═══════════════════════════════════════════════════════════
// Sunlight - 32-bar Pop Production
// Sections: A(intro) B(verse) C(chorus) D(bridge)
// Key: C major (C - Am - F - G)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 118;
Tone.Transport.swing = 0.03;

// ─────────────────────────────────────────────────────────────
// Master Chain - bright, polished, and radio-ready
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1.5).toDestination();
const masterComp = new Tone.Compressor({ threshold: -16, ratio: 4, attack: 0.02, release: 0.2 }).connect(limiter);
const popReverb = new Tone.Reverb({ decay: 2.2, wet: 0.2 }).connect(masterComp);
const stereoDelay = new Tone.PingPongDelay("8n", 0.25).connect(popReverb);
stereoDelay.wet.value = 0.15;
const brightChorus = new Tone.Chorus(3, 4, 0.4).connect(stereoDelay).start();
const brightFilter = new Tone.Filter(8000, "lowpass").connect(brightChorus);
const highShelf = new Tone.Filter(4000, "highshelf").connect(brightFilter);
highShelf.gain.value = 3;

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - clean, punchy, live feel
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.03, octaves: 5, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.25 }
}).connect(masterComp);
kick.volume.value = -4;

const kickClick = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.012, sustain: 0, release: 0.01 }
}).connect(masterComp);
kickClick.volume.value = -18;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 }
}).connect(popReverb);
snare.volume.value = -8;

const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
}).connect(popReverb);
snareBody.volume.value = -14;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(popReverb);
clap.volume.value = -12;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.03 }, harmonicity: 5.1, resonance: 4500, octaves: 1
}).connect(brightFilter);
hat.volume.value = -18;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.1 }, harmonicity: 5.1, resonance: 4000, octaves: 1
}).connect(brightFilter);
hatO.volume.value = -20;

const tom = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 }
}).connect(popReverb);
tom.volume.value = -10;

const shaker = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 }
}).connect(brightFilter);
shaker.volume.value = -22;

// Live feel kick pattern with ghost notes
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.6) return;
  // Ghost note
  if (Math.random() > 0.95) kick.triggerAttackRelease("C1", "32n", t - 0.02, v * 0.2);
  const humanize = (Math.random() - 0.5) * 0.006;
  kick.triggerAttackRelease("C1", "8n", t + humanize, v);
  kickClick.triggerAttackRelease("32n", t + humanize, v * 0.3);
}, [
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.5,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, 0.4, 1, null, null, null, 1, null, 0.5, 0.6,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, 0.45, 1, null, 0.55, 0.65,
  0.85, null, null, null, 0.8, null, null, null, 0.85, null, null, null, 0.8, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, 0.55, 0.65, 0.75
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3 && Math.random() > 0.6) return;
  const humanize = (Math.random() - 0.5) * 0.006;
  snare.triggerAttackRelease("16n", t + humanize, v);
  snareBody.triggerAttackRelease("E3", "16n", t + humanize, v * 0.4);
  // Layer clap in chorus
  if (section === 2) clap.triggerAttackRelease("16n", t + humanize + 0.01, v * 0.6);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.4,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.35, null, null, null, null, 1, null, 0.45, 0.55,
  null, null, null, null, 1, null, null, null, null, null, 0.3, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.35, null, null, null, null, 0.4, 1, null, 0.5, 0.6,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.5, 0.6, 0.75
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.15 : section === 0 ? 0.65 : 1;
  if (section === 0 && Math.random() > 0.7) return;
  const humanize = (Math.random() - 0.5) * 0.005;
  if (v > 0.8) hatO.triggerAttackRelease("32n", t + humanize, v * 0.5 * intensity);
  else hat.triggerAttackRelease("32n", t + humanize, v * intensity);
}, [
  0.5, 0.9, 0.5, 0.6, 0.5, 0.9, 0.5, 0.7, 0.5, 0.9, 0.5, 0.6, 0.5, 0.9, 0.5, 0.7,
  0.55, 0.92, 0.52, 0.62, 0.52, 0.9, 0.52, 0.72, 0.52, 0.9, 0.52, 0.62, 0.55, 0.92, 0.55, 0.75,
  0.52, 0.9, 0.52, 0.62, 0.52, 0.92, 0.52, 0.72, 0.52, 0.92, 0.52, 0.65, 0.52, 0.9, 0.55, 0.72,
  0.55, 0.92, 0.55, 0.65, 0.55, 0.92, 0.55, 0.75, 0.55, 0.92, 0.55, 0.68, 0.58, 0.95, 0.6, 0.78
], "8n").start(0);

const shakerPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1) return;
  if (Math.random() > 0.9) return;
  shaker.triggerAttackRelease("32n", t, v);
}, [
  0.3, 0.2, 0.25, 0.2, 0.3, 0.2, 0.25, 0.22, 0.3, 0.2, 0.25, 0.2, 0.3, 0.22, 0.28, 0.22,
  0.32, 0.22, 0.28, 0.22, 0.32, 0.22, 0.28, 0.25, 0.32, 0.22, 0.28, 0.22, 0.35, 0.25, 0.3, 0.25
], "16n").start(0);

const tomPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section !== 2) return;
  tom.triggerAttackRelease(n, "8n", t, 0.7);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "G3", "E3", "C3", "G2"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - clean and supportive
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(600, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.3 },
  filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.4, baseFrequency: 150, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.5) return;
  const humanize = (Math.random() - 0.5) * 0.008;
  const vel = 0.8 + Math.random() * 0.15;
  bass.triggerAttackRelease(n, "8n", t + humanize, vel);
}, [
  // C
  "C2", null, "C2", null, "C2", null, null, null, "C2", null, "C2", null, "E2", null, null, null,
  "C2", null, "C2", null, "G2", null, null, null, "C2", null, "E2", null, "G2", null, "E2", null,
  // Am
  "A1", null, "A1", null, "A1", null, null, null, "A1", null, "A1", null, "C2", null, null, null,
  "A1", null, "A1", null, "E2", null, null, null, "A1", null, "C2", null, "E2", null, "C2", null,
  // F
  "F1", null, "F1", null, "F1", null, null, null, "F1", null, "F1", null, "A1", null, null, null,
  "F1", null, "F1", null, "C2", null, null, null, "F1", null, "A1", null, "C2", null, "A1", null,
  // G
  "G1", null, "G1", null, "G1", null, null, null, "G1", null, "G1", null, "B1", null, null, null,
  "G1", null, "G1", null, "D2", null, null, null, "G1", null, "B1", null, "D2", "B1", "G1", "D2"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Piano - bright and rhythmic
// ─────────────────────────────────────────────────────────────
const pianoFilter = new Tone.Filter(5000, "lowpass").connect(brightChorus);
const piano = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 0.6, sustain: 0.3, release: 0.8 }
}).connect(pianoFilter);
piano.volume.value = -12;

const pianoPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.35 : section === 2 ? 0.55 : 0.45;
  const humanize = (Math.random() - 0.5) * 0.008;
  piano.triggerAttackRelease(c, "4n", t + humanize, vel);
}, [
  // C
  ["C4", "E4", "G4"], null, null, null, null, null, ["E4", "G4"], null, null, null, null, null, ["C4", "E4", "G4"], null, null, null,
  null, null, null, null, ["C4", "G4"], null, null, null, null, null, null, null, ["E4", "G4", "C5"], null, null, null,
  // Am
  ["A3", "C4", "E4"], null, null, null, null, null, ["C4", "E4"], null, null, null, null, null, ["A3", "C4", "E4"], null, null, null,
  null, null, null, null, ["A3", "E4"], null, null, null, null, null, null, null, ["C4", "E4", "A4"], null, null, null,
  // F
  ["F3", "A3", "C4"], null, null, null, null, null, ["A3", "C4"], null, null, null, null, null, ["F3", "A3", "C4"], null, null, null,
  null, null, null, null, ["F3", "C4"], null, null, null, null, null, null, null, ["A3", "C4", "F4"], null, null, null,
  // G
  ["G3", "B3", "D4"], null, null, null, null, null, ["B3", "D4"], null, null, null, null, null, ["G3", "B3", "D4"], null, null, null,
  null, null, null, null, ["G3", "D4"], null, null, null, null, null, null, null, ["B3", "D4", "G4"], null, ["G3", "B3", "D4", "G4"], null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Acoustic Guitar Simulation - strummed chords
// ─────────────────────────────────────────────────────────────
const guitarFilter = new Tone.Filter(4000, "lowpass").connect(stereoDelay);
const guitar = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 1.2, sustain: 0.2, release: 1.5 }
}).connect(guitarFilter);
guitar.volume.value = -14;

// Strum simulation with slight delays
const strumChord = (chord, time, vel) => {
  chord.forEach((note, i) => {
    guitar.triggerAttackRelease(note, "2n", time + i * 0.012, vel * (0.9 + Math.random() * 0.1));
  });
};

const guitarPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.5 : 0.4;
  strumChord(c, t, vel);
}, [
  // C
  null, null, null, null, null, null, null, null, ["C3", "E3", "G3", "C4", "E4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, ["C3", "G3", "C4", "E4"], null, null, null,
  // Am
  null, null, null, null, null, null, null, null, ["A2", "E3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, ["A2", "E3", "A3", "E4"], null, null, null,
  // F
  null, null, null, null, null, null, null, null, ["F2", "C3", "F3", "A3", "C4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, ["F2", "A2", "C3", "F3"], null, null, null,
  // G
  null, null, null, null, null, null, null, null, ["G2", "B2", "D3", "G3", "B3"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, ["G2", "D3", "G3", "B3", "D4"], null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Synth Pad - warm support
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(2500, "lowpass").connect(popReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1, decay: 0.8, sustain: 0.6, release: 1.5 }
}).connect(padFilter);
pad.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.4 : section === 0 ? 0.15 : 0.28;
  pad.triggerAttackRelease(c, "1n", t, vel);
}, [
  ["C4", "E4", "G4"], null, null, null, null, null, null, null,
  ["C4", "E4", "G4"], null, null, null, null, null, null, null,
  ["A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["G3", "B3", "D4"], null, null, null, null, null, null, null,
  ["G3", "B3", "D4"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead Melody - catchy hook
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(5000, "lowpass").connect(stereoDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 0.5 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  const vel = 0.5 + Math.random() * 0.15;
  lead.triggerAttackRelease(n, "8n", t, vel);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G4", "E4",
  "C5", null, null, null, null, null, null, null, null, null, null, null, "G4", null, "E4", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "E4", "C4",
  "A4", null, null, null, null, null, null, null, null, null, null, null, "E4", null, "C4", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "C4", "A3",
  "F4", null, null, null, null, null, null, null, null, null, null, null, "C4", null, "A3", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D4", "B3",
  "G4", null, null, null, "D4", null, "G4", null, "B4", null, "D5", null, "G5", null, null, null
], "8n").start(0);

Tone.Transport.start();`
};
