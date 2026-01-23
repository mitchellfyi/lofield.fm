import { Preset } from "./types";

export const trance: Preset = {
  id: "trance",
  name: "Euphoria",
  genre: "Trance",
  bpm: 138,
  description: "Supersaw lead, massive reverb, sidechained pads, and euphoric builds",
  code: `// ═══════════════════════════════════════════════════════════
// Euphoria - 32-bar Trance Production
// Sections: A(intro) B(build) C(drop) D(breakdown)
// Key: Am (Am - F - C - G)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 138;

// ─────────────────────────────────────────────────────────────
// Master Chain - massive and euphoric
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1.5).toDestination();
const masterComp = new Tone.Compressor({ threshold: -14, ratio: 5, attack: 0.01, release: 0.15 }).connect(limiter);
const massiveReverb = new Tone.Reverb({ decay: 5, wet: 0.35 }).connect(masterComp);
const stereoDelay = new Tone.PingPongDelay("8n", 0.35).connect(massiveReverb);
stereoDelay.wet.value = 0.25;
const wideChorus = new Tone.Chorus(4, 6, 0.6).connect(stereoDelay).start();
const brightFilter = new Tone.Filter(10000, "lowpass").connect(wideChorus);
const highShelf = new Tone.Filter(5000, "highshelf").connect(brightFilter);
highShelf.gain.value = 4;

// Sidechain compressor for pumping effect
const sidechainComp = new Tone.Compressor({ threshold: -30, ratio: 10, attack: 0.005, release: 0.15 }).connect(massiveReverb);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - punchy and driving
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 7, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.25 }
}).connect(masterComp);
kick.volume.value = -2;

const kickClick = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.012, sustain: 0, release: 0.008 }
}).connect(masterComp);
kickClick.volume.value = -16;

const kickSub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 }
}).connect(masterComp);
kickSub.volume.value = -12;

const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.003, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(massiveReverb);
clap.volume.value = -10;

const clapLayer = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }
}).connect(massiveReverb);
clapLayer.volume.value = -14;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5.1, resonance: 5000, octaves: 1
}).connect(brightFilter);
hat.volume.value = -18;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.1 }, harmonicity: 5.1, resonance: 4500, octaves: 1
}).connect(brightFilter);
hatO.volume.value = -20;

const crash = new Tone.MetalSynth({
  envelope: { decay: 2 }, harmonicity: 6, resonance: 5500, octaves: 2
}).connect(massiveReverb);
crash.volume.value = -14;

const ride = new Tone.MetalSynth({
  envelope: { decay: 0.15 }, harmonicity: 8, resonance: 6000, octaves: 1
}).connect(brightFilter);
ride.volume.value = -20;

// Four-on-floor pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 3 ? 0.4 : 1;
  // Sidechain trigger
  sidechainComp.attack.setValueAtTime(0.005, t);
  sidechainComp.release.setValueAtTime(0.15, t);
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
  kickClick.triggerAttackRelease("32n", t, v * 0.4 * intensity);
  kickSub.triggerAttackRelease("C0", "8n", t, v * 0.35 * intensity);
}, [
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.55,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, 0.45, 1, null, null, null, 1, null, 0.55, 0.65,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, 0.5, 1, null, 0.6, 0.7,
  0.85, null, null, null, 0.8, null, null, null, null, null, null, null, 0.85, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, 0.55, 0.7, 0.85
], "16n").start(0);

const clapPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  clap.triggerAttackRelease("16n", t, v);
  clapLayer.triggerAttackRelease("16n", t + 0.01, v * 0.5);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.45,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.38, null, null, null, null, 1, null, 0.48, 0.58,
  null, null, null, null, 1, null, null, null, null, null, 0.35, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.4, null, null, null, null, 0.45, 1, null, 0.55, 0.68,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.5, 0.65, 0.8
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 3 ? 0.5 : 1;
  if (v > 0.85) hatO.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.65, 0.3, 0.5, 0.32, 0.65, 0.3, 0.9, 0.42, 0.65, 0.3, 0.5, 0.32, 0.65, 0.3, 0.55, 0.45,
  0.68, 0.32, 0.52, 0.35, 0.68, 0.32, 0.92, 0.45, 0.68, 0.35, 0.52, 0.35, 0.68, 0.35, 0.58, 0.48
], "16n").start(0);

const ridePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section !== 2) return;
  ride.triggerAttackRelease("32n", t, v);
}, [
  null, 0.4, null, null, null, 0.42, null, null, null, 0.4, null, null, null, 0.45, null, null,
  null, 0.42, null, null, null, 0.45, null, null, null, 0.42, null, null, null, 0.48, null, 0.4
], "16n").start(0);

const crashPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  crash.triggerAttackRelease("32n", t, v);
}, [
  0.65, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.7, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.75, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.8, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass - driving and punchy
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(800, "lowpass").connect(masterComp);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.15 },
  filterEnvelope: { attack: 0.005, decay: 0.08, sustain: 0.25, baseFrequency: 200, octaves: 3 }
}).connect(bassFilter);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 2 ? 0.95 : section === 3 ? 0.5 : 0.8;
  bass.triggerAttackRelease(n, "16n", t, vel);
}, [
  // Am
  "A1", null, "A1", "A2", null, "A1", null, null, "A1", null, "A1", "E2", null, "A1", null, "C2",
  "A1", null, "A1", "A2", null, "A1", "E2", "A1", "A1", null, "C2", "A1", null, "E2", "A1", "G1",
  // F
  "F1", null, "F1", "F2", null, "F1", null, null, "F1", null, "F1", "C2", null, "F1", null, "A1",
  "F1", null, "F1", "F2", null, "F1", "C2", "F1", "F1", null, "A1", "F1", null, "C2", "F1", "E1",
  // C
  "C1", null, "C1", "C2", null, "C1", null, null, "C1", null, "C1", "G1", null, "C1", null, "E1",
  "C1", null, "C1", "C2", null, "C1", "G1", "C1", "C1", null, "E1", "C1", null, "G1", "C1", "B0",
  // G
  "G1", null, "G1", "G2", null, "G1", null, null, "G1", null, "G1", "D2", null, "G1", null, "B1",
  "G1", null, "G1", "G2", null, "G1", "D2", "B1", "G1", null, "B1", "D2", "G2", "D2", "B1", "G1"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Supersaw Lead - massive and euphoric
// ─────────────────────────────────────────────────────────────
const supersawFilter = new Tone.Filter(6000, "lowpass").connect(stereoDelay);
const supersaw = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.5 }
}).connect(supersawFilter);
supersaw.volume.value = -10;

// Detuned layer for width
const supersawLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.015, decay: 0.25, sustain: 0.35, release: 0.45 }
}).connect(supersawFilter);
supersawLayer.volume.value = -12;
supersawLayer.set({ detune: 15 });

const supersawLayer2 = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.015, decay: 0.25, sustain: 0.35, release: 0.45 }
}).connect(supersawFilter);
supersawLayer2.volume.value = -12;
supersawLayer2.set({ detune: -15 });

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  const vel = section === 2 ? 0.7 : 0.55;
  supersaw.triggerAttackRelease(n, "8n", t, vel);
  supersawLayer.triggerAttackRelease(n, "8n", t + 0.005, vel * 0.7);
  supersawLayer2.triggerAttackRelease(n, "8n", t + 0.005, vel * 0.7);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, "E5", null, "A5", null,
  "C6", null, null, null, null, null, "A5", null, "E5", null, null, null, "C5", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "C5", null, "F5", null,
  "A5", null, null, null, null, null, "F5", null, "C5", null, null, null, "A4", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "G4", null, "C5", null,
  "E5", null, null, null, null, null, "C5", null, "G4", null, null, null, "E4", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "B4", null, "D5", null,
  "G5", null, null, null, "D5", null, "G5", null, "B5", null, "D6", null, "G5", "B5", "D6", "E6"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Pluck Arpeggio - sparkling movement
// ─────────────────────────────────────────────────────────────
const pluckFilter = new Tone.Filter(5000, "lowpass").connect(stereoDelay);
const pluck = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.3 }
}).connect(pluckFilter);
pluck.volume.value = -14;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  pluck.triggerAttackRelease(n, "32n", t, 0.55);
}, [
  // Am
  "A4", "C5", "E5", "A5", "E5", "C5", "A4", "C5", "A4", "C5", "E5", "A5", "E5", "C5", "E5", "A5",
  "A4", "C5", "E5", "A5", "E5", "C5", "A4", "E5", "A4", "C5", "E5", "A5", "C6", "A5", "E5", "C5",
  // F
  "F4", "A4", "C5", "F5", "C5", "A4", "F4", "A4", "F4", "A4", "C5", "F5", "C5", "A4", "C5", "F5",
  "F4", "A4", "C5", "F5", "C5", "A4", "F4", "C5", "F4", "A4", "C5", "F5", "A5", "F5", "C5", "A4",
  // C
  "C4", "E4", "G4", "C5", "G4", "E4", "C4", "E4", "C4", "E4", "G4", "C5", "G4", "E4", "G4", "C5",
  "C4", "E4", "G4", "C5", "G4", "E4", "C4", "G4", "C4", "E4", "G4", "C5", "E5", "C5", "G4", "E4",
  // G
  "G4", "B4", "D5", "G5", "D5", "B4", "G4", "B4", "G4", "B4", "D5", "G5", "D5", "B4", "D5", "G5",
  "G4", "B4", "D5", "G5", "D5", "B4", "G4", "D5", "G4", "B4", "D5", "G5", "B5", "G5", "D5", "B4"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Sidechained Pad - massive atmosphere with pumping
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(3000, "lowpass").connect(sidechainComp);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 1.5 }
}).connect(padFilter);
pad.volume.value = -16;

const padLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1, decay: 0.6, sustain: 0.5, release: 2 }
}).connect(padFilter);
padLayer.volume.value = -20;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.5 : section === 3 ? 0.6 : 0.35;
  pad.triggerAttackRelease(c, "1n", t, vel);
  padLayer.triggerAttackRelease(c, "1n", t + 0.1, vel * 0.6);
}, [
  // Am
  ["A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["A3", "C4", "E4", "G4"], null, null, null, null, null, null, null,
  // F
  ["F3", "A3", "C4"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  // C
  ["C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  // G
  ["G3", "B3", "D4"], null, null, null, null, null, null, null,
  ["G3", "B3", "D4", "F4"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Gated Synth - rhythmic energy
// ─────────────────────────────────────────────────────────────
const gateFilter = new Tone.Filter(4000, "lowpass").connect(sidechainComp);
const gateSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.1 }
}).connect(gateFilter);
gateSynth.volume.value = -18;

const gatePat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section !== 2) return;
  gateSynth.triggerAttackRelease(c, "32n", t, 0.5);
}, [
  ["A4", "E5"], null, null, null, ["A4", "E5"], null, null, null, ["A4", "E5"], null, null, null, ["A4", "E5"], null, null, null,
  ["A4", "E5"], null, null, ["C5", "G5"], ["A4", "E5"], null, null, null, ["A4", "E5"], null, ["C5", "G5"], null, ["A4", "E5"], null, null, null,
  ["F4", "C5"], null, null, null, ["F4", "C5"], null, null, null, ["F4", "C5"], null, null, null, ["F4", "C5"], null, null, null,
  ["F4", "C5"], null, null, ["A4", "E5"], ["F4", "C5"], null, null, null, ["F4", "C5"], null, ["A4", "E5"], null, ["F4", "C5"], null, null, null,
  ["C4", "G4"], null, null, null, ["C4", "G4"], null, null, null, ["C4", "G4"], null, null, null, ["C4", "G4"], null, null, null,
  ["C4", "G4"], null, null, ["E4", "B4"], ["C4", "G4"], null, null, null, ["C4", "G4"], null, ["E4", "B4"], null, ["C4", "G4"], null, null, null,
  ["G4", "D5"], null, null, null, ["G4", "D5"], null, null, null, ["G4", "D5"], null, null, null, ["G4", "D5"], null, null, null,
  ["G4", "D5"], null, null, ["B4", "F5"], ["G4", "D5"], null, null, null, ["G4", "D5"], null, ["B4", "F5"], null, ["G4", "D5"], ["A4", "E5"], ["B4", "F5"], ["C5", "G5"]
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// FX Riser - build tension
// ─────────────────────────────────────────────────────────────
const riserFilter = new Tone.Filter(500, "lowpass").connect(massiveReverb);
const riser = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 8, decay: 0, sustain: 1, release: 0.5 }
}).connect(riserFilter);
riser.volume.value = -22;

// Riser only in build section
const riserPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section !== 1) return;
  riserFilter.frequency.rampTo(8000, 8, t);
  riser.triggerAttackRelease("4m", t, v);
}, [
  0.3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`,
};
