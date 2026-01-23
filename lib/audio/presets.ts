/**
 * Demo song presets for different genres
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
// Midnight Lofi - Chill beats to code/relax to
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 82;
Tone.Transport.swing = 0.08;

// Effects
const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay("8n.", 0.38).connect(reverb);
delay.wet.value = 0.25;
const filter = new Tone.Filter(2200, "lowpass").connect(delay);
const chorus = new Tone.Chorus(3, 2.5, 0.4).connect(filter).start();

// Drums
const kick = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 5, envelope: { decay: 0.5 }}).toDestination();
kick.volume.value = -5;
const snare = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { decay: 0.18 }}).connect(reverb);
snare.volume.value = -9;
const hat = new Tone.MetalSynth({ envelope: { decay: 0.04 }, harmonicity: 5.1, resonance: 3500 }).toDestination();
hat.volume.value = -19;

// Rhodes chords
const rhodes = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 3, modulationIndex: 2, envelope: { attack: 0.01, decay: 0.8, sustain: 0.3, release: 1.2 }
}).connect(chorus);
rhodes.volume.value = -13;

// Bass
const bass = new Tone.MonoSynth({
  oscillator: { type: "triangle" },
  envelope: { attack: 0.03, decay: 0.25, sustain: 0.5, release: 0.6 },
  filterEnvelope: { attack: 0.04, decay: 0.15, sustain: 0.4, baseFrequency: 80, octaves: 2.5 }
}).toDestination();
bass.volume.value = -7;

// Arpeggio
const arp = new Tone.Synth({ envelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.6 }}).connect(delay);
arp.volume.value = -14;

// Patterns - Dm7 > G7 > Cmaj7 > Am7
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [0.95, null, null, 0.4, 0.9, null, 0.35, null], "8n").start(0);
const snarePat = new Tone.Sequence((t, v) => v && snare.triggerAttackRelease("16n", t, v),
  [null, null, 0.9, null, null, null, 0.85, 0.35], "8n").start(0);
const hatPat = new Tone.Sequence((t, v) => v && hat.triggerAttackRelease("32n", t, v),
  [0.6, 0.25, 0.5, 0.3, 0.55, 0.2, 0.7, 0.35], "8n").start(0);

const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "8n", t),
  ["D2", null, "D2", null, "G2", null, "G2", null, "C2", null, "C2", null, "A1", null, "A1", null], "8n").start(0);

const chordPat = new Tone.Sequence((t, c) => c && rhodes.triggerAttackRelease(c, "1n", t, 0.4), [
  ["D3", "F3", "A3", "C4"], null, null, null,
  ["G2", "B2", "D3", "F3"], null, null, null,
  ["C3", "E3", "G3", "B3"], null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null
], "2n").start(0);

const arpPat = new Tone.Sequence((t, n) => n && arp.triggerAttackRelease(n, "16n", t, 0.55), [
  "D4", "F4", "A4", "C5", "A4", "F4", "D4", "C4",
  "G4", "B4", "D5", "F5", "D5", "B4", "G4", "F4",
  "C4", "E4", "G4", "B4", "G4", "E4", "C4", "B3",
  "A3", "C4", "E4", "G4", "E4", "C4", "A3", "G3"
], "16n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'deep-house',
    name: 'Sunset Drive',
    genre: 'Deep House',
    bpm: 122,
    description: 'Groovy four-on-floor with warm pads and funky bass',
    code: `// ═══════════════════════════════════════════════════════════
// Sunset Drive - Deep House grooves
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 122;

// Effects
const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination();
const delay = new Tone.PingPongDelay("8n", 0.3).connect(reverb);
delay.wet.value = 0.2;
const filter = new Tone.Filter(3000, "lowpass").connect(delay);

// Drums
const kick = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 6, envelope: { decay: 0.3 }}).toDestination();
kick.volume.value = -4;
const clap = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.12 }}).connect(reverb);
clap.volume.value = -10;
const hatC = new Tone.MetalSynth({ envelope: { decay: 0.03 }, harmonicity: 5.1, resonance: 4000 }).toDestination();
hatC.volume.value = -18;
const hatO = new Tone.MetalSynth({ envelope: { decay: 0.1 }, harmonicity: 5.1, resonance: 3500 }).toDestination();
hatO.volume.value = -20;

// Bass
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 },
  filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, baseFrequency: 200, octaves: 3 }
}).toDestination();
bass.volume.value = -8;

// Chords
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 0.5, decay: 0.5, sustain: 0.6, release: 1 }
}).connect(filter);
pad.volume.value = -14;

// Stab
const stab = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(filter);
stab.volume.value = -12;

// Patterns - Four on the floor
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [1, null, null, null, 1, null, null, null], "8n").start(0);
const clapPat = new Tone.Sequence((t, v) => v && clap.triggerAttackRelease("8n", t, v),
  [null, null, 1, null, null, null, 1, null], "8n").start(0);
const hatPat = new Tone.Sequence((t, v) => {
  if (v > 0.8) hatO.triggerAttackRelease("32n", t, v * 0.5);
  else if (v) hatC.triggerAttackRelease("32n", t, v);
}, [0.5, 0.9, 0.5, 0.6, 0.5, 0.9, 0.5, 0.7], "8n").start(0);

// Fm - Bbm - Eb - Ab progression
const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "16n", t),
  ["F1", null, "F2", "F1", null, "Ab1", null, null,
   "Bb1", null, "Bb2", "Bb1", null, "Db2", null, null,
   "Eb1", null, "Eb2", "Eb1", null, "G1", null, null,
   "Ab1", null, "Ab2", "Ab1", null, "C2", null, null], "16n").start(0);

const padPat = new Tone.Sequence((t, c) => c && pad.triggerAttackRelease(c, "1n", t, 0.35), [
  ["F3", "Ab3", "C4"], null, null, null,
  ["Bb3", "Db4", "F4"], null, null, null,
  ["Eb3", "G3", "Bb3"], null, null, null,
  ["Ab3", "C4", "Eb4"], null, null, null
], "2n").start(0);

const stabPat = new Tone.Sequence((t, c) => c && stab.triggerAttackRelease(c, "16n", t, 0.6), [
  null, null, null, ["F4", "Ab4", "C5"], null, null, null, null,
  null, null, null, ["Bb4", "Db5", "F5"], null, null, null, null,
  null, null, null, ["Eb4", "G4", "Bb4"], null, null, null, null,
  null, null, null, ["Ab4", "C5", "Eb5"], null, null, null, null
], "16n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'dark-techno',
    name: 'Warehouse',
    genre: 'Techno',
    bpm: 132,
    description: 'Hypnotic dark techno with industrial textures',
    code: `// ═══════════════════════════════════════════════════════════
// Warehouse - Dark Techno
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 132;

// Effects
const reverb = new Tone.Reverb({ decay: 4, wet: 0.2 }).toDestination();
const delay = new Tone.FeedbackDelay("8n.", 0.35).connect(reverb);
delay.wet.value = 0.15;
const distortion = new Tone.Distortion(0.3).toDestination();
const filter = new Tone.Filter(1500, "lowpass").connect(delay);

// Kick - punchy and industrial
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.015, octaves: 8, envelope: { attack: 0.001, decay: 0.25, sustain: 0 }
}).connect(distortion);
kick.volume.value = -3;

// Clap with reverb
const clap = new Tone.NoiseSynth({
  noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(reverb);
clap.volume.value = -12;

// Hi-hats
const hat = new Tone.MetalSynth({
  envelope: { decay: 0.025 }, harmonicity: 5.1, modulationIndex: 40, resonance: 5000, octaves: 1
}).toDestination();
hat.volume.value = -20;

// Acid bass
const bass = new Tone.MonoSynth({
  oscillator: { type: "sawtooth" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0.2, release: 0.1 },
  filterEnvelope: { attack: 0.001, decay: 0.08, sustain: 0.1, baseFrequency: 150, octaves: 4 }
}).connect(filter);
bass.volume.value = -9;

// Dark pad
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sawtooth" },
  envelope: { attack: 2, decay: 2, sustain: 0.5, release: 3 }
}).connect(reverb);
pad.volume.value = -22;

// Stab synth
const stab = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
}).connect(delay);
stab.volume.value = -14;

// Patterns
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C0", "16n", t, v),
  [1, null, null, null, 1, null, null, null, 1, null, null, null, 1, null, null, 0.7], "16n").start(0);

const clapPat = new Tone.Sequence((t, v) => v && clap.triggerAttackRelease("16n", t, v),
  [null, null, null, null, 1, null, null, null, null, null, null, null, 1, null, null, null], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => v && hat.triggerAttackRelease("32n", t, v),
  [0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4, 0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.5], "16n").start(0);

// Minor key - Am
const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "16n", t),
  ["A1", null, "A1", "A2", null, "A1", null, "G1",
   "A1", null, "A1", "C2", null, "A1", null, "E1"], "16n").start(0);

const padPat = new Tone.Sequence((t, c) => c && pad.triggerAttackRelease(c, "1m", t, 0.2), [
  ["A2", "C3", "E3"], null, null, null, null, null, null, null,
  ["F2", "A2", "C3"], null, null, null, null, null, null, null
], "2n").start(0);

const stabPat = new Tone.Sequence((t, n) => n && stab.triggerAttackRelease(n, "32n", t, 0.7), [
  null, null, null, "A4", null, null, null, null,
  null, null, null, null, null, null, "E4", null,
  null, null, null, "A4", null, null, null, null,
  null, null, null, null, "C5", null, null, null
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
// Floating - Ambient Soundscape
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 70;

// Effects - lots of space
const reverb = new Tone.Reverb({ decay: 8, wet: 0.6 }).toDestination();
const delay = new Tone.FeedbackDelay("4n.", 0.5).connect(reverb);
delay.wet.value = 0.4;
const chorus = new Tone.Chorus(0.5, 5, 0.5).connect(delay).start();
const filter = new Tone.Filter(2000, "lowpass").connect(chorus);

// Soft pulse
const pulse = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 2 }
}).connect(filter);
pulse.volume.value = -16;

// Warm pad
const pad = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 3, decay: 2, sustain: 0.8, release: 5 }
}).connect(reverb);
pad.volume.value = -18;

// High shimmer
const shimmer = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.01, decay: 2, sustain: 0, release: 3 }
}).connect(delay);
shimmer.volume.value = -22;

// Sub bass
const sub = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 1, decay: 2, sustain: 0.5, release: 3 }
}).toDestination();
sub.volume.value = -12;

// Bell
const bell = new Tone.FMSynth({
  harmonicity: 8, modulationIndex: 2,
  envelope: { attack: 0.01, decay: 3, sustain: 0, release: 2 }
}).connect(delay);
bell.volume.value = -20;

// Patterns - Cmaj7 / Fmaj7 / Am7 / Gmaj7
const pulsePat = new Tone.Sequence((t, n) => n && pulse.triggerAttackRelease(n, "2n", t, 0.4), [
  "C4", null, null, null, "E4", null, null, null,
  "F4", null, null, null, "A4", null, null, null,
  "A3", null, null, null, "C4", null, null, null,
  "G3", null, null, null, "B3", null, null, null
], "4n").start(0);

const padPat = new Tone.Sequence((t, c) => c && pad.triggerAttackRelease(c, "1m", t, 0.25), [
  ["C3", "E3", "G3", "B3"], null, null, null, null, null, null, null,
  ["F3", "A3", "C4", "E4"], null, null, null, null, null, null, null,
  ["A2", "C3", "E3", "G3"], null, null, null, null, null, null, null,
  ["G2", "B2", "D3", "F#3"], null, null, null, null, null, null, null
], "2n").start(0);

const subPat = new Tone.Sequence((t, n) => n && sub.triggerAttackRelease(n, "1m", t, 0.5), [
  "C1", null, null, null, null, null, null, null,
  "F1", null, null, null, null, null, null, null,
  "A0", null, null, null, null, null, null, null,
  "G1", null, null, null, null, null, null, null
], "2n").start(0);

const shimmerPat = new Tone.Sequence((t, n) => n && shimmer.triggerAttackRelease(n, "8n", t, 0.3), [
  null, null, "G5", null, null, null, null, null,
  null, null, null, null, "C6", null, null, null,
  null, null, null, "E5", null, null, null, null,
  null, null, null, null, null, null, "B5", null
], "8n").start(0);

const bellPat = new Tone.Sequence((t, n) => n && bell.triggerAttackRelease(n, "8n", t, 0.25), [
  "C6", null, null, null, null, null, null, null,
  null, null, null, null, "A5", null, null, null,
  null, null, null, null, null, null, null, null,
  "G5", null, null, null, null, null, null, null
], "4n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'rnb-soul',
    name: 'Velvet',
    genre: 'R&B / Neo-Soul',
    bpm: 75,
    description: 'Smooth R&B with silky chords and laid-back groove',
    code: `// ═══════════════════════════════════════════════════════════
// Velvet - R&B / Neo-Soul
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 75;
Tone.Transport.swing = 0.1;

// Effects
const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination();
const delay = new Tone.FeedbackDelay("8n", 0.25).connect(reverb);
delay.wet.value = 0.15;
const chorus = new Tone.Chorus(2, 3.5, 0.3).connect(delay).start();

// Drums - soft and bouncy
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.1, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0 }
}).toDestination();
kick.volume.value = -6;

const snare = new Tone.NoiseSynth({
  noise: { type: "pink" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.15 }
}).connect(reverb);
snare.volume.value = -10;

const hat = new Tone.MetalSynth({
  envelope: { decay: 0.04 }, harmonicity: 5.1, resonance: 3000, octaves: 1
}).toDestination();
hat.volume.value = -20;

// Electric piano
const epiano = new Tone.PolySynth(Tone.FMSynth, {
  harmonicity: 2, modulationIndex: 1.5,
  envelope: { attack: 0.01, decay: 1, sustain: 0.4, release: 1.5 }
}).connect(chorus);
epiano.volume.value = -11;

// Bass - smooth and round
const bass = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
  filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, baseFrequency: 100, octaves: 2 }
}).toDestination();
bass.volume.value = -8;

// Lead
const lead = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.8 }
}).connect(delay);
lead.volume.value = -14;

// Patterns - Bbmaj9 / Ebmaj9 / Abmaj7 / Gm7
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [0.9, null, null, 0.5, null, null, 0.85, null, null, 0.4, 0.9, null, null, null, 0.5, null], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => v && snare.triggerAttackRelease("16n", t, v),
  [null, null, null, null, 0.85, null, null, 0.3, null, null, null, null, 0.9, null, null, null], "16n").start(0);

const hatPat = new Tone.Sequence((t, v) => v && hat.triggerAttackRelease("32n", t, v),
  [0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.45, 0.3, 0.5, 0.2, 0.4, 0.25, 0.5, 0.2, 0.5, 0.35], "16n").start(0);

const bassPat = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "8n", t),
  ["Bb1", null, "Bb1", null, "D2", null, null, null,
   "Eb2", null, "Eb2", null, "G2", null, null, null,
   "Ab1", null, "Ab1", null, "C2", null, null, null,
   "G1", null, "G1", null, "Bb1", null, null, null], "8n").start(0);

const chordPat = new Tone.Sequence((t, c) => c && epiano.triggerAttackRelease(c, "2n", t, 0.4), [
  ["Bb3", "D4", "F4", "A4", "C5"], null, null, null,
  ["Eb3", "G3", "Bb3", "D4", "F4"], null, null, null,
  ["Ab3", "C4", "Eb4", "G4"], null, null, null,
  ["G3", "Bb3", "D4", "F4"], null, null, null
], "2n").start(0);

const leadPat = new Tone.Sequence((t, n) => n && lead.triggerAttackRelease(n, "8n", t, 0.5), [
  null, null, null, null, null, null, "D5", "C5",
  "Bb4", null, null, null, null, null, null, null,
  null, null, null, null, "Eb5", null, "C5", null,
  "Bb4", null, "G4", null, null, null, null, null
], "8n").start(0);

Tone.Transport.start();`
  },
  {
    id: 'trap-beat',
    name: 'Midnight Trap',
    genre: 'Trap',
    bpm: 140,
    description: 'Hard-hitting 808s with rapid hi-hats',
    code: `// ═══════════════════════════════════════════════════════════
// Midnight Trap - Heavy 808s and rapid hats
// ═══════════════════════════════════════════════════════════

Tone.Transport.bpm.value = 140;

// Effects
const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.15 }).toDestination();
const delay = new Tone.PingPongDelay("8n", 0.2).connect(reverb);
delay.wet.value = 0.1;

// 808 kick with long decay
const kick = new Tone.MembraneSynth({
  pitchDecay: 0.08, octaves: 6,
  envelope: { attack: 0.001, decay: 0.8, sustain: 0.1, release: 0.5 }
}).toDestination();
kick.volume.value = -2;

// Snare/clap
const snare = new Tone.NoiseSynth({
  noise: { type: "white" },
  envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
}).connect(reverb);
snare.volume.value = -8;

// Hi-hats
const hatC = new Tone.MetalSynth({
  envelope: { decay: 0.02 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4500
}).toDestination();
hatC.volume.value = -16;

const hatO = new Tone.MetalSynth({
  envelope: { decay: 0.08 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000
}).toDestination();
hatO.volume.value = -18;

// 808 bass
const bass808 = new Tone.MonoSynth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.001, decay: 0.5, sustain: 0.4, release: 0.3 },
  filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.3, baseFrequency: 60, octaves: 2 }
}).toDestination();
bass808.volume.value = -4;

// Lead synth
const lead = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
}).connect(delay);
lead.volume.value = -12;

// Patterns - half-time feel
const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "4n", t, v),
  [1, null, null, null, null, null, null, null,
   null, null, null, null, 0.8, null, null, null], "16n").start(0);

const snarePat = new Tone.Sequence((t, v) => v && snare.triggerAttackRelease("8n", t, v),
  [null, null, null, null, 1, null, null, null,
   null, null, null, null, 1, null, null, 0.5], "16n").start(0);

// Rapid hi-hat pattern with rolls
const hatPat = new Tone.Sequence((t, v) => {
  if (v > 0.8) hatO.triggerAttackRelease("32n", t, v * 0.5);
  else if (v) hatC.triggerAttackRelease("32n", t, v);
}, [0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.4,
    0.7, 0.3, 0.5, 0.3, 0.9, 0.5, 0.6, 0.7], "16n").start(0);

// Minor key bass - Dm
const bassPat = new Tone.Sequence((t, n) => n && bass808.triggerAttackRelease(n, "4n", t),
  ["D1", null, null, null, null, null, null, null,
   null, null, null, "F1", null, null, "D1", null], "16n").start(0);

const leadPat = new Tone.Sequence((t, n) => n && lead.triggerAttackRelease(n, "16n", t, 0.6), [
  null, null, null, null, null, null, null, null,
  "D5", null, "F5", null, "A5", null, "D5", null,
  null, null, null, null, null, null, null, null,
  "A4", null, "D5", null, "C5", null, "A4", null
], "16n").start(0);

Tone.Transport.start();`
  }
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find(p => p.id === id);
}
