/**
 * Demo song presets for different genres
 * Each preset is a 32-bar arrangement with sections A/B/C/D
 * Features: humanized velocity, section variation, master processing
 */

export interface Preset {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  description: string;
  code: string;
}

export const PRESETS: Preset[] = [
  {
    id: 'lofi-chill',
    name: 'Midnight Lofi',
    genre: 'Lofi Hip-Hop',
    bpm: 82,
    description: 'Chill jazzy beats with Rhodes and vinyl warmth',
    code: `// ═══════════════════════════════════════════════════════════
// Midnight Lofi - 32-bar arrangement with variation
// Sections: A(intro) B(build) C(full) D(breakdown)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm and compressed
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.1, release: 0.25 }).connect(limiter);
const masterLowpass = new Tone.Filter(8000, "lowpass").connect(masterComp);
const masterReverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(masterLowpass);
const tapeDelay = new Tone.FeedbackDelay("8n.", 0.32).connect(masterReverb);
tapeDelay.wet.value = 0.2;
const chorus = new Tone.Chorus(2.5, 3.5, 0.5).connect(tapeDelay).start();
const vinylFilter = new Tone.Filter(2500, "lowpass").connect(masterLowpass);

// ─────────────────────────────────────────────────────────────
// Drums - warm and punchy
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
}).connect(masterComp);
kick.volume.value = -4;

const snare = new Tone.NoiseSynth({
  noise: { type: "brown" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.15 }
}).connect(masterReverb);
snare.volume.value = -8;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).connect(masterReverb);
clap.volume.value = -12;

const hihatClosed = new Tone.MetalSynth({
  frequency: 250, envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
  harmonicity: 3.5, modulationIndex: 20, resonance: 1800, octaves: 1
}).connect(vinylFilter);
hihatClosed.volume.value = -22;

const hihatOpen = new Tone.MetalSynth({
  frequency: 220, envelope: { attack: 0.001, decay: 0.15, release: 0.08 },
  harmonicity: 3.5, modulationIndex: 18, resonance: 1500, octaves: 1
}).connect(vinylFilter);
hihatOpen.volume.value = -24;

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// 32-bar kick pattern with variation per section
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.7) return;
  if (section === 3 && Math.random() > 0.5) return;
  if (Math.random() > 0.92) kick.triggerAttackRelease("C1", "16n", t, v * 0.3);
  kick.triggerAttackRelease("C1", "8n", t, v);
}, [
  0.9, null, null, 0.4, 0.85, null, 0.3, null, 0.9, null, null, 0.5, 0.8, null, 0.35, null,
  0.9, null, null, 0.4, 0.85, null, null, 0.4, 0.9, null, null, 0.5, 0.85, null, 0.3, 0.5,
  0.95, null, null, 0.5, 0.9, null, 0.4, null, 0.9, null, 0.3, 0.5, 0.85, null, 0.4, null,
  0.95, null, null, 0.5, 0.9, null, 0.35, 0.4, 0.9, null, null, 0.5, 0.9, null, 0.4, 0.55,
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, null, 0.95, null, 0.3, 0.55, 0.9, null, 0.45, null,
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, 0.35, 0.95, null, 0.3, 0.5, 0.9, 0.4, 0.45, 0.5,
  0.85, null, null, null, 0.8, null, null, null, 0.85, null, null, null, 0.8, null, null, null,
  0.9, null, null, 0.4, 0.85, null, null, null, 0.9, null, null, 0.5, 0.85, null, 0.4, 0.6
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.8) return;
  if (section === 2 && Math.random() > 0.7) clap.triggerAttackRelease("16n", t, v * 0.5);
  snare.triggerAttackRelease("16n", t, v);
}, [
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.4,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.9, null, null, 0.3, null, null, null, null, 0.9, null, 0.4, 0.5,
  null, null, null, null, 0.95, null, null, null, null, null, 0.3, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.3, null, null, null, null, 0.4, 0.9, null, 0.5, 0.6,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.9, 0.5, 0.6, 0.7
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.7 : 1;
  if (v > 0.7 || (Math.random() > 0.93)) {
    hihatOpen.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  } else {
    hihatClosed.triggerAttackRelease("32n", t, v * intensity);
  }
}, [
  0.5, 0.2, 0.4, 0.25, 0.45, 0.2, 0.75, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.7, 0.35,
  0.5, 0.25, 0.4, 0.2, 0.5, 0.2, 0.4, 0.3, 0.55, 0.2, 0.45, 0.25, 0.5, 0.25, 0.8, 0.3,
  0.55, 0.25, 0.45, 0.3, 0.5, 0.25, 0.75, 0.35, 0.55, 0.25, 0.5, 0.3, 0.55, 0.25, 0.7, 0.4,
  0.6, 0.3, 0.5, 0.3, 0.55, 0.3, 0.8, 0.35, 0.6, 0.3, 0.5, 0.35, 0.55, 0.3, 0.85, 0.4,
  0.6, 0.3, 0.5, 0.35, 0.55, 0.3, 0.8, 0.4, 0.6, 0.35, 0.55, 0.35, 0.6, 0.3, 0.85, 0.45,
  0.65, 0.35, 0.55, 0.4, 0.6, 0.35, 0.85, 0.4, 0.65, 0.35, 0.55, 0.4, 0.6, 0.4, 0.9, 0.5,
  0.4, 0.2, 0.35, 0.2, 0.4, 0.15, 0.6, 0.25, 0.4, 0.2, 0.35, 0.2, 0.4, 0.2, 0.5, 0.25,
  0.5, 0.25, 0.4, 0.25, 0.5, 0.2, 0.7, 0.3, 0.55, 0.25, 0.45, 0.3, 0.5, 0.3, 0.8, 0.4
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - 32-bar pattern following chord changes
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(600, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
  filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 2 }
}).connect(bassFilter);
bass.volume.value = -6;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.6) return;
  const note = (Math.random() > 0.95) ? n.replace("2", "3") : n;
  bass.triggerAttackRelease(note, "8n", t, 0.85);
}, [
  "D2", null, "D2", "D2", null, null, "F2", null, "D2", null, "D2", "A1", null, null, "D2", null,
  "G2", null, "G2", "G2", null, null, "B1", null, "G2", null, "G2", "D2", null, null, "G2", null,
  "C2", null, "C2", "E2", null, null, "G2", null, "C2", null, "C2", "G1", null, null, "C2", null,
  "A1", null, "A1", "C2", null, null, "E2", null, "A1", null, "A1", "E2", null, null, "A2", null,
  "F2", null, "F2", "A2", null, null, "C2", null, "F2", null, "F2", "C2", null, null, "F2", null,
  "E2", null, "E2", "G2", null, null, "B1", null, "E2", null, "E2", "B1", null, null, "E2", null,
  "D2", null, "D2", "F2", null, null, "A1", null, "D2", null, null, null, null, null, "D2", null,
  "G2", null, "G2", "B1", null, null, "D2", null, "G2", null, "G2", "D2", null, "G2", "A2", "B2"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes Chords - 8 different chords over 32 bars
// ─────────────────────────────────────────────────────────────
const rhodesFilter = new Tone.Filter(2000, "lowpass").connect(chorus);
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.5,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 1, sustain: 0.3, release: 1.5 },
  modulation: { type: "triangle" },
  modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.6 }
}).connect(rhodesFilter);
rhodes.volume.value = -11;

const chordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.35 : section === 2 ? 0.6 : 0.5;
  rhodes.triggerAttackRelease(c, "1n", t, vel);
}, [
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["D3", "F3", "A3"], null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G2", "B2", "D3"], null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["C3", "E3", "G3"], null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["A2", "E3", "G3"], null,
  ["F2", "A2", "C3", "E3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["F2", "A2", "C3"], null,
  ["E2", "G2", "B2", "D3"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["E2", "B2", "D3"], null,
  ["D2", "F2", "A2", "C3"], null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null, null, null, null, null, ["G2", "B2", "F3"], null, null, null, ["G2", "D3", "F3"], null, ["G2", "B2", "D3", "F3", "A3"], null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - follows chords with 32-bar variation
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(2500, "lowpass").connect(tapeDelay);
const arp = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
}).connect(arpFilter);
arp.volume.value = -13;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  if (section === 3 && Math.random() > 0.5) return;
  const vel = section === 2 ? 0.7 : 0.55;
  arp.triggerAttackRelease(n, "16n", t, vel);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4", "D4", "F4", "A4", "C5", "A4", "F4", "A4", "C5",
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4", "G4", "B4", "D5", "F5", "D5", "B4", "D5", "F5",
  "C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4", "C4", "E4", "G4", "B4", "C5", "B4", "G4", "B4",
  "A3", "C4", "E4", "G4", "A4", "G4", "E4", "C4", "A3", "C4", "E4", "G4", "A4", "G4", "E4", "G4",
  "F4", "A4", "C5", "E5", "C5", "A4", null, null, "F4", "A4", "C5", null, null, null, null, null,
  "G4", "B4", "D5", null, "D5", null, "G4", null, "G4", "B4", "D5", "F5", "D5", "B4", "G4", "D5"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - Atmospheric swells following sections
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1200, "lowpass").connect(masterReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.8, release: 2.5 }
}).connect(padFilter);
pad.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.4 : section === 0 || section === 3 ? 0.2 : 0.3;
  pad.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["F4", "C5"], null, null, null, null, null, null, null,
  ["E4", "B4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, ["G4", "B4", "D5"], null, null, null
], "2n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'deep-house',
    name: 'Sunset Drive',
    genre: 'Deep House',
    bpm: 122,
    description: 'Groovy four-on-floor with warm pads and funky bass',
    code: `// ═══════════════════════════════════════════════════════════
// Sunset Drive - 32-bar Deep House arrangement
// Sections: A(intro) B(build) C(drop) D(breakdown)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 122;

// ─────────────────────────────────────────────────────────────
// Master Chain
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.02, release: 0.2 }).connect(limiter);
const masterReverb = new Tone.Reverb({ decay: 2.8, wet: 0.22 }).connect(masterComp);
const pingPong = new Tone.PingPongDelay("8n", 0.28).connect(masterReverb);
pingPong.wet.value = 0.18;
const warmFilter = new Tone.Filter(6000, "lowpass").connect(pingPong);

