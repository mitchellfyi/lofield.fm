/**
 * VisualizationBridge - Singleton coordinating Tone.js state with React
 *
 * Provides:
 * - Transport state polling via requestAnimationFrame (60fps)
 * - Trigger event queue for line highlighting
 * - React subscriptions via useSyncExternalStore pattern
 */

import * as Tone from 'tone';

export interface TransportState {
  position: string;      // "0:0:0" format (bar:beat:sixteenth)
  seconds: number;       // Absolute time in seconds
  bpm: number;
  playing: boolean;
  bar: number;           // Current bar (1-indexed for display)
  beat: number;          // Current beat within bar (1-4)
  progress: number;      // 0-1 progress within current bar
}

export interface TriggerEvent {
  line: number;          // Source code line (1-indexed)
  time: number;          // Performance.now() timestamp when triggered
  note?: string;         // Note name if applicable
  type: 'note' | 'chord' | 'rest' | 'effect';
}

declare global {
  interface Window {
    __vizTrigger?: (line: number, note?: string | null, type?: string) => void;
  }
}

const DEFAULT_TRANSPORT_STATE: TransportState = {
  position: '0:0:0',
  seconds: 0,
  bpm: 120,
  playing: false,
  bar: 1,
  beat: 1,
  progress: 0,
};

class VisualizationBridge {
  private static instance: VisualizationBridge | null = null;

  // State
  private transportState: TransportState = { ...DEFAULT_TRANSPORT_STATE };
  private triggerEvents: TriggerEvent[] = [];
  private activeLines: Set<number> = new Set();
  private maxTriggerEvents = 100;
  private triggerDecayMs = 150; // Lines stay highlighted for 150ms

  // RAF loop
  private rafId: number | null = null;
  private running = false;
  private lastRafTime = 0;

  // Subscriptions
  private transportListeners = new Set<() => void>();
  private triggerListeners = new Set<() => void>();

  private constructor() {
    this.exposeGlobalTrigger();
  }

  static getInstance(): VisualizationBridge {
    if (!VisualizationBridge.instance) {
      VisualizationBridge.instance = new VisualizationBridge();
    }
    return VisualizationBridge.instance;
  }

  /**
   * Expose global trigger function for instrumented code
   */
  private exposeGlobalTrigger(): void {
    if (typeof window === 'undefined') return;

    window.__vizTrigger = (line: number, note?: string | null, type?: string) => {
      this.emitTrigger(line, note ?? undefined, (type as TriggerEvent['type']) ?? 'note');
    };
  }

  /**
   * Start the RAF polling loop
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastRafTime = performance.now();
    this.tick();
  }

  /**
   * Stop the RAF polling loop
   */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Reset all visualization state
   */
  reset(): void {
    this.transportState = { ...DEFAULT_TRANSPORT_STATE };
    this.triggerEvents = [];
    this.activeLines = new Set();
    this.notifyTransportListeners();
    this.notifyTriggerListeners();
  }

  /**
   * RAF tick - polls transport state and prunes old triggers
   */
  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now();

    // Throttle to ~60fps (16.67ms)
    if (now - this.lastRafTime >= 16) {
      this.lastRafTime = now;

      // Update transport state if playing
      if (Tone.Transport.state === 'started') {
        const newState = this.readTransportState();
        if (this.hasTransportChanged(newState)) {
          this.transportState = newState;
          this.notifyTransportListeners();
        }
      } else if (this.transportState.playing) {
        // Transport stopped
        this.transportState = { ...this.transportState, playing: false };
        this.notifyTransportListeners();
      }

      // Prune old triggers and update active lines
      this.pruneOldTriggers(now);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Read current transport state from Tone.js
   */
  private readTransportState(): TransportState {
    const position = Tone.Transport.position as string;
    const seconds = Tone.Transport.seconds;
    const bpm = Tone.Transport.bpm.value;

    // Parse position "bars:beats:sixteenths"
    const parts = position.split(':').map(Number);
    const bar = (parts[0] ?? 0) + 1; // 1-indexed
    const beat = (parts[1] ?? 0) + 1; // 1-indexed
    const sixteenths = parts[2] ?? 0;

    // Calculate progress within current bar (0-1)
    const progress = (parts[1] + sixteenths / 4) / 4;

    return {
      position,
      seconds,
      bpm: Math.round(bpm),
      playing: true,
      bar,
      beat,
      progress,
    };
  }

  /**
   * Check if transport state has changed significantly
   */
  private hasTransportChanged(newState: TransportState): boolean {
    return (
      newState.bar !== this.transportState.bar ||
      newState.beat !== this.transportState.beat ||
      newState.bpm !== this.transportState.bpm ||
      newState.playing !== this.transportState.playing ||
      Math.abs(newState.progress - this.transportState.progress) > 0.01
    );
  }

  /**
   * Emit a trigger event (called by instrumented code)
   */
  emitTrigger(line: number, note?: string, type: TriggerEvent['type'] = 'note'): void {
    const event: TriggerEvent = {
      line,
      time: performance.now(),
      note,
      type,
    };

    this.triggerEvents.unshift(event);
    if (this.triggerEvents.length > this.maxTriggerEvents) {
      this.triggerEvents = this.triggerEvents.slice(0, this.maxTriggerEvents);
    }

    // Add to active lines immediately
    this.activeLines.add(line);
    this.notifyTriggerListeners();
  }

  /**
   * Remove triggers older than decay time and update active lines
   */
  private pruneOldTriggers(now: number): void {
    const cutoff = now - this.triggerDecayMs;
    const previousSize = this.activeLines.size;

    // Rebuild active lines from recent triggers
    this.activeLines = new Set(
      this.triggerEvents
        .filter(e => e.time >= cutoff)
        .map(e => e.line)
    );

    // Only notify if active lines changed
    if (this.activeLines.size !== previousSize) {
      this.notifyTriggerListeners();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // React subscriptions (useSyncExternalStore pattern)
  // ─────────────────────────────────────────────────────────────

  private notifyTransportListeners(): void {
    this.transportListeners.forEach(listener => listener());
  }

  private notifyTriggerListeners(): void {
    this.triggerListeners.forEach(listener => listener());
  }

  /**
   * Subscribe to transport state changes
   */
  subscribeTransport = (callback: () => void): (() => void) => {
    this.transportListeners.add(callback);
    return () => this.transportListeners.delete(callback);
  };

  /**
   * Get current transport state snapshot
   */
  getTransportSnapshot = (): TransportState => {
    return this.transportState;
  };

  /**
   * Subscribe to trigger/active line changes
   */
  subscribeTriggers = (callback: () => void): (() => void) => {
    this.triggerListeners.add(callback);
    return () => this.triggerListeners.delete(callback);
  };

  /**
   * Get current active lines snapshot
   */
  getActiveLinesSnapshot = (): Set<number> => {
    return this.activeLines;
  };

  /**
   * Get recent trigger events
   */
  getTriggerEvents(): TriggerEvent[] {
    return [...this.triggerEvents];
  }
}

// Export singleton getter
export function getVisualizationBridge(): VisualizationBridge {
  return VisualizationBridge.getInstance();
}
