import { Preset } from './types';

export const hiphop: Preset = {
  id: 'hiphop',
  name: 'Gold Chains',
  genre: 'Hip-Hop',
  bpm: 95,
  description: 'Classic boom-bap with layered drums, soulful piano, and deep sub bass',
  code: `// ═══════════════════════════════════════════════════════════
// Gold Chains - 32-bar Hip-Hop Production
// Sections: A(intro) B(verse) C(chorus) D(bridge)
// Key: Gm
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 95;
Tone.Transport.swing = 0.15;

// ─────────────────────────────────────────────────────────────
// Master Chain - warm vinyl character
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-2).toDestination();
const masterComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.05, release: 0.2 }).connect(limiter);
const vinylFilter = new Tone.Filter(8000, "lowpass").connect(masterComp);
const warmReverb = new Tone.Reverb({ decay: 2, wet: 0.18 }).connect(vinylFilter);
const sampleDelay = new Tone.FeedbackDelay("8n.", 0.3).connect(warmReverb);
sampleDelay.wet.value = 0.15;
const warmChorus = new Tone.Chorus(1.5, 3, 0.3).connect(sampleDelay).start();
const lofiFilter = new Tone.Filter(5000, "lowpass").connect(warmChorus);

// Vinyl crackle texture
const crackleFilter = new Tone.Filter(3000, "bandpass").connect(vinylFilter);
crackleFilter.Q.value = 0.5;
const crackle = new Tone.NoiseSynth({
  noise: { type: "brown" },
  envelope: { attack: 0.5, decay: 0.5, sustain: 1, release: 0.5 }
}).connect(crackleFilter);
crackle.volume.value = -38;
crackle.triggerAttack();

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Drums - layered boom-bap kit
// ─────────────────────────────────────────────────────────────
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 5, envelope: { attack: 0.001, decay: 0.5, sustain: 0.05, release: 0.4 }
}).connect(masterComp);
kick.volume.value = -4;

const kickLayer = new Tone.MembraneSynth({
  pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(masterComp);
kickLayer.volume.value = -10;

const kickClick = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 }
}).connect(masterComp);
kickClick.volume.value = -18;

const snare = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.15 }
}).connect(warmReverb);
snare.volume.value = -8;

const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(warmReverb);
snareBody.volume.value = -14;

const snareLayer = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.08 }
}).connect(warmReverb);
snareLayer.volume.value = -16;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.04 }, harmonicity: 5.1, resonance: 3500, octaves: 1
}).connect(lofiFilter);
hat.volume.value = -18;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.15 }, harmonicity: 5.1, resonance: 3000, octaves: 1
}).connect(lofiFilter);
hatO.volume.value = -20;

const rim = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.015 }
}).connect(lofiFilter);
rim.volume.value = -14;

const perc = new Tone.MembraneSynth({
  pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }
}).connect(warmReverb);
perc.volume.value = -12;

// Boom-bap kick pattern with swing
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.6) return;
  // Ghost note
  if (Math.random() > 0.94) kick.triggerAttackRelease("C1", "32n", t - 0.025, v * 0.2);
  const humanize = (Math.random() - 0.5) * 0.012;
  kick.triggerAttackRelease("C1", "8n", t + humanize, v);
  kickLayer.triggerAttackRelease("C1", "16n", t + humanize, v * 0.5);
  kickClick.triggerAttackRelease("32n", t + humanize, v * 0.3);
}, [
  0.95, null, null, 0.45, null, null, 0.9, null, null, 0.4, 0.95, null, null, null, 0.5, null,
  0.95, null, null, 0.5, null, null, 0.9, null, null, 0.45, 0.95, null, null, null, 0.55, 0.4,
  0.98, null, null, 0.5, null, null, 0.92, null, null, 0.45, 0.95, null, null, null, 0.5, null,
  0.98, null, null, 0.55, null, 0.35, 0.92, null, null, 0.5, 0.98, null, null, 0.4, 0.55, 0.5,
  0.98, null, null, 0.55, null, null, 0.95, null, null, 0.5, 0.98, null, null, null, 0.55, null,
  0.98, null, 0.35, 0.55, null, null, 0.95, null, 0.38, 0.5, 0.98, null, null, 0.45, 0.6, 0.55,
  0.9, null, null, 0.45, null, null, 0.85, null, null, null, 0.9, null, null, null, null, null,
  0.95, null, null, 0.5, null, null, 0.9, null, null, 0.5, 0.95, null, null, 0.5, 0.6, 0.7
], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 3 && Math.random() > 0.5) return;
  const humanize = (Math.random() - 0.5) * 0.01;
  snare.triggerAttackRelease("16n", t + humanize, v);
  snareBody.triggerAttackRelease("E3", "16n", t + humanize, v * 0.5);
  // Layer in chorus
  if (section === 2 && Math.random() > 0.5) snareLayer.triggerAttackRelease("16n", t + humanize + 0.01, v * 0.4);
}, [
  null, null, null, null, 0.9, null, null, 0.35, null, null, null, null, 0.92, null, null, null,
  null, null, null, null, 0.9, null, null, 0.38, null, null, null, null, 0.92, null, null, 0.42,
  null, null, null, null, 0.92, null, null, 0.35, null, null, null, null, 0.95, null, null, null,
  null, null, null, null, 0.92, null, 0.35, 0.38, null, null, null, null, 0.98, null, 0.48, 0.55,
  null, null, null, null, 0.95, null, null, 0.38, null, null, 0.3, null, 0.95, null, null, null,
  null, null, null, null, 0.98, null, 0.38, null, null, null, null, 0.42, 0.98, null, 0.52, 0.6,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.8, null, null, null,
  null, null, null, null, 0.92, null, null, null, null, null, null, null, 0.95, 0.52, 0.62, 0.72
], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 2 ? 1.15 : section === 0 ? 0.65 : 1;
  if (section === 0 && Math.random() > 0.7) return;
  const humanize = (Math.random() - 0.5) * 0.008;
  if (v > 0.78) hatO.triggerAttackRelease("32n", t + humanize, v * 0.5 * intensity);
  else hat.triggerAttackRelease("32n", t + humanize, v * intensity);
}, [
  0.5, 0.22, 0.42, 0.25, 0.5, 0.22, 0.8, 0.32, 0.5, 0.22, 0.42, 0.25, 0.5, 0.22, 0.52, 0.35,
  0.52, 0.25, 0.45, 0.28, 0.52, 0.25, 0.82, 0.35, 0.52, 0.25, 0.45, 0.28, 0.55, 0.25, 0.55, 0.38,
  0.52, 0.25, 0.45, 0.28, 0.52, 0.25, 0.82, 0.35, 0.55, 0.25, 0.45, 0.28, 0.55, 0.25, 0.55, 0.38,
  0.55, 0.28, 0.48, 0.3, 0.55, 0.28, 0.85, 0.38, 0.58, 0.28, 0.48, 0.3, 0.58, 0.28, 0.6, 0.42
], "16n").start(0);

const rimPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  if (Math.random() > 0.88) return;
  rim.triggerAttackRelease("32n", t, v);
}, [
  null, null, null, null, null, null, null, 0.5, null, null, null, null, null, null, null, 0.52,
  null, null, null, 0.48, null, null, null, 0.5, null, null, null, null, null, null, 0.52, 0.5,
  null, null, null, null, null, null, null, 0.52, null, null, null, 0.48, null, null, null, 0.55,
  null, null, 0.48, null, null, null, null, 0.52, null, null, null, null, null, 0.5, 0.55, null
], "16n").start(0);

const percPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section < 2) return;
  if (Math.random() > 0.9) return;
  perc.triggerAttackRelease(n, "16n", t, 0.6);
}, [
  null, null, null, "G3", null, null, null, null, null, null, null, "G3", null, null, null, null,
  null, null, null, "G3", null, null, null, "A3", null, null, null, "G3", null, null, "F3", null,
  null, null, null, "G3", null, null, null, null, null, null, null, "G3", null, null, "A3", null,
  null, null, "F3", "G3", null, null, null, "A3", null, null, "Bb3", "G3", null, null, "D4", null
], "16n").start(0);

// ─────────────────────────────────────────────────────────────
// Sub Bass - deep and warm
// ─────────────────────────────────────────────────────────────
const subFilter = new Tone.Filter(120, "lowpass").connect(masterComp);
const sub = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4 },
  filterEnvelope: { attack: 0.02, decay: 0.15, sustain: 0.5, baseFrequency: 50, octaves: 1.5 }
}).connect(subFilter);
sub.volume.value = -6;

const subPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.5) return;
  const humanize = (Math.random() - 0.5) * 0.01;
  const vel = section === 2 ? 0.9 : 0.75;
  sub.triggerAttackRelease(n, "8n", t + humanize, vel);
}, [
  // Gm
  "G1", null, "G1", null, null, null, "G1", null, null, null, "G1", null, null, null, "D2", null,
  "G1", null, "G1", null, "Bb1", null, null, null, "G1", null, "D2", null, "G1", null, null, null,
  // Gm
  "G1", null, "G1", null, null, null, "G1", null, null, null, "G1", null, null, null, "F2", null,
  "G1", null, "G1", null, "D2", null, null, null, "G1", null, "Bb1", "D2", "G2", null, "D2", null,
  // Eb
  "Eb1", null, "Eb1", null, null, null, "Eb1", null, null, null, "Eb1", null, null, null, "Bb1", null,
  "Eb1", null, "Eb1", null, "G1", null, null, null, "Eb1", null, "Bb1", null, "Eb1", null, null, null,
  // Dm
  "D1", null, "D1", null, null, null, "D1", null, null, null, "D1", null, null, null, "A1", null,
  "D1", null, "D1", null, "F1", null, "A1", null, "D1", null, "F1", "A1", "D2", "A1", "F1", "D1"
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Soulful Piano - sampled character
// ─────────────────────────────────────────────────────────────
const pianoFilter = new Tone.Filter(3000, "lowpass").connect(warmChorus);
const piano = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.2,
  envelope: { attack: 0.008, decay: 1.2, sustain: 0.3, release: 1.5 }
}).connect(pianoFilter);
piano.volume.value = -11;

const pianoLayerFilter = new Tone.Filter(2500, "lowpass").connect(sampleDelay);
const pianoLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1 }
}).connect(pianoLayerFilter);
pianoLayer.volume.value = -16;

const pianoPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 0 ? 0.32 : section === 2 ? 0.52 : 0.42;
  const humanize = (Math.random() - 0.5) * 0.012;
  piano.triggerAttackRelease(c, "2n", t + humanize, vel);
  // Layer in fuller sections
  if (section >= 1 && Math.random() > 0.6) {
    pianoLayer.triggerAttackRelease(c, "2n", t + humanize + 0.015, vel * 0.4);
  }
}, [
  // Gm7
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G3", "D4"], null,
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, ["Bb3", "D4", "G4"], null, null, null,
  // Gm7
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["G3", "F4"], null,
  ["G3", "Bb3", "D4", "F4"], null, null, null, null, null, null, null, null, null, null, null, ["D4", "F4", "G4"], null, null, null,
  // Ebmaj7
  ["Eb3", "G3", "Bb3", "D4"], null, null, null, null, null, null, null, null, null, null, null, null, null, ["Eb3", "Bb3"], null,
  ["Eb3", "G3", "Bb3", "D4"], null, null, null, null, null, null, null, null, null, null, null, ["G3", "Bb3", "Eb4"], null, null, null,
  // Dm7
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null, null, null, null, null, ["D3", "A3", "C4"], null, null, null,
  ["D3", "F3", "A3", "C4"], null, null, null, null, null, null, null, ["D3", "F3", "C4"], null, null, null, ["F3", "A3", "C4", "D4"], null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Rhodes - warm electric piano
// ─────────────────────────────────────────────────────────────
const rhodesFilter = new Tone.Filter(2500, "lowpass").connect(warmChorus);
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1,
  envelope: { attack: 0.005, decay: 0.8, sustain: 0.3, release: 1 }
}).connect(rhodesFilter);
rhodes.volume.value = -15;

const rhodesPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  const vel = section === 2 ? 0.45 : 0.35;
  rhodes.triggerAttackRelease(c, "4n", t, vel);
}, [
  null, null, null, null, null, null, ["G4", "Bb4"], null, null, null, null, null, null, null, ["D5", "F5"], null,
  null, null, null, null, null, null, null, null, ["G4", "D5"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, ["G4", "Bb4"], null, null, null, null, null, null, null, ["F4", "A4"], null,
  null, null, null, null, ["Bb4", "D5"], null, null, null, null, null, null, null, ["G4", "D5", "F5"], null, null, null,
  null, null, null, null, null, null, ["Eb4", "G4"], null, null, null, null, null, null, null, ["Bb4", "D5"], null,
  null, null, null, null, null, null, null, null, ["G4", "Bb4"], null, null, null, null, null, null, null,
  null, null, null, null, null, null, ["D4", "F4"], null, null, null, null, null, null, null, ["A4", "C5"], null,
  null, null, null, null, ["F4", "A4"], null, null, null, null, null, null, null, ["D4", "F4", "A4", "C5"], null, null, null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Lead - melodic fills
// ─────────────────────────────────────────────────────────────
const leadFilter = new Tone.Filter(4500, "lowpass").connect(sampleDelay);
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.25, release: 0.6 }
}).connect(leadFilter);
lead.volume.value = -14;

const leadPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  const vel = 0.48 + Math.random() * 0.15;
  lead.triggerAttackRelease(n, "8n", t, vel);
}, [
  null, null, null, null, null, null, "D5", "Bb4", "G4", null, null, null, null, null, null, null,
  null, null, null, null, "F5", null, "D5", null, "Bb4", null, "G4", null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, "G5", "F5",
  "D5", null, null, null, "Bb4", null, null, null, "G4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "Bb4", "G4", "Eb4", null, null, null, null, null, null, null,
  null, null, null, null, "D5", null, "Bb4", null, "G4", null, null, null, null, null, null, null,
  null, null, null, null, null, null, "A4", "F4", "D4", null, null, null, null, null, null, null,
  null, null, null, null, "C5", null, "A4", "F4", "D4", null, "F4", null, "A4", null, "D5", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Pad - warm atmosphere
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1200, "lowpass").connect(warmReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 2 }
}).connect(padFilter);
pad.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.35 : section === 0 ? 0.12 : 0.22;
  pad.triggerAttackRelease(c, "2n", t, vel);
}, [
  ["G4", "D5"], null, null, null, null, null, null, null,
  ["G4", "Bb4", "D5"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, null, null, null, null,
  ["G4", "Bb4", "F5"], null, null, null, null, null, null, null,
  ["Eb4", "Bb4"], null, null, null, null, null, null, null,
  ["Eb4", "G4", "Bb4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["D4", "F4", "A4"], null, null, null, null, null, null, null
], "2n").start(0);

Tone.Transport.start();`
};