const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 }
}).connect(masterComp);
kick.volume.value = -4;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 }
}).connect(masterReverb);
clap.volume.value = -10;

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

// Four-on-floor with section variation
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.6) return;
  if (section === 3 && Math.random() > 0.4) return;
  kick.triggerAttackRelease("C1", "8n", t, v);
}, [
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
  0.55, 0.9, 0.5, 0.65, 0.5, 0.85, 0.55, 0.7, 0.5, 0.9, 0.55, 0.6, 0.5, 0.9, 0.6, 0.75
], "8n").start(0);

const percPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 2) return;
  perc.triggerAttackRelease(n, "16n", t, 0.6);
}, [
  null, null, null, "G3", null, null, null, null, null, null, null, "G3", null, null, null, null,
  null, null, null, "G3", null, null, null, "A3", null, null, null, "G3", null, null, "A3", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - Fm - Bbm - Eb - Ab progression
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
  if (section === 3 && Math.random() > 0.5) return;
  const vel = section === 2 ? 0.9 : 0.75;
  bass.triggerAttackRelease(n, "16n", t, vel);
}, [
  "F1", null, "F2", "F1", null, "Ab1", null, null, "F1", null, "F2", "F1", null, "Ab1", null, "F1",
  "Bb1", null, "Bb2", "Bb1", null, "Db2", null, null, "Bb1", null, "Bb2", "Bb1", null, "Db2", null, "Bb1",
  "Eb1", null, "Eb2", "Eb1", null, "G1", null, null, "Eb1", null, "Eb2", "Eb1", null, "G1", null, "Eb1",
  "Ab1", null, "Ab2", "Ab1", null, "C2", null, null, "Ab1", null, "Ab2", "Ab1", null, "C2", "Eb2", "Ab1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Chords and Pads
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

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.25 : section === 2 ? 0.45 : 0.35;
  pad.triggerAttackRelease(c, "1n", t, vel);
}, [
  ["F3", "Ab3", "C4"], null, null, null, null, null, null, null,
  ["Bb3", "Db4", "F4"], null, null, null, null, null, null, null,
  ["Eb3", "G3", "Bb3"], null, null, null, null, null, null, null,
  ["Ab3", "C4", "Eb4"], null, null, null, null, null, null, null
], "2n").start(0);

const stabPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  stab.triggerAttackRelease(c, "16n", t, 0.6);
}, [
  null, null, null, ["F4", "Ab4", "C5"], null, null, null, null, null, null, null, ["F4", "Ab4"], null, null, null, null,
  null, null, null, ["Bb4", "Db5", "F5"], null, null, null, null, null, null, null, ["Bb4", "Db5"], null, null, null, null,
  null, null, null, ["Eb4", "G4", "Bb4"], null, null, null, null, null, null, null, ["Eb4", "G4"], null, null, null, null,
  null, null, null, ["Ab4", "C5", "Eb5"], null, null, null, null, null, null, null, ["Ab4", "C5"], null, null, null, null
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
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "F5", "Db5",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Bb4", "G4",
  null, null, null, null, null, null, null, null, "Eb5", null, "C5", null, "Ab4", null, null, null
], "8n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'dark-techno',
    name: 'Warehouse',
    genre: 'Techno',
    bpm: 132,
    description: 'Hypnotic dark techno with industrial textures',
    code: `// ═══════════════════════════════════════════════════════════
// Warehouse - 32-bar Dark Techno
// Sections: A(intro) B(build) C(peak) D(breakdown)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 132;

// ─────────────────────────────────────────────────────────────
// Master Chain
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const distortion = new Tone.Distortion(0.2).connect(limiter);
const masterComp = new Tone.Compressor({ threshold: -15, ratio: 5, attack: 0.01, release: 0.15 }).connect(distortion);
const darkReverb = new Tone.Reverb({ decay: 4.5, wet: 0.18 }).connect(masterComp);
const industrialDelay = new Tone.FeedbackDelay("8n.", 0.38).connect(darkReverb);
industrialDelay.wet.value = 0.15;
const darkFilter = new Tone.Filter(3000, "lowpass").connect(industrialDelay);

const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - Industrial punch
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 8, envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.2 }
}).connect(masterComp);
kick.volume.value = -3;

const kickLayer = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 }
}).connect(masterComp);
kickLayer.volume.value = -18;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(darkReverb);
clap.volume.value = -12;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1
}).connect(darkFilter);
hat.volume.value = -20;

const ride = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 8, modulationIndex: 20, resonance: 6000, octaves: 1
}).connect(darkFilter);
ride.volume.value = -22;

// 32-bar kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3 && Math.random() > 0.3) return;
  kick.triggerAttackRelease("C0", "16n", t, v);
  kickLayer.triggerAttackRelease("32n", t, v * 0.5);
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
  clap.triggerAttackRelease("16n", t, v);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.4, null, null, null, null, 1, null, 0.5, 0.6
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.7 : 1;
  hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4, 0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.5,
  0.75, 0.35, 0.55, 0.35, 0.7, 0.35, 0.55, 0.45, 0.7, 0.35, 0.5, 0.4, 0.75, 0.35, 0.65, 0.55
], "16n").start(0);

const ridePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 2) return;
  ride.triggerAttackRelease("32n", t, v);
}, [
  null, 0.4, null, null, null, 0.45, null, null, null, 0.4, null, null, null, 0.5, null, null,
  null, 0.45, null, null, null, 0.5, null, null, null, 0.45, null, null, null, 0.55, null, 0.4
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Acid Bass - Am key
// ─────────────────────────────────────────────────────────────
const acidFilter = new Tone.Filter(1500, "lowpass").connect(darkFilter);
acidFilter.Q.value = 8;
const acidBass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0.2, release: 0.1 },
  filterEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.1, baseFrequency: 150, octaves: 4 }
}).connect(acidFilter);
acidBass.volume.value = -9;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 3 && Math.random() > 0.4) return;
  acidBass.triggerAttackRelease(n, "16n", t);
}, [
  "A1", null, "A1", "A2", null, "A1", null, "G1", "A1", null, "A1", "C2", null, "A1", null, "E1",
  "A1", null, "A1", "A2", null, "A1", "G1", "A1", "A1", null, "C2", "A1", null, "A1", "E1", "G1",
  "A1", null, "A1", "A2", null, "A1", null, "G1", "A1", null, "A1", "C2", null, "A1", null, "E1",
  "A1", "A2", "A1", null, "G1", "A1", null, "E1", "A1", null, "A2", "G1", "A1", null, "E1", "A1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Dark Pad
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
  ["F2", "A2", "C3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Stab Synth
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
  null, null, null, "A4", null, null, "C5", null, null, "A4", null, null, "G4", null, "E4", null
], "16n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'ambient-chill',
    name: 'Floating',
    genre: 'Ambient',
    bpm: 70,
    description: 'Ethereal soundscapes with gentle pulses',
    code: `// ═══════════════════════════════════════════════════════════
