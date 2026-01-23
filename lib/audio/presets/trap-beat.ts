import { Preset } from "./types";

export const trapBeat: Preset = {
  id: "trap-beat",
  name: "Midnight Trap",
  genre: "Trap",
  bpm: 140,
  description: "Hard-hitting 808s with rapid hi-hats",
  code: `// ═══════════════════════════════════════════════════════════
// Midnight Trap - 32-bar arrangement
// Sections: A(intro) B(build) C(drop) D(outro)
// Key: Dm
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 140;

// ─────────────────────────────────────────────────────────────
// Master Chain - hard and punchy
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1).toDestination();
const masterComp = new Tone.Compressor({ threshold: -12, ratio: 6, attack: 0.005, release: 0.15 }).connect(limiter);
const trapReverb = new Tone.Reverb({ decay: 1.8, wet: 0.15 }).connect(masterComp);
const trapDelay = new Tone.PingPongDelay("8n", 0.22).connect(trapReverb);
trapDelay.wet.value = 0.12;
const darkFilter = new Tone.Filter(5000, "lowpass").connect(trapDelay);
const distortion = new Tone.Distortion(0.1).connect(darkFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - hard and punchy
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 6,
  envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 0.5 }
}).connect(masterComp);
kick.volume.value = -2;

const kickLayer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
}).connect(masterComp);
kickLayer.volume.value = -8;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(trapReverb);
snare.volume.value = -8;

const snareLayer = new Tone.MembraneSynth({
  pitchDecay: 0.01, octaves: 3,
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
}).connect(trapReverb);
snareLayer.volume.value = -12;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(trapReverb);
clap.volume.value = -14;

const hatC = new Tone.MetalSynth({
  envelope: { decay: 0.02 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4500, octaves: 1
}).connect(darkFilter);
hatC.volume.value = -16;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1
}).connect(darkFilter);
hatO.volume.value = -18;

const perc = new Tone.MetalSynth({
  envelope: { decay: 0.05 }, harmonicity: 8, modulationIndex: 24, resonance: 5500, octaves: 1
}).connect(darkFilter);
perc.volume.value = -20;

// Half-time kick pattern with hard hits
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.6 : section === 3 ? 0.7 : 1;
  kick.triggerAttackRelease("C1", "4n", t, v * intensity);
  kickLayer.triggerAttackRelease("C0", "8n", t, v * 0.5 * intensity);
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
  snareLayer.triggerAttackRelease("E3", "16n", t, v * 0.4);
  // Layer clap in full sections
  if (section === 2) clap.triggerAttackRelease("16n", t + 0.01, v * 0.5);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, 0.5, 0.6,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, null, 0.4, null, null, null, null, 1, 0.5, 0.6, 0.7,
  null, null, null, null, 1, null, null, null, null, null, 0.35, null, 1, null, null, 0.5,
  null, null, null, null, 1, null, 0.4, null, null, null, null, 0.45, 1, 0.5, 0.6, 0.7,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.6, 0.7, 0.85
], "16n").start(0);

// Rapid hi-hat with rolls and variation
const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.6 : 1;
  if (v > 0.8) hatO.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hatC.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.4, 0.7, 0.3, 0.5, 0.3, 0.9, 0.5, 0.6, 0.7,
  0.75, 0.35, 0.55, 0.35, 0.7, 0.35, 0.65, 0.45, 0.7, 0.4, 0.55, 0.4, 0.9, 0.55, 0.7, 0.8,
  0.7, 0.35, 0.55, 0.35, 0.75, 0.35, 0.65, 0.45, 0.75, 0.38, 0.55, 0.38, 0.92, 0.55, 0.68, 0.78,
  0.78, 0.38, 0.58, 0.38, 0.75, 0.38, 0.68, 0.48, 0.75, 0.42, 0.58, 0.42, 0.95, 0.6, 0.75, 0.85
], "16n").start(0);

const percPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  perc.triggerAttackRelease("32n", t, v);
}, [
  null, null, null, 0.4, null, null, null, null, null, null, null, 0.45, null, null, null, null,
  null, null, 0.4, null, null, null, null, 0.45, null, null, null, null, null, null, 0.5, null,
  null, null, null, 0.42, null, null, null, null, null, 0.4, null, null, null, null, null, 0.48,
  null, 0.4, null, null, null, null, 0.45, null, null, null, null, 0.48, null, null, 0.5, 0.55
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// 808 Bass - Dm with slides and variation
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
  const intensity = section === 0 ? 0.5 : 1;
  const vel = section === 2 ? 1 : 0.85;
  bass808.triggerAttackRelease(n, "4n", t, vel * intensity);
}, [
  "D1", null, null, null, null, null, null, null, null, null, null, "F1", null, null, "D1", null,
  "D1", null, null, null, null, null, null, null, null, null, "A0", null, "D1", null, null, null,
  "D1", null, null, null, null, null, null, "E1", null, null, null, "F1", null, null, "D1", null,
  "D1", null, null, null, null, "E1", null, null, "F1", null, null, "G1", "A1", null, "D1", null,
  "D1", null, null, null, null, null, null, null, null, null, null, "F1", null, null, "D1", null,
  "D1", null, null, null, null, null, "E1", null, null, null, "G1", null, "A1", null, "D1", null,
  "D1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "D1", null, null, null, null, "E1", null, null, "F1", null, "G1", null, "A1", "G1", "F1", "D1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead Synth - melodic hook
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(3500, "lowpass").connect(trapDelay);
const lead = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
}).connect(leadFilter);
lead.volume.value = -12;

const leadLayer = new Tone.Synth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.15, sustain: 0.15, release: 0.25 }
}).connect(leadFilter);
leadLayer.volume.value = -18;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "16n", t, 0.62);
  // Layer in chorus
  if (section === 2) {
    const octaveDown = Tone.Frequency(n).transpose(-12).toNote();
    leadLayer.triggerAttackRelease(octaveDown, "16n", t, 0.25);
  }
}, [
  null, null, null, null, null, null, null, null, "D5", null, "F5", null, "A5", null, "D5", null,
  null, null, null, null, null, null, null, null, "A4", null, "D5", null, "C5", null, "A4", null,
  null, null, null, null, null, null, null, null, "D5", null, "E5", null, "F5", null, "A5", null,
  "F5", null, "E5", null, "D5", null, "C5", null, "A4", null, "G4", null, "F4", null, "D4", null,
  null, null, null, null, null, null, null, null, "D5", null, "F5", null, "G5", null, "A5", null,
  "A5", null, "G5", null, "F5", null, "E5", null, "D5", null, "C5", null, "A4", null, "D5", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "D5", null, "F5", null, "A5", null, "D6", null, "A5", null, "F5", null, "D5", "E5", "F5", "A5"
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
  ["D3", "F3", "A3"], null, null, null, null, null, null, null,
  ["Bb2", "D3", "F3"], null, null, null, null, null, null, null,
  ["Bb2", "D3", "F3"], null, null, null, null, null, null, null,
  ["G2", "Bb2", "D3"], null, null, null, null, null, null, null,
  ["G2", "Bb2", "D3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - subtle movement
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(4000, "lowpass").connect(trapDelay);
const arp = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.2 }
}).connect(arpFilter);
arp.volume.value = -18;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  arp.triggerAttackRelease(n, "32n", t, 0.45);
}, [
  "D4", "F4", "A4", "D5", "A4", "F4", "D4", "F4", "D4", "F4", "A4", "D5", "A4", "F4", "A4", "D5",
  "D4", "F4", "A4", "D5", "A4", "F4", "D4", "A4", "D4", "F4", "A4", "D5", "F5", "D5", "A4", "F4",
  "Bb3", "D4", "F4", "Bb4", "F4", "D4", "Bb3", "D4", "Bb3", "D4", "F4", "Bb4", "F4", "D4", "F4", "Bb4",
  "Bb3", "D4", "F4", "Bb4", "F4", "D4", "Bb3", "F4", "Bb3", "D4", "F4", "Bb4", "D5", "Bb4", "F4", "D4",
  "G3", "Bb3", "D4", "G4", "D4", "Bb3", "G3", "Bb3", "G3", "Bb3", "D4", "G4", "D4", "Bb3", "D4", "G4",
  "G3", "Bb3", "D4", "G4", "D4", "Bb3", "G3", "D4", "G3", "Bb3", "D4", "G4", "Bb4", "G4", "D4", "Bb3",
  "A3", "C4", "E4", "A4", "E4", "C4", "A3", "C4", "A3", "C4", "E4", "A4", "E4", "C4", "E4", "A4",
  "A3", "C4", "E4", "A4", "E4", "C4", "A3", "E4", "A3", "C4", "E4", "A4", "C5", "A4", "E4", "C4"
], "16n").start(0);

Tone.Transport.start();`,
};
