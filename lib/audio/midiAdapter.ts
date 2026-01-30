/**
 * MIDI to Tone.js adapter
 * Bridges Web MIDI events to Tone.js instruments
 */

import type { MIDINoteEvent, MIDICCEvent } from "@/lib/hooks/useMIDI";
import { midiToNoteName } from "@/lib/hooks/useMIDI";

/**
 * Common CC numbers and their typical mappings
 */
export const COMMON_CC = {
  MOD_WHEEL: 1,
  BREATH: 2,
  VOLUME: 7,
  PAN: 10,
  EXPRESSION: 11,
  SUSTAIN: 64,
  PORTAMENTO: 65,
  SOFT_PEDAL: 67,
  LEGATO: 68,
  ALL_NOTES_OFF: 123,
} as const;

/**
 * Tweak parameter to CC number mapping
 */
export const CC_TO_TWEAK: Record<number, string> = {
  1: "reverbMix", // Mod wheel → Reverb
  7: "masterVolume", // Volume CC → Master Volume
  71: "delayFeedback", // Resonance → Delay feedback
  74: "filterCutoff", // Cutoff → Filter cutoff
} as const;

/**
 * Interface for Tone.js instruments that can receive MIDI
 * Most Tone.js synths implement triggerAttack/triggerRelease
 */
export interface MIDIPlayableInstrument {
  triggerAttack: (note: string | number, time?: number, velocity?: number) => void;
  triggerRelease: (note?: string | number | string[], time?: number) => void;
}

/**
 * Type guard to check if an object is a MIDI-playable instrument
 */
export function isMIDIPlayable(obj: unknown): obj is MIDIPlayableInstrument {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "triggerAttack" in obj &&
    "triggerRelease" in obj &&
    typeof (obj as MIDIPlayableInstrument).triggerAttack === "function" &&
    typeof (obj as MIDIPlayableInstrument).triggerRelease === "function"
  );
}

/**
 * Create a MIDI note handler for a Tone.js instrument
 */
export function createNoteHandler(instrument: MIDIPlayableInstrument) {
  // Track currently held notes for proper release
  const heldNotes = new Set<string>();

  return (event: MIDINoteEvent) => {
    const noteName = midiToNoteName(event.note);

    if (event.type === "noteon") {
      // Trigger attack with velocity
      instrument.triggerAttack(noteName, undefined, event.velocity);
      heldNotes.add(noteName);
    } else {
      // Trigger release
      if (heldNotes.has(noteName)) {
        instrument.triggerRelease(noteName);
        heldNotes.delete(noteName);
      }
    }
  };
}

/**
 * Create a MIDI CC handler for tweaks
 */
export function createCCHandler(
  onTweakChange: (param: string, value: number) => void,
  customMapping?: Record<number, string>
) {
  const mapping = { ...CC_TO_TWEAK, ...customMapping };

  return (event: MIDICCEvent) => {
    const tweakParam = mapping[event.controller];
    if (tweakParam) {
      // Scale CC value (0-1) to appropriate range based on parameter
      // Most tweaks use 0-100 scale
      const scaledValue = event.value * 100;
      onTweakChange(tweakParam, scaledValue);
    }
  };
}

/**
 * MIDI adapter class for more complex setups
 */
export class MIDIAdapter {
  private instruments: Map<number, MIDIPlayableInstrument> = new Map();
  private ccHandler: ((event: MIDICCEvent) => void) | null = null;
  private heldNotes: Map<number, Set<string>> = new Map();

  /**
   * Set an instrument for a specific MIDI channel
   * @param channel MIDI channel (0-15)
   * @param instrument Tone.js instrument
   */
  setInstrument(channel: number, instrument: MIDIPlayableInstrument): void {
    this.instruments.set(channel, instrument);
    this.heldNotes.set(channel, new Set());
  }

  /**
   * Set a global instrument that responds to all channels
   */
  setGlobalInstrument(instrument: MIDIPlayableInstrument): void {
    // Channel -1 represents "all channels"
    this.instruments.set(-1, instrument);
    this.heldNotes.set(-1, new Set());
  }

  /**
   * Remove instrument from a channel
   */
  removeInstrument(channel: number): void {
    this.instruments.delete(channel);
    this.heldNotes.delete(channel);
  }

  /**
   * Set CC handler
   */
  setCCHandler(handler: (event: MIDICCEvent) => void): void {
    this.ccHandler = handler;
  }

  /**
   * Handle a MIDI note event
   */
  handleNote(event: MIDINoteEvent): void {
    // Try channel-specific instrument first, then global
    const instrument = this.instruments.get(event.channel) || this.instruments.get(-1);
    if (!instrument) return;

    const channelKey = this.instruments.has(event.channel) ? event.channel : -1;
    const held = this.heldNotes.get(channelKey) || new Set();
    const noteName = midiToNoteName(event.note);

    if (event.type === "noteon") {
      instrument.triggerAttack(noteName, undefined, event.velocity);
      held.add(noteName);
    } else {
      if (held.has(noteName)) {
        instrument.triggerRelease(noteName);
        held.delete(noteName);
      }
    }
  }

  /**
   * Handle a MIDI CC event
   */
  handleCC(event: MIDICCEvent): void {
    // Handle All Notes Off
    if (event.controller === COMMON_CC.ALL_NOTES_OFF) {
      this.releaseAll();
      return;
    }

    // Handle sustain pedal
    if (event.controller === COMMON_CC.SUSTAIN) {
      // Sustain pedal off (value < 0.5) releases all notes
      if (event.value < 0.5) {
        this.releaseAll();
      }
      return;
    }

    // Pass to custom handler
    if (this.ccHandler) {
      this.ccHandler(event);
    }
  }

  /**
   * Release all held notes on all instruments
   */
  releaseAll(): void {
    this.instruments.forEach((instrument, channel) => {
      const held = this.heldNotes.get(channel);
      if (held && held.size > 0) {
        held.forEach((note) => {
          instrument.triggerRelease(note);
        });
        held.clear();
      }
    });
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.releaseAll();
    this.instruments.clear();
    this.heldNotes.clear();
    this.ccHandler = null;
  }
}