// Floating - 32-bar Ambient Soundscape
// Sections: A(sparse) B(build) C(full) D(fade)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 70;

// ─────────────────────────────────────────────────────────────
// Master Chain - lots of space
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-4).toDestination();
const masterComp = new Tone.Compressor({ threshold: -24, ratio: 2, attack: 0.3, release: 0.5 }).connect(limiter);
const hugeReverb = new Tone.Reverb({ decay: 10, wet: 0.55 }).connect(masterComp);
const shimmerDelay = new Tone.FeedbackDelay("4n.", 0.55).connect(hugeReverb);
shimmerDelay.wet.value = 0.4;
const dreamChorus = new Tone.Chorus(0.5, 5, 0.5).connect(shimmerDelay).start();
const warmFilter = new Tone.Filter(4000, "lowpass").connect(dreamChorus);

const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Soft Pulse
// ─────────────────────────────────────────────────────────────
const pulseFilter = new Tone.Filter(2000, "lowpass").connect(warmFilter);
const pulse = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 2 }
}).connect(pulseFilter);
pulse.volume.value = -16;

const pulsePat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 2 ? 0.5 : section === 0 ? 0.25 : 0.4;
  if (section === 0 && Math.random() > 0.5) return;
  pulse.triggerAttackRelease(n, "2n", t, vel);
}, [
  "C4", null, null, null, "E4", null, null, null, "G4", null, null, null, "B3", null, null, null,
  "F4", null, null, null, "A4", null, null, null, "C5", null, null, null, "E4", null, null, null,
  "A3", null, null, null, "C4", null, null, null, "E4", null, null, null, "G4", null, null, null,
  "G3", null, null, null, "B3", null, null, null, "D4", null, null, null, "F#4", null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Warm Pad - Cmaj7 / Fmaj7 / Am7 / Gmaj7
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1500, "lowpass").connect(hugeReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 3, decay: 2, sustain: 0.8, release: 5 }
}).connect(padFilter);
pad.volume.value = -18;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.35 : section === 0 ? 0.15 : 0.25;
  pad.triggerAttackRelease(c, "1m", t, vel);
}, [
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Sub Bass
// ─────────────────────────────────────────────────────────────
const sub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 1, decay: 2, sustain: 0.5, release: 3 }
}).connect(masterComp);
sub.volume.value = -12;

const subPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.6 : 0.45;
  sub.triggerAttackRelease(n, "1m", t, vel);
}, [
  "C1", null, null, null, null, null, null, null,
  "F1", null, null, null, null, null, null, null,
  "A0", null, null, null, null, null, null, null,
  "G1", null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// High Shimmer
// ─────────────────────────────────────────────────────────────
const shimmerFilter = new Tone.Filter(6000, "lowpass").connect(shimmerDelay);
const shimmer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 2, sustain: 0, release: 3 }
}).connect(shimmerFilter);
shimmer.volume.value = -22;

const shimmerPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  if (Math.random() > 0.7) return;
  shimmer.triggerAttackRelease(n, "8n", t, 0.3);
}, [
  null, null, "G5", null, null, null, null, null, null, null, null, null, "C6", null, null, null,
  null, null, null, "E5", null, null, null, null, null, null, "A5", null, null, null, null, null,
  null, null, null, null, null, null, null, "E5", null, null, null, null, null, null, "G5", null,
  null, null, null, null, null, null, "B5", null, null, null, null, null, "D5", null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bell
// ─────────────────────────────────────────────────────────────
const bellFilter = new Tone.Filter(5000, "lowpass").connect(shimmerDelay);
const bell = new Tone.FMSynth({
  harmonicity: 8, modulationIndex: 2,
  envelope: { attack: 0.01, decay: 3, sustain: 0, release: 2 }
}).connect(bellFilter);
bell.volume.value = -20;

const bellPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 3) return;
  if (Math.random() > 0.8) return;
  const vel = section === 2 ? 0.35 : 0.25;
  bell.triggerAttackRelease(n, "8n", t, vel);
}, [
  "C6", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, "A5", null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "E5", null, null, null,
  "G5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Texture - noise swell
// ─────────────────────────────────────────────────────────────
const textureFilter = new Tone.Filter(800, "lowpass").connect(hugeReverb);
const texture = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 3, decay: 2, sustain: 0.3, release: 4 }
}).connect(textureFilter);
texture.volume.value = -28;

const texturePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section !== 2) return;
  texture.triggerAttackRelease("2m", t, v);
}, [
  0.3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'rnb-soul',
    name: 'Velvet',
    genre: 'R&B / Neo-Soul',
    bpm: 75,
    description: 'Smooth R&B with silky chords and laid-back groove',
    code: `// ═══════════════════════════════════════════════════════════
// Velvet - 32-bar R&B / Neo-Soul
// Sections: A(intro) B(verse) C(chorus) D(outro)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 75;
Tone.Transport.swing = 0.1;

// ─────────────────────────────────────────────────────────────
// Master Chain
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-3).toDestination();
const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.08, release: 0.25 }).connect(limiter);
const silkyReverb = new Tone.Reverb({ decay: 2.5, wet: 0.22 }).connect(masterComp);
const smoothDelay = new Tone.FeedbackDelay("8n", 0.28).connect(silkyReverb);
smoothDelay.wet.value = 0.15;
const warmChorus = new Tone.Chorus(2, 3.5, 0.3).connect(smoothDelay).start();
const velvetFilter = new Tone.Filter(6000, "lowpass").connect(warmChorus);

const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - soft and bouncy
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.1, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 }
}).connect(masterComp);
kick.volume.value = -6;

const snare = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.15 }
}).connect(silkyReverb);
snare.volume.value = -10;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.04 }, harmonicity: 5.1, resonance: 3000, octaves: 1
}).connect(velvetFilter);
hat.volume.value = -20;

const rim = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 }
}).connect(velvetFilter);
rim.volume.value = -16;

const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.7) return;
  kick.triggerAttackRelease("C1", "8n", t, v);
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
  if (section === 3 && Math.random() > 0.6) return;
  snare.triggerAttackRelease("16n", t, v);
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
  hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.45, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.5, 0.35,
  0.55, 0.25, 0.45, 0.3, 0.5, 0.25, 0.5, 0.35, 0.55, 0.25, 0.45, 0.3, 0.55, 0.25, 0.55, 0.4
], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  rim.triggerAttackRelease("32n", t, v);
}, [
  null, null, null, null, null, null, null, 0.5, null, null, null, null, null, null, null, 0.55,
  null, null, null, 0.45, null, null, null, 0.5, null, null, null, null, null, null, 0.55, 0.5
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
  if (section === 0 && Math.random() > 0.6) return;
  bass.triggerAttackRelease(n, "8n", t, 0.85);
}, [
  "Bb1", null, "Bb1", null, "D2", null, null, null, "Bb1", null, "Bb1", null, "F2", null, null, null,
  "Eb2", null, "Eb2", null, "G2", null, null, null, "Eb2", null, "Eb2", null, "Bb2", null, null, null,
  "Ab1", null, "Ab1", null, "C2", null, null, null, "Ab1", null, "Ab1", null, "Eb2", null, null, null,
  "G1", null, "G1", null, "Bb1", null, null, null, "G1", null, "G1", null, "D2", null, "F2", null,
  "Bb1", null, "Bb1", null, "D2", null, "F2", null, "Bb1", null, "D2", null, "F2", null, null, null,
  "Eb2", null, "Eb2", null, "G2", null, "Bb2", null, "Eb2", null, "G2", null, "Bb2", null, "G2", null,
  "Ab1", null, "Ab1", null, "C2", null, null, null, "Ab1", null, null, null, "Eb2", null, null, null,
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

const chordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.3 : section === 2 ? 0.5 : 0.4;
  epiano.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["Bb3", "D4", "F4", "A4", "C5"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Bb3", "D4", "A4"], null,
  ["Eb3", "G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Eb3", "Bb3", "D4"], null,
  ["Ab3", "C4", "Eb4", "G4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Ab3", "Eb4", "G4"], null,
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, ["G3", "D4", "F4"], null, ["G3", "Bb3", "D4", "F4", "A4"], null
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
  lead.triggerAttackRelease(n, "8n", t, 0.5);
}, [
  null, null, null, null, null, null, "D5", "C5", "Bb4", null, null, null, null, null, null, null,
  null, null, null, null, "Eb5", null, "D5", null, "Bb4", null, "G4", null, null, null, null, null,
  null, null, null, null, null, null, "Eb5", "C5", "Ab4", null, null, null, null, null, null, null,
  null, null, null, null, "D5", null, "Bb4", "G4", "F4", null, null, null, null, null, null, null
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
  ["Eb4", "G4"], null, null, null, null, null, null, null,
  ["Ab4", "C5"], null, null, null, null, null, null, null,
  ["G4", "Bb4"], null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'trap-beat',
    name: 'Midnight Trap',
    genre: 'Trap',
    bpm: 140,
    description: 'Hard-hitting 808s with rapid hi-hats',
    code: `// ═══════════════════════════════════════════════════════════
// Midnight Trap - 32-bar arrangement
// Sections: A(intro) B(build) C(drop) D(outro)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 140;

// ─────────────────────────────────────────────────────────────
// Master Chain
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1).toDestination();
const masterComp = new Tone.Compressor({ threshold: -12, ratio: 6, attack: 0.005, release: 0.15 }).connect(limiter);
const trapReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(masterComp);
const trapDelay = new Tone.PingPongDelay("8n", 0.22).connect(trapReverb);
trapDelay.wet.value = 0.12;
const darkFilter = new Tone.Filter(5000, "lowpass").connect(trapDelay);

