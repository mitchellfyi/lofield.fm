/**
 * Code generator for step sequencer
 * Converts grid state to Tone.js Sequence code
 */

export interface SequencerStep {
  active: boolean;
  velocity: number; // 0-1
}

export interface SequencerTrack {
  id: string;
  name: string;
  steps: SequencerStep[];
  sound: DrumSound;
}

export type DrumSound = "kick" | "snare" | "hihat" | "clap" | "tom" | "rim" | "shaker" | "crash";

/**
 * Drum sound definitions - mapping to Tone.js synth configuration
 */
export const DRUM_SOUNDS: Record<
  DrumSound,
  {
    label: string;
    synthType: string;
    config: string;
  }
> = {
  kick: {
    label: "Kick",
    synthType: "MembraneSynth",
    config: `{ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 } }`,
  },
  snare: {
    label: "Snare",
    synthType: "NoiseSynth",
    config: `{ noise: { type: "brown" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.15 } }`,
  },
  hihat: {
    label: "Hi-Hat",
    synthType: "MetalSynth",
    config: `{ frequency: 250, envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 3.5, modulationIndex: 20, resonance: 1800, octaves: 1 }`,
  },
  clap: {
    label: "Clap",
    synthType: "NoiseSynth",
    config: `{ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 } }`,
  },
  tom: {
    label: "Tom",
    synthType: "MembraneSynth",
    config: `{ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.3, sustain: 0.02, release: 0.3 } }`,
  },
  rim: {
    label: "Rim",
    synthType: "MetalSynth",
    config: `{ frequency: 800, envelope: { attack: 0.001, decay: 0.03, release: 0.01 }, harmonicity: 2, modulationIndex: 10, resonance: 2000, octaves: 0.5 }`,
  },
  shaker: {
    label: "Shaker",
    synthType: "NoiseSynth",
    config: `{ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 } }`,
  },
  crash: {
    label: "Crash",
    synthType: "MetalSynth",
    config: `{ frequency: 200, envelope: { attack: 0.001, decay: 0.5, release: 0.3 }, harmonicity: 5, modulationIndex: 40, resonance: 800, octaves: 2 }`,
  },
};

/**
 * Default note for each drum sound
 */
export const DRUM_NOTES: Record<DrumSound, string> = {
  kick: "C1",
  snare: "16n",
  hihat: "32n",
  clap: "16n",
  tom: "G1",
  rim: "32n",
  shaker: "32n",
  crash: "8n",
};

/**
 * Create default empty steps
 */
export function createEmptySteps(count: number): SequencerStep[] {
  return Array.from({ length: count }, () => ({
    active: false,
    velocity: 0.8,
  }));
}

/**
 * Create a new sequencer track
 */
export function createTrack(sound: DrumSound, stepCount: number): SequencerTrack {
  return {
    id: `${sound}-${Date.now()}`,
    name: DRUM_SOUNDS[sound].label,
    steps: createEmptySteps(stepCount),
    sound,
  };
}

/**
 * Create default drum kit tracks
 */
export function createDefaultTracks(stepCount = 16): SequencerTrack[] {
  return [
    createTrack("kick", stepCount),
    createTrack("snare", stepCount),
    createTrack("hihat", stepCount),
    createTrack("clap", stepCount),
  ];
}

/**
 * Generate Tone.js code from sequencer tracks
 */
export function generateSequencerCode(
  tracks: SequencerTrack[],
  bpm = 120,
  subdivision: "16n" | "8n" = "16n"
): string {
  const lines: string[] = [];

  // Header comment
  lines.push("// ═══════════════════════════════════════════════════════════");
  lines.push("// Generated Drum Pattern");
  lines.push("// ═══════════════════════════════════════════════════════════");
  lines.push("");

  // BPM
  lines.push(`Tone.Transport.bpm.value = ${bpm};`);
  lines.push("");

  // Master chain
  lines.push("// Master Chain");
  lines.push("const limiter = new Tone.Limiter(-3).toDestination();");
  lines.push(
    "const masterComp = new Tone.Compressor({ threshold: -20, ratio: 3, attack: 0.1, release: 0.25 }).connect(limiter);"
  );
  lines.push("");

  // Generate synths for each unique sound type
  const usedSounds = new Set(
    tracks.filter((t) => t.steps.some((s) => s.active)).map((t) => t.sound)
  );

  lines.push("// Drum Sounds");
  usedSounds.forEach((sound) => {
    const def = DRUM_SOUNDS[sound];
    const varName = sound;
    lines.push(`const ${varName} = new Tone.${def.synthType}(${def.config}).connect(masterComp);`);
    lines.push(`${varName}.volume.value = -8;`);
  });
  lines.push("");

  // Generate sequence for each track
  lines.push("// Sequences");
  tracks.forEach((track, trackIndex) => {
    if (!track.steps.some((s) => s.active)) return;

    const pattern = track.steps.map((step) => {
      if (!step.active) return "null";
      // Round velocity to 2 decimal places
      return step.velocity.toFixed(2);
    });

    const seqName = `${track.sound}Seq${trackIndex > 0 ? trackIndex : ""}`;
    const note = DRUM_NOTES[track.sound];

    // For NoiseSynth, we use triggerAttackRelease with duration only
    const isNoiseSynth = DRUM_SOUNDS[track.sound].synthType === "NoiseSynth";

    if (isNoiseSynth) {
      lines.push(`const ${seqName} = new Tone.Sequence((t, v) => {`);
      lines.push(`  if (v === null) return;`);
      lines.push(`  ${track.sound}.triggerAttackRelease("${note}", t, v);`);
      lines.push(`}, [${pattern.join(", ")}], "${subdivision}").start(0);`);
    } else {
      lines.push(`const ${seqName} = new Tone.Sequence((t, v) => {`);
      lines.push(`  if (v === null) return;`);
      lines.push(`  ${track.sound}.triggerAttackRelease("${note}", "${note}", t, v);`);
      lines.push(`}, [${pattern.join(", ")}], "${subdivision}").start(0);`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * Validate sequencer tracks
 */
export function validateTracks(tracks: SequencerTrack[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tracks.length === 0) {
    errors.push("At least one track is required");
  }

  tracks.forEach((track, i) => {
    if (!track.id) errors.push(`Track ${i + 1} is missing an ID`);
    if (!track.name) errors.push(`Track ${i + 1} is missing a name`);
    if (!track.steps || track.steps.length === 0) {
      errors.push(`Track ${i + 1} has no steps`);
    }
    if (!DRUM_SOUNDS[track.sound]) {
      errors.push(`Track ${i + 1} has invalid sound type: ${track.sound}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
