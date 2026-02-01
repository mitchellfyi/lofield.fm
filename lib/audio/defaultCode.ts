// Default demo code for the studio
// This is a 32-bar lofi arrangement with variation across sections

export const DEFAULT_CODE = `// ═══════════════════════════════════════════════════════════
// Midnight Lofi - 32-bar arrangement with variation
// Sections: A(intro) B(build) C(full) D(breakdown)
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;

// ─────────────────────────────────────────────────────────────
// Master Chain
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
// Drums
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
  // Section A: sparse, Section C: full, Section D: half-time feel
  if (section === 0 && Math.random() > 0.7) return; // A: sparse
  if (section === 3 && Math.random() > 0.5) return; // D: breakdown
  // Random ghost note
  if (Math.random() > 0.92) kick.triggerAttackRelease("C1", "16n", t, v * 0.3);
  kick.triggerAttackRelease("C1", "8n", t, v);
}, [
  // Section A (bars 1-8): basic pattern
  0.9, null, null, 0.4, 0.85, null, 0.3, null, 0.9, null, null, 0.5, 0.8, null, 0.35, null,
  0.9, null, null, 0.4, 0.85, null, null, 0.4, 0.9, null, null, 0.5, 0.85, null, 0.3, 0.5,
  // Section B (bars 9-16): more energy
  0.95, null, null, 0.5, 0.9, null, 0.4, null, 0.9, null, 0.3, 0.5, 0.85, null, 0.4, null,
  0.95, null, null, 0.5, 0.9, null, 0.35, 0.4, 0.9, null, null, 0.5, 0.9, null, 0.4, 0.55,
  // Section C (bars 17-24): full energy
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, null, 0.95, null, 0.3, 0.55, 0.9, null, 0.45, null,
  0.95, null, 0.3, 0.5, 0.9, null, 0.4, 0.35, 0.95, null, 0.3, 0.5, 0.9, 0.4, 0.45, 0.5,
  // Section D (bars 25-32): breakdown
  0.85, null, null, null, 0.8, null, null, null, 0.85, null, null, null, 0.8, null, null, null,
  0.9, null, null, 0.4, 0.85, null, null, null, 0.9, null, null, 0.5, 0.85, null, 0.4, 0.6
], "16n").start(0);

// Snare with fills
const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.8) return; // A: occasional drops
  // Random clap layer on section C
  if (section === 2 && Math.random() > 0.7) clap.triggerAttackRelease("16n", t, v * 0.5);
  snare.triggerAttackRelease("16n", t, v);
}, [
  // 32-bar pattern (8 bars x 4 sections, 16 steps per 2 bars)
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, 0.4,
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.9, null, null, null,
  null, null, null, null, 0.9, null, null, 0.3, null, null, null, null, 0.9, null, 0.4, 0.5,
  null, null, null, null, 0.95, null, null, null, null, null, 0.3, null, 0.9, null, null, null,
  null, null, null, null, 0.95, null, 0.3, null, null, null, null, 0.4, 0.9, null, 0.5, 0.6,
  null, null, null, null, 0.8, null, null, null, null, null, null, null, 0.75, null, null, null,
  null, null, null, null, 0.85, null, null, null, null, null, null, null, 0.9, 0.5, 0.6, 0.7
], "16n").start(0);

// Hi-hats with random variation
const hatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  // Vary intensity by section
  const intensity = section === 2 ? 1.2 : section === 0 ? 0.7 : 1;
  // Random open hat
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
  // Section A: sparse, D: simpler
  if (section === 0 && Math.random() > 0.6) return;
  // Random octave jump
  const note = (Math.random() > 0.95) ? n.replace("2", "3") : n;
  bass.triggerAttackRelease(note, "8n", t, 0.85);
}, [
  // Section A & B: Dm7 - G7 - Cmaj7 - Am7
  "D2", null, "D2", "D2", null, null, "F2", null, "D2", null, "D2", "A1", null, null, "D2", null,
  "G2", null, "G2", "G2", null, null, "B1", null, "G2", null, "G2", "D2", null, null, "G2", null,
  "C2", null, "C2", "E2", null, null, "G2", null, "C2", null, "C2", "G1", null, null, "C2", null,
  "A1", null, "A1", "C2", null, null, "E2", null, "A1", null, "A1", "E2", null, null, "A2", null,
  // Section C & D: Fmaj7 - Em7 - Dm7 - G7 (variation)
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
  // Fade in on section A, full on C
  const vel = section === 0 ? 0.35 : section === 2 ? 0.6 : 0.5;
  rhodes.triggerAttackRelease(c, "1n", t, vel);
}, [
  // 32 bars = 8 chords (each held for 4 bars with variations)
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
  // Silent in section A, subtle in D
  if (section === 0) return;
  if (section === 3 && Math.random() > 0.5) return;
  const vel = section === 2 ? 0.7 : 0.55;
  arp.triggerAttackRelease(n, "16n", t, vel);
}, [
  // Section A: silent (nulls)
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  // Section B: Dm7 and G7 arps
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4", "D4", "F4", "A4", "C5", "A4", "F4", "A4", "C5",
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4", "G4", "B4", "D5", "F5", "D5", "B4", "D5", "F5",
  // Section C: Cmaj7 and Am7 arps (climax)
  "C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4", "C4", "E4", "G4", "B4", "C5", "B4", "G4", "B4",
  "A3", "C4", "E4", "G4", "A4", "G4", "E4", "C4", "A3", "C4", "E4", "G4", "A4", "G4", "E4", "G4",
  // Section D: Fmaj7 and resolution (breakdown)
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
  // Quieter in A and D, full in C
  const vel = section === 2 ? 0.4 : section === 0 || section === 3 ? 0.2 : 0.3;
  pad.triggerAttackRelease(c, "2n", t, vel);
}, [
  // Long sustained notes, one per 2 bars
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, null, null, null, null,
  ["C4", "G4"], null, null, null, null, null, null, null,
  ["A3", "E4"], null, null, null, null, null, null, null,
  ["F4", "C5"], null, null, null, null, null, null, null,
  ["E4", "B4"], null, null, null, null, null, null, null,
  ["D4", "A4"], null, null, null, null, null, null, null,
  ["G4", "D5"], null, null, null, ["G4", "B4", "D5"], null, null, null
], "2n").start(0);`;