const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 6,
  envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 0.5 }
}).connect(masterComp);
kick.volume.value = -2;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(trapReverb);
snare.volume.value = -8;

const hatC = new Tone.MetalSynth({
  envelope: { decay: 0.02 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4500, octaves: 1
}).connect(darkFilter);
hatC.volume.value = -16;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1
}).connect(darkFilter);
hatO.volume.value = -18;

// Half-time kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.6) return;
  kick.triggerAttackRelease("C1", "4n", t, v);
}, [
  1, null, null, null, null, null, null, null, null, null, null, null, 0.8, null, null, null,
  1, null, null, null, null, null, null, null, null, null, null, 0.5, 0.85, null, null, null,
  1, null, null, null, null, null, null, null, null, null, null, null, 0.85, null, null, null,
  1, null, null, null, null, null, 0.4, null, null, null, null, null, 0.9, null, 0.5, 0.6,
  1, null, null, null, null, null, null, null, null, null, null, null, 0.9, null, null, null,
  1, null, null, null, null, null, null, 0.5, null, null, null, null, 0.9, null, 0.6, 0.7,
  0.8, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  1, null, null, null, null, null, null, null, null, null, null, 0.6, 0.9, null, 0.7, 0.85
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  snare.triggerAttackRelease("8n", t, v);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, 0.5, 0.6,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, 0.4, null, null, null, null, 1, 0.5, 0.6, 0.7
], "16n").start(0);

