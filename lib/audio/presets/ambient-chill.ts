import { Preset } from './types';

export const ambientChill: Preset = {
  id: 'ambient-chill',
  name: 'Floating',
  genre: 'Ambient',
  bpm: 70,
  description: 'Ethereal soundscapes with gentle pulses',
  code: `// ═══════════════════════════════════════════════════════════
// Floating - 32-bar Ambient Soundscape
// Sections: A(sparse) B(build) C(full) D(fade)
// Key: Cmaj7 / Fmaj7 / Am7 / Gmaj7
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 70;

// ─────────────────────────────────────────────────────────────
// Master Chain - huge space and shimmer
// ─────────────────────────────────────────────────────────────
const limiter = new Tone.Limiter(-4).toDestination();
const masterComp = new Tone.Compressor({ threshold: -24, ratio: 2, attack: 0.3, release: 0.5 }).connect(limiter);
const hugeReverb = new Tone.Reverb({ decay: 12, wet: 0.6 }).connect(masterComp);
const shimmerDelay = new Tone.FeedbackDelay("4n.", 0.6).connect(hugeReverb);
shimmerDelay.wet.value = 0.45;
const secondDelay = new Tone.FeedbackDelay("2n", 0.4).connect(shimmerDelay);
secondDelay.wet.value = 0.3;
const dreamChorus = new Tone.Chorus(0.5, 5, 0.6).connect(secondDelay).start();
const warmFilter = new Tone.Filter(4000, "lowpass").connect(dreamChorus);
const phaser = new Tone.Phaser({ frequency: 0.2, octaves: 3, baseFrequency: 800 }).connect(warmFilter);

// Helper: get current section (0=A, 1=B, 2=C, 3=D)
const getSection = () => Math.floor((Tone.Transport.position.split(":")[0] % 32) / 8);

// ─────────────────────────────────────────────────────────────
// Soft Pulse - gentle rhythmic element
// ─────────────────────────────────────────────────────────────
const pulseFilter = new Tone.Filter(2000, "lowpass").connect(warmFilter);
const pulse = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 2 }
}).connect(pulseFilter);
pulse.volume.value = -16;

const pulseLayer = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.8, decay: 1.5, sustain: 0.2, release: 2.5 }
}).connect(shimmerDelay);
pulseLayer.volume.value = -20;

const pulsePat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  const vel = section === 2 ? 0.5 : section === 0 ? 0.25 : section === 3 ? 0.3 : 0.4;
  pulse.triggerAttackRelease(n, "2n", t, vel);
}, [
  "C4", null, null, null, "E4", null, null, null, "G4", null, null, null, "B3", null, null, null,
  "C4", null, null, null, "E4", null, null, null, "G4", null, null, null, "C5", null, null, null,
  "F4", null, null, null, "A4", null, null, null, "C5", null, null, null, "E4", null, null, null,
  "F4", null, null, null, "A4", null, null, null, "C5", null, null, null, "F5", null, null, null,
  "A3", null, null, null, "C4", null, null, null, "E4", null, null, null, "G4", null, null, null,
  "A3", null, null, null, "C4", null, null, null, "E4", null, null, null, "A4", null, null, null,
  "G3", null, null, null, "B3", null, null, null, "D4", null, null, null, "F#4", null, null, null,
  "G3", null, null, null, "B3", null, null, null, "D4", null, null, null, "G4", null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Warm Pad - Cmaj7 / Fmaj7 / Am7 / Gmaj7 with layers
// ─────────────────────────────────────────────────────────────
const padFilter = new Tone.Filter(1500, "lowpass").connect(hugeReverb);
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 4, decay: 3, sustain: 0.8, release: 6 }
}).connect(padFilter);
pad.volume.value = -18;

const padLayerFilter = new Tone.Filter(2500, "lowpass").connect(phaser);
const padLayer = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 5, decay: 4, sustain: 0.6, release: 8 }
}).connect(padLayerFilter);
padLayer.volume.value = -22;

const padPat = new Tone.Sequence((t, c) => {
  if (!c) return;
  const section = getSection();
  const vel = section === 2 ? 0.4 : section === 0 ? 0.15 : 0.28;
  pad.triggerAttackRelease(c, "1m", t, vel);
  // Add layer in fuller sections
  if (section >= 1) {
    padLayer.triggerAttackRelease(c, "1m", t + 0.5, vel * 0.5);
  }
}, [
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Sub Bass - deep foundation
// ─────────────────────────────────────────────────────────────
const subFilter = new Tone.Filter(200, "lowpass").connect(masterComp);
const sub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 1.5, decay: 2, sustain: 0.6, release: 4 }
}).connect(subFilter);
sub.volume.value = -12;

const subPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0) return;
  const vel = section === 2 ? 0.6 : 0.45;
  sub.triggerAttackRelease(n, "1m", t, vel);
}, [
  "C1", null, null, null, null, null, null, null,
  "C1", null, null, null, null, null, null, null,
  "F1", null, null, null, null, null, null, null,
  "F1", null, null, null, null, null, null, null,
  "A0", null, null, null, null, null, null, null,
  "A0", null, null, null, null, null, null, null,
  "G1", null, null, null, null, null, null, null,
  "G1", null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// High Shimmer - sparkling texture
// ─────────────────────────────────────────────────────────────
const shimmerFilter = new Tone.Filter(6000, "lowpass").connect(shimmerDelay);
const shimmer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 2.5, sustain: 0, release: 3.5 }
}).connect(shimmerFilter);
shimmer.volume.value = -22;

const shimmer2 = new Tone.Synth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 3, sustain: 0, release: 4 }
}).connect(shimmerFilter);
shimmer2.volume.value = -25;

const shimmerPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  shimmer.triggerAttackRelease(n, "8n", t, 0.3);
}, [
  null, null, "G5", null, null, null, null, null, null, null, null, null, "C6", null, null, null,
  null, null, null, null, null, null, "E5", null, null, null, null, null, null, null, "B5", null,
  null, null, null, "E5", null, null, null, null, null, null, "A5", null, null, null, null, null,
  null, null, null, null, "C5", null, null, null, null, null, null, null, "F5", null, null, null,
  null, null, null, null, null, null, null, "E5", null, null, null, null, null, null, "G5", null,
  null, null, "C5", null, null, null, null, null, null, null, null, null, "A5", null, null, null,
  null, null, null, null, null, null, "B5", null, null, null, null, null, "D5", null, null, null,
  null, null, null, null, "F#5", null, null, null, null, null, null, null, null, null, "G5", null
], "8n").start(0);

// ─────────────────────────────────────────────────────────────
// Bell - crystalline accents
// ─────────────────────────────────────────────────────────────
const bellFilter = new Tone.Filter(5000, "lowpass").connect(shimmerDelay);
const bell = new Tone.FMSynth({
  harmonicity: 8, modulationIndex: 2,
  envelope: { attack: 0.01, decay: 4, sustain: 0, release: 3 }
}).connect(bellFilter);
bell.volume.value = -20;

const bellLayer = new Tone.FMSynth({
  harmonicity: 12, modulationIndex: 3,
  envelope: { attack: 0.01, decay: 5, sustain: 0, release: 4 }
}).connect(bellFilter);
bellLayer.volume.value = -24;

const bellPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 3) return;
  const vel = section === 2 ? 0.38 : 0.25;
  bell.triggerAttackRelease(n, "8n", t, vel);
}, [
  "C6", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "E6", null, null, null,
  null, null, null, null, "A5", null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "C6", null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, "E5", null, null, null,
  null, null, null, null, null, null, null, null, "A5", null, null, null, null, null, null, null,
  "G5", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, "B5", null, null, null, null, null, null, null
], "4n").start(0);

// ─────────────────────────────────────────────────────────────
// Texture - noise swells and atmosphere
// ─────────────────────────────────────────────────────────────
const textureFilter = new Tone.Filter(800, "lowpass").connect(hugeReverb);
const texture = new Tone.NoiseSynth({
  noise: { type: "pink" },
  envelope: { attack: 4, decay: 3, sustain: 0.3, release: 5 }
}).connect(textureFilter);
texture.volume.value = -28;

const textureHighFilter = new Tone.Filter(3000, "highpass").connect(shimmerDelay);
const textureHigh = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 5, decay: 4, sustain: 0.2, release: 6 }
}).connect(textureHighFilter);
textureHigh.volume.value = -32;

const texturePat = new Tone.Sequence((t, v) => {
  if (!v) return;
  const section = getSection();
  if (section < 1) return;
  texture.triggerAttackRelease("2m", t, v);
  if (section === 2) {
    textureHigh.triggerAttackRelease("2m", t + 1, v * 0.5);
  }
}, [
  0.3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  0.35, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
], "2n").start(0);

// ─────────────────────────────────────────────────────────────
// Arpeggio - gentle movement
// ─────────────────────────────────────────────────────────────
const arpFilter = new Tone.Filter(3000, "lowpass").connect(secondDelay);
const arp = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.05, decay: 0.8, sustain: 0.2, release: 1.5 }
}).connect(arpFilter);
arp.volume.value = -20;

const arpPat = new Tone.Sequence((t, n) => {
  if (!n) return;
  const section = getSection();
  if (section === 0 || section === 3) return;
  arp.triggerAttackRelease(n, "8n", t, 0.42);
}, [
  null, null, "C4", null, "E4", null, "G4", null, "B4", null, "G4", null, "E4", null, "C4", null,
  null, null, null, null, "C4", null, "E4", null, "G4", null, "C5", null, "B4", null, "G4", null,
  null, null, "F4", null, "A4", null, "C5", null, "E5", null, "C5", null, "A4", null, "F4", null,
  null, null, null, null, "F4", null, "A4", null, "C5", null, "F5", null, "E5", null, "C5", null,
  null, null, "A3", null, "C4", null, "E4", null, "G4", null, "E4", null, "C4", null, "A3", null,
  null, null, null, null, "A3", null, "C4", null, "E4", null, "A4", null, "G4", null, "E4", null,
  null, null, "G3", null, "B3", null, "D4", null, "F#4", null, "D4", null, "B3", null, "G3", null,
  null, null, null, null, "G3", null, "B3", null, "D4", null, "G4", null, "F#4", null, "D4", null
], "8n").start(0);

Tone.Transport.start();`
};
