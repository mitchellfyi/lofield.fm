import { Preset } from "./types";

export const rock: Preset = {
  id: "rock",
  name: "Overdrive",
  genre: "Rock",
  bpm: 128,
  description: "Distorted power chords with tight punchy drums and lead guitar fills",
  code: `// ═══════════════════════════════════════════════════════════
// Overdrive - 32-bar Rock Production
// Sections: A(intro) B(verse) C(chorus) D(breakdown)
// Key: E5 - A5 - D5 - B5
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 128;

// ─────────────────────────────────────────────────────────────
// Master Chain - saturated and powerful
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1).toDestination();
const masterSaturator = new Tone.Distortion(0.15).connect(limiter);
const masterComp = new Tone.Compressor({ threshold: -14, ratio: 5, attack: 0.015, release: 0.18 }).connect(masterSaturator);
const roomReverb = new Tone.Reverb({ decay: 1.8, wet: 0.18 }).connect(masterComp);
const slapDelay = new Tone.FeedbackDelay("16n", 0.2).connect(roomReverb);
slapDelay.wet.value = 0.1;
const rockFilter = new Tone.Filter(6000, "lowpass").connect(slapDelay);
const midBoost = new Tone.Filter(2000, "peaking").connect(rockFilter);
midBoost.Q.value = 1;
midBoost.gain.value = 4;

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - tight and punchy rock kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 6, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }
}).connect(masterComp);
kick.volume.value = -3;

const kickClick = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.008 }
}).connect(masterComp);
kickClick.volume.value = -16;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.12 }
}).connect(roomReverb);
snare.volume.value = -6;

const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.01, octaves: 3, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(roomReverb);
snareBody.volume.value = -12;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5.1, resonance: 4500, octaves: 1
}).connect(rockFilter);
hat.volume.value = -18;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.12 }, harmonicity: 5.1, resonance: 4000, octaves: 1
}).connect(rockFilter);
hatO.volume.value = -20;

const crash = new Tone.MetalSynth({
  envelope: { decay: 1.5 }, harmonicity: 6, resonance: 5500, octaves: 2
}).connect(roomReverb);
crash.volume.value = -16;

const floorTom = new Tone.MembraneSynth({
  pitchDecay: 0.03, octaves: 4, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.25 }
}).connect(roomReverb);
floorTom.volume.value = -8;

const rackTom = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.18 }
}).connect(roomReverb);
rackTom.volume.value = -10;

// Driving kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 3 ? 0.6 : 1;
  kick.triggerAttackRelease("C1", "8n", t, v * intensity);
  kickClick.triggerAttackRelease("32n", t, v * 0.4 * intensity);
}, [
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.6,
  1, null, null, null, 1, null, null, null, 1, null, null, 0.5, 1, null, 0.6, 0.7,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.6,
  1, null, null, 0.5, 1, null, null, null, 1, null, 0.5, null, 1, null, 0.7, 0.8,
  1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.65,
  1, null, 0.45, null, 1, null, null, 0.5, 1, null, null, null, 1, null, 0.7, 0.85,
  0.85, null, null, null, 0.8, null, null, null, 0.85, null, null, null, 0.8, null, null, null,
  1, null, null, null, 1, null, null, null, 1, null, 0.5, null, 1, 0.6, 0.75, 0.9
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 3 ? 0.6 : 1;
  snare.triggerAttackRelease("16n", t, v * intensity);
  snareBody.triggerAttackRelease("E3", "16n", t, v * 0.5 * intensity);
}, [
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, 0.45,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null,
  null, null, null, null, 1, null, null, 0.4, null, null, null, null, 1, null, 0.5, 0.6,
  null, null, null, null, 1, null, null, null, null, null, 0.35, null, 1, null, null, null,
  null, null, null, null, 1, null, 0.4, null, null, null, null, 0.45, 1, null, 0.55, 0.65,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 1, null, null, null, null, null, null, null, 1, 0.55, 0.7, 0.85
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.2 : section === 3 ? 0.6 : 1;
  if (v > 0.85) hatO.triggerAttackRelease("32n", t, v * 0.5 * intensity);
  else hat.triggerAttackRelease("32n", t, v * intensity);
}, [
  0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.4, 0.7, 0.3, 0.5, 0.3, 0.9, 0.35, 0.6, 0.5,
  0.75, 0.35, 0.55, 0.35, 0.75, 0.35, 0.65, 0.45, 0.75, 0.38, 0.55, 0.38, 0.92, 0.4, 0.65, 0.55
], "16n").start(0);

const crashPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3) return;
  crash.triggerAttackRelease("32n", t, v);
}, [
  0.6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.65, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.7, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.75, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "4n").start(0);

const tomPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  const synth = n.includes("2") ? floorTom : rackTom;
  synth.triggerAttackRelease(n, "8n", t, 0.75);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "E3", "D3", "A2", "E2",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "G3", "E3", "C3", "A2"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Bass Guitar - aggressive with pick attack
// ─────────────────────────────────────────────────────────────
const bassFilter = new Tone.Filter(1200, "lowpass").connect(masterComp);
const bassDistortion = new Tone.Distortion(0.3).connect(bassFilter);
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.2 },
  filterEnvelope: { attack: 0.005, decay: 0.08, sustain: 0.3, baseFrequency: 200, octaves: 3 }
}).connect(bassDistortion);
bass.volume.value = -8;

const bassPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 2 ? 0.95 : section === 3 ? 0.6 : 0.8;
  bass.triggerAttackRelease(n, "16n", t, vel);
}, [
  // E
  "E1", null, "E2", "E1", null, "E1", null, null, "E1", null, "E2", "E1", null, "E1", null, "G1",
  "E1", null, "E2", "E1", null, "E1", "G1", "A1", "E1", null, "E2", "E1", null, "B1", "A1", "G1",
  // A
  "A1", null, "A2", "A1", null, "A1", null, null, "A1", null, "A2", "A1", null, "A1", null, "B1",
  "A1", null, "A2", "A1", null, "A1", "B1", "C2", "A1", null, "A2", "A1", null, "E2", "D2", "B1",
  // D
  "D1", null, "D2", "D1", null, "D1", null, null, "D1", null, "D2", "D1", null, "D1", null, "E1",
  "D1", null, "D2", "D1", null, "D1", "E1", "F#1", "D1", null, "D2", "D1", null, "A1", "G1", "E1",
  // B
  "B0", null, "B1", "B0", null, "B0", null, null, "B0", null, "B1", "B0", null, "B0", null, "C#1",
  "B0", null, "B1", "B0", null, "B0", "D1", "E1", "B0", null, "B1", "B0", "F#1", "E1", "D1", "B0"
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Distorted Power Chords - E5 A5 D5 B5
// ─────────────────────────────────────────────────────────────
const guitarDistortion = new Tone.Distortion(0.8).connect(rockFilter);
const guitarAmp = new Tone.Filter(4000, "lowpass").connect(guitarDistortion);
guitarAmp.Q.value = 0.5;
const guitar = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.3 }
}).connect(guitarAmp);
guitar.volume.value = -10;

const guitarLayerFilter = new Tone.Filter(3500, "lowpass").connect(guitarDistortion);
const guitarLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.008, decay: 0.25, sustain: 0.4, release: 0.25 }
}).connect(guitarLayerFilter);
guitarLayer.volume.value = -14;

const powerChordPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 3) return;
  const vel = section === 2 ? 0.8 : section === 0 ? 0.5 : 0.65;
  guitar.triggerAttackRelease(c, "4n", t, vel);
  guitarLayer.triggerAttackRelease(c, "4n", t + 0.005, vel * 0.6);
}, [
  // E5
  ["E2", "B2", "E3"], null, null, null, ["E2", "B2"], null, null, null, ["E2", "B2", "E3"], null, null, null, ["E2", "B2"], null, null, null,
  ["E2", "B2", "E3"], null, null, null, ["E2", "B2"], null, ["E2", "B2", "E3"], null, null, null, null, null, ["E2", "B2", "E3"], null, null, null,
  // A5
  ["A2", "E3", "A3"], null, null, null, ["A2", "E3"], null, null, null, ["A2", "E3", "A3"], null, null, null, ["A2", "E3"], null, null, null,
  ["A2", "E3", "A3"], null, null, null, ["A2", "E3"], null, ["A2", "E3", "A3"], null, null, null, null, null, ["A2", "E3", "A3"], null, null, null,
  // D5
  ["D2", "A2", "D3"], null, null, null, ["D2", "A2"], null, null, null, ["D2", "A2", "D3"], null, null, null, ["D2", "A2"], null, null, null,
  ["D2", "A2", "D3"], null, null, null, ["D2", "A2"], null, ["D2", "A2", "D3"], null, null, null, null, null, ["D2", "A2", "D3"], null, null, null,
  // B5
  ["B1", "F#2", "B2"], null, null, null, ["B1", "F#2"], null, null, null, ["B1", "F#2", "B2"], null, null, null, ["B1", "F#2"], null, null, null,
  ["B1", "F#2", "B2"], null, null, null, ["B1", "F#2"], null, ["B1", "F#2", "B2"], null, null, null, ["E2", "B2"], null, ["E2", "B2", "E3"], null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead Guitar - fills and hooks
// ─────────────────────────────────────────────────────────────
const leadDistortion = new Tone.Distortion(0.6).connect(slapDelay);
const leadFilter = new Tone.Filter(5000, "lowpass").connect(leadDistortion);
const lead = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
  filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 800, octaves: 3 }
}).connect(leadFilter);
lead.volume.value = -12;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  lead.triggerAttackRelease(n, "8n", t, 0.65);
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "E5", "D5",
  "B4", null, null, null, null, null, "E5", null, "G5", null, null, null, "E5", null, "D5", null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "A5", "G5",
  "E5", null, null, null, null, null, "A5", null, "B5", null, null, null, "A5", null, "G5", "E5",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "D5", "E5",
  "F#5", null, null, null, null, null, "A5", null, "D5", null, null, null, "F#5", null, "E5", "D5",
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  "B4", null, "D5", null, "E5", null, "F#5", null, "G5", null, "A5", null, "B5", "A5", "G5", "E5"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad Layer - subtle support
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1500, "lowpass").connect(roomReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.8, decay: 0.5, sustain: 0.5, release: 1 }
}).connect(padFilter);
pad.volume.value = -24;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section !== 2) return;
  pad.triggerAttackRelease(c, "1n", t, 0.25);
}, [
  ["E3", "B3"], null, null, null, null, null, null, null,
  ["E3", "B3"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["D3", "A3"], null, null, null, null, null, null, null,
  ["D3", "A3"], null, null, null, null, null, null, null,
  ["B2", "F#3"], null, null, null, null, null, null, null,
  ["B2", "F#3"], null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`,
};