// Rapid hi-hat with rolls
const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.6 : 1;
  if (v > 0.8) hatO.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hatC.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.4, 0.7, 0.3, 0.5, 0.3, 0.9, 0.5, 0.6, 0.7,
  0.75, 0.35, 0.55, 0.35, 0.7, 0.35, 0.65, 0.45, 0.7, 0.4, 0.55, 0.4, 0.9, 0.55, 0.7, 0.8
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// 808 Bass - Dm
// ─────────────────────────────────────────────────────────────
const bass808Filter = new Tone.Filter(150, "lowpass").connect(masterComp);
const bass808 = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.5, sustain: 0.4, release: 0.3 },
  filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.3, baseFrequency: 60, octaves: 2 }
}).connect(bass808Filter);
bass808.volume.value = -4;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.5) return;
  bass808.triggerAttackRelease(n, "4n", t);
}, [
  "D1", null, null, null, null, null, null, null, null, null, null, "F1", null, null, "D1", null,
  "D1", null, null, null, null, null, null, null, null, null, "A0", null, "D1", null, null, null,
  "D1", null, null, null, null, null, null, "E1", null, null, null, "F1", null, null, "D1", null,
  "D1", null, null, null, null, "E1", null, null, "F1", null, null, "G1", "A1", null, "D1", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead Synth
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(3500, "lowpass").connect(trapDelay);
const lead = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
}).connect(leadFilter);
lead.volume.value = -12;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "16n", t, 0.6);
}, [
  null, null, null, null, null, null, null, null, "D5", null, "F5", null, "A5", null, "D5", null,
  null, null, null, null, null, null, null, null, "A4", null, "D5", null, "C5", null, "A4", null,
  null, null, null, null, null, null, null, null, "D5", null, "E5", null, "F5", null, "A5", null,
  "F5", null, "E5", null, "D5", null, "C5", null, "A4", null, "G4", null, "F4", null, "D4", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - dark atmosphere
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1200, "lowpass").connect(trapReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 1, decay: 1, sustain: 0.5, release: 2 }
}).connect(padFilter);
pad.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.35 : 0.2;
  pad.triggerAttackRelease(c, "1m", t, vel);
}, [
  ["D3", "F3", "A3"], null, null, null, null, null, null, null,
  ["Bb2", "D3", "F3"], null, null, null, null, null, null, null,
  ["G2", "Bb2", "D3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`
  }
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
