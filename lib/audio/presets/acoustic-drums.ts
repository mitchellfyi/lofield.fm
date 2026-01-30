import { Preset } from "./types";

export const acousticDrums: Preset = {
  id: "acoustic-drums",
  name: "Studio Kit",
  genre: "Live",
  bpm: 92,
  description:
    "Realistic acoustic drum kit with tuned membranes, snare wires, and detailed cymbal harmonics",
  tags: ["drums", "acoustic", "live", "realistic", "instrument", "percussion"],
  code: `// ═══════════════════════════════════════════════════════════
// Studio Kit - Realistic Acoustic Drums
// Careful synthesis of kick membrane, snare body + wires,
// toms with proper tuning, and metallic cymbal harmonics
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 92;
Tone.Transport.swing = 0.03;

// ─────────────────────────────────────────────────────────────
// Room Acoustics - Live drum room
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-1).toDestination();
const masterComp = new Tone.Compressor({
  threshold: -12, ratio: 4, attack: 0.003, release: 0.15
}).connect(limiter);

// Drum room reverb - medium decay for punch
const drumRoom = new Tone.Reverb({
  decay: 1.2,
  wet: 0.18,
  preDelay: 0.005
}).connect(masterComp);

// Overhead compression for glue
const overheadComp = new Tone.Compressor({
  threshold: -18, ratio: 3, attack: 0.01, release: 0.1
}).connect(drumRoom);

// High-pass for clarity
const drumHP = new Tone.Filter(60, "highpass").connect(overheadComp);

// ─────────────────────────────────────────────────────────────
// KICK DRUM - 22" with beater attack and membrane resonance
// ─────────────────────────────────────────────────────────────
// Main kick body - membrane with pitch sweep
const kickBody = new Tone.MembraneSynth({
  pitchDecay: 0.05,           // Fast pitch drop for punch
  octaves: 6,                 // Wide pitch sweep
  oscillator: { type: "sine" },
  envelope: {
    attack: 0.002,            // Beater impact
    decay: 0.35,              // Membrane decay
    sustain: 0.01,
    release: 0.3
  }
}).connect(masterComp);
kickBody.volume.value = -4;

// Kick beater click - high frequency transient
const kickClick = new Tone.MembraneSynth({
  pitchDecay: 0.01,
  octaves: 3,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.0005, decay: 0.02, sustain: 0, release: 0.02 }
}).connect(new Tone.Filter(4000, "highpass").connect(masterComp));
kickClick.volume.value = -12;

// Kick sub - extra low end
const kickSub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.2 }
}).connect(new Tone.Filter(100, "lowpass").connect(masterComp));
kickSub.volume.value = -8;

// ─────────────────────────────────────────────────────────────
// SNARE DRUM - 14" with body, wires, and rim
// ─────────────────────────────────────────────────────────────
// Snare body - tuned membrane
const snareBody = new Tone.MembraneSynth({
  pitchDecay: 0.008,
  octaves: 3,
  oscillator: { type: "triangle" },
  envelope: { attack: 0.0005, decay: 0.12, sustain: 0.02, release: 0.15 }
}).connect(drumRoom);
snareBody.volume.value = -8;

// Snare wires - filtered noise
const snareWires = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.18, sustain: 0.02, release: 0.12 }
}).connect(new Tone.Filter({
  frequency: 5500, type: "bandpass", Q: 1.5
}).connect(drumRoom));
snareWires.volume.value = -10;

// Snare rattle - sympathetic wire response
const snareRattle = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 0.005, decay: 0.08, sustain: 0.01, release: 0.06 }
}).connect(new Tone.Filter({
  frequency: 4000, type: "highpass"
}).connect(overheadComp));
snareRattle.volume.value = -22;

// Rimshot - metallic ring
const rimshot = new Tone.MetalSynth({
  frequency: 300,
  envelope: { attack: 0.0005, decay: 0.08, sustain: 0, release: 0.05 },
  harmonicity: 3.1,
  modulationIndex: 8,
  resonance: 2500,
  octaves: 0.5
}).connect(drumRoom);
rimshot.volume.value = -18;

// ─────────────────────────────────────────────────────────────
// TOMS - High, Mid, Floor with proper tuning
// ─────────────────────────────────────────────────────────────
// High tom - 10"
const highTom = new Tone.MembraneSynth({
  pitchDecay: 0.03,
  octaves: 4,
  envelope: { attack: 0.001, decay: 0.25, sustain: 0.02, release: 0.2 }
}).connect(drumRoom);
highTom.volume.value = -7;

// Mid tom - 12"
const midTom = new Tone.MembraneSynth({
  pitchDecay: 0.035,
  octaves: 4.5,
  envelope: { attack: 0.001, decay: 0.3, sustain: 0.02, release: 0.25 }
}).connect(drumRoom);
midTom.volume.value = -6;

// Floor tom - 16"
const floorTom = new Tone.MembraneSynth({
  pitchDecay: 0.045,
  octaves: 5,
  envelope: { attack: 0.001, decay: 0.4, sustain: 0.03, release: 0.3 }
}).connect(drumRoom);
floorTom.volume.value = -5;

// ─────────────────────────────────────────────────────────────
// CYMBALS - Hi-hat, Ride, Crash with metallic harmonics
// ─────────────────────────────────────────────────────────────
// Hi-hat closed - bright, short
const hihatClosed = new Tone.MetalSynth({
  frequency: 350,
  envelope: { attack: 0.0005, decay: 0.04, sustain: 0, release: 0.03 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 5000,
  octaves: 1.2
}).connect(drumHP);
hihatClosed.volume.value = -14;

// Hi-hat open - longer decay
const hihatOpen = new Tone.MetalSynth({
  frequency: 320,
  envelope: { attack: 0.001, decay: 0.35, sustain: 0.02, release: 0.25 },
  harmonicity: 5.1,
  modulationIndex: 28,
  resonance: 4500,
  octaves: 1.4
}).connect(drumHP);
hihatOpen.volume.value = -14;

// Hi-hat pedal - foot chick
const hihatPedal = new Tone.MetalSynth({
  frequency: 400,
  envelope: { attack: 0.0005, decay: 0.02, sustain: 0, release: 0.015 },
  harmonicity: 5.5,
  modulationIndex: 20,
  resonance: 6000,
  octaves: 0.8
}).connect(drumHP);
hihatPedal.volume.value = -16;

// Ride cymbal - bell and bow
const rideBow = new Tone.MetalSynth({
  frequency: 280,
  envelope: { attack: 0.001, decay: 1.5, sustain: 0.05, release: 0.8 },
  harmonicity: 4.2,
  modulationIndex: 18,
  resonance: 3000,
  octaves: 2
}).connect(overheadComp);
rideBow.volume.value = -12;

// Ride bell
const rideBell = new Tone.MetalSynth({
  frequency: 880,
  envelope: { attack: 0.0005, decay: 0.8, sustain: 0.1, release: 0.5 },
  harmonicity: 3,
  modulationIndex: 12,
  resonance: 4000,
  octaves: 1.5
}).connect(overheadComp);
rideBell.volume.value = -10;

// Crash cymbal
const crash = new Tone.MetalSynth({
  frequency: 250,
  envelope: { attack: 0.001, decay: 2.5, sustain: 0.03, release: 1.5 },
  harmonicity: 5.5,
  modulationIndex: 40,
  resonance: 3500,
  octaves: 2.5
}).connect(overheadComp);
crash.volume.value = -8;

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// Humanize timing and velocity
const h = (v, spread = 0.15) => v * (1 - spread/2 + Math.random() * spread);

// Play kick with all layers
const playKick = (t, v) => {
  const vel = h(v);
  kickBody.triggerAttackRelease("C1", "8n", t, vel);
  kickClick.triggerAttackRelease("C3", "32n", t, vel * 0.7);
  kickSub.triggerAttackRelease("C1", "8n", t + 0.002, vel * 0.8);
};

// Play snare with body and wires
const playSnare = (t, v, isRimshot = false) => {
  const vel = h(v);
  snareBody.triggerAttackRelease("E2", "16n", t, vel);
  snareWires.triggerAttackRelease("16n", t + 0.0005, vel);
  if (isRimshot) {
    rimshot.triggerAttackRelease("32n", t, vel * 0.5);
  }
};

// Ghost note (quiet snare)
const playGhost = (t, v) => {
  snareBody.triggerAttackRelease("E2", "32n", t, h(v * 0.3));
  snareWires.triggerAttackRelease("32n", t, h(v * 0.25));
};

// ─────────────────────────────────────────────────────────────
// Drum Pattern - Natural groove with fills
// ─────────────────────────────────────────────────────────────

// Kick pattern
const kickPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  const intensity = section === 0 ? 0.7 : section === 2 ? 1 : 0.85;
  playKick(t, v * intensity);
}, [
  // Bar 1-2: Basic groove
  0.95, null, null, null, null, null, 0.7, null, null, null, 0.85, null, null, null, null, null,
  0.95, null, null, null, null, null, 0.65, null, null, null, 0.8, null, 0.7, null, null, null,
  // Bar 3-4: Variation
  0.95, null, null, null, null, null, 0.7, null, null, null, null, null, 0.85, null, null, 0.6,
  0.95, null, null, 0.5, null, null, 0.7, null, null, null, 0.85, null, null, null, 0.6, null,
  // Bar 5-6: Busier
  0.98, null, null, null, null, null, 0.75, null, null, 0.5, 0.88, null, null, null, null, null,
  0.98, null, 0.55, null, null, null, 0.75, null, null, null, 0.88, null, 0.65, null, 0.55, null,
  // Bar 7-8: Fill setup
  0.92, null, null, null, null, null, null, null, null, null, 0.82, null, null, null, null, null,
  0.95, null, null, null, null, null, 0.7, null, null, null, null, null, 0.65, 0.7, 0.75, 0.8
], "16n").start(0);

// Snare pattern (backbeat + ghosts)
const snarePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (v === "g") {
    if (section > 0) playGhost(t, 0.4);
    return;
  }
  if (v === "r") {
    playSnare(t, section === 2 ? 1 : 0.85, true);
    return;
  }
  const intensity = section === 0 ? 0.75 : section === 2 ? 1 : 0.88;
  playSnare(t, v * intensity);
}, [
  // Bar 1-2: Basic with ghosts
  null, null, null, null, 0.95, null, null, "g", null, "g", null, null, 0.9, null, null, null,
  null, "g", null, null, 0.95, null, "g", null, null, null, "g", null, 0.9, null, "g", null,
  // Bar 3-4: More ghosts
  null, null, "g", null, 0.95, null, null, "g", null, "g", null, null, 0.92, null, "g", null,
  null, "g", null, "g", "r", null, "g", null, null, "g", null, null, 0.92, null, null, "g",
  // Bar 5-6: Driving
  null, "g", null, null, 0.98, null, "g", null, null, "g", null, "g", 0.95, null, null, null,
  null, null, "g", null, 0.98, null, null, "g", null, "g", null, null, "r", null, "g", null,
  // Bar 7-8: Fill
  null, null, null, null, 0.9, null, null, null, null, null, null, null, 0.85, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "16n").start(0);

// Hi-hat pattern
const hihatPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section === 0 && Math.random() > 0.7) return; // Sparse intro
  if (v === "o") {
    hihatOpen.triggerAttackRelease("32n", t, h(0.7));
  } else if (v === "p") {
    hihatPedal.triggerAttackRelease("32n", t, h(0.5));
  } else {
    hihatClosed.triggerAttackRelease("32n", t, h(v));
  }
}, [
  // Alternating dynamics
  0.8, 0.4, 0.6, 0.35, 0.75, 0.4, 0.55, 0.35, 0.8, 0.38, "o", 0.35, 0.7, 0.4, 0.58, 0.35,
  0.8, 0.42, 0.6, 0.38, 0.75, 0.4, 0.58, 0.35, 0.82, 0.4, 0.62, "o", 0.72, 0.38, "p", 0.35,
  0.82, 0.4, 0.58, 0.35, "o", 0.38, 0.55, 0.35, 0.78, 0.42, 0.6, 0.38, 0.75, 0.4, 0.58, "o",
  0.8, 0.38, 0.6, 0.35, 0.78, 0.42, 0.58, 0.38, "o", 0.4, 0.62, 0.35, 0.75, 0.38, "p", 0.35,
  0.85, 0.42, 0.62, 0.38, 0.8, 0.4, 0.58, 0.35, 0.82, 0.42, "o", 0.38, 0.78, 0.4, 0.6, 0.35,
  0.85, 0.4, 0.6, 0.38, 0.8, 0.42, 0.58, "o", 0.82, 0.4, 0.62, 0.38, "o", 0.38, "p", 0.35,
  0.78, 0.38, 0.58, 0.35, 0.75, 0.4, 0.55, 0.38, 0.72, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "16n").start(0);

// Tom fills (last bar of each 8-bar section)
const fillPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section !== 3 && Tone.Transport.position.split(":")[0] % 8 !== 7) return;

  const [drum, vel] = n;
  if (drum === "h") highTom.triggerAttackRelease("A2", "16n", t, h(vel));
  else if (drum === "m") midTom.triggerAttackRelease("E2", "16n", t, h(vel));
  else if (drum === "f") floorTom.triggerAttackRelease("C2", "16n", t, h(vel));
}, [
  null, null, null, null, null, null, null, null, null, null, null, null, [["h", 0.7]], [["h", 0.65]], [["m", 0.75]], [["m", 0.7]],
  [["f", 0.8]], null, [["f", 0.75]], null, [["f", 0.85]], null, null, null, null, null, null, null, null, null, null, null
], "16n").start(0);

// Crash on section changes
const crashPat = new Tone.Sequence((t, v) => {
  if (!v) return;
  crash.triggerAttackRelease("16n", t, h(v));
}, [
  0.9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.85, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.7
], "4n").start(0);

// Ride in later sections
const ridePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 2) return;
  if (v === "b") {
    rideBell.triggerAttackRelease("32n", t, h(0.65));
  } else {
    rideBow.triggerAttackRelease("32n", t, h(v));
  }
}, [
  0.6, null, 0.45, null, 0.55, null, 0.42, null, 0.58, null, "b", null, 0.52, null, 0.45, null,
  0.62, null, 0.48, null, 0.55, null, 0.45, null, "b", null, 0.5, null, 0.55, null, 0.42, null
], "8n").start(0);

// Snare rattle on kick hits (sympathetic)
const rattlePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1) return;
  snareRattle.triggerAttackRelease("32n", t + 0.01, h(v * 0.3));
}, [
  0.5, null, null, null, null, null, 0.4, null, null, null, 0.45, null, null, null, null, null,
  0.5, null, null, null, null, null, 0.4, null, null, null, 0.45, null, 0.4, null, null, null
], "16n").start(0);

Tone.Transport.start();`,
};
