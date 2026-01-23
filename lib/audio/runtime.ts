/**
 * AudioRuntime - Singleton wrapper for Tone.js audio engine
 * Manages initialization, playback state, and provides a reliable API
 */

import * as Tone from 'tone';
import { getVisualizationBridge } from './visualizationBridge';
import { wrapCodeForVisualization } from './codeTransformer';

export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'error';

export interface RuntimeEvent {
  timestamp: number;
  type: 'init' | 'play' | 'stop' | 'eval_ok' | 'eval_fail' | 'error';
  message: string;
  error?: string;
}

declare global {
  interface Window {
    __audioTest?: {
      getState: () => PlayerState;
      getLastEvents: () => RuntimeEvent[];
      wasInitCalled: () => boolean;
      wasPlayCalled: () => boolean;
      wasStopCalled: () => boolean;
    };
    // Store cleanup function for user code
    __toneCleanup?: () => void;
  }
}

class AudioRuntime {
  private static instance: AudioRuntime | null = null;
  private state: PlayerState = 'idle';
  private initialized = false;
  private events: RuntimeEvent[] = [];
  private maxEvents = 10;
  private listeners = new Set<() => void>();
  private initCallCount = 0;
  private playCallCount = 0;
  private stopCallCount = 0;

  private constructor() {
    // Private constructor for singleton
    this.exposeTestAPI();
  }

  static getInstance(): AudioRuntime {
    if (!AudioRuntime.instance) {
      AudioRuntime.instance = new AudioRuntime();
    }
    return AudioRuntime.instance;
  }

  /**
   * Expose test API for E2E testing
   * Only exposed when NEXT_PUBLIC_E2E === "1"
   */
  private exposeTestAPI(): void {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_E2E !== '1') return;

    window.__audioTest = {
      getState: () => this.getState(),
      getLastEvents: () => this.getEvents(),
      wasInitCalled: () => this.initCallCount > 0,
      wasPlayCalled: () => this.playCallCount > 0,
      wasStopCalled: () => this.stopCallCount > 0,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private addEvent(event: Omit<RuntimeEvent, 'timestamp'>) {
    const newEvent: RuntimeEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.events.unshift(newEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    this.notifyListeners();
  }

  /**
   * Get current player state
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Get runtime events log
   */
  getEvents(): RuntimeEvent[] {
    return [...this.events];
  }

  /**
   * Check if audio is initialized
   */
  isInitialised(): boolean {
    return this.initialized;
  }

  /**
   * Initialize Tone.js audio engine (must be called after user gesture)
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.addEvent({
        type: 'init',
        message: 'Already initialized',
      });
      return;
    }

    this.state = 'loading';
    this.notifyListeners();

    try {
      // Start Tone.js audio context (requires user gesture)
      await Tone.start();
      this.initCallCount++;
      this.initialized = true;
      this.state = 'ready';
      this.addEvent({
        type: 'init',
        message: 'Audio initialized successfully',
      });
      this.notifyListeners();
    } catch (err) {
      this.state = 'error';
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addEvent({
        type: 'error',
        message: 'Failed to initialize audio',
        error: errorMsg,
      });
      this.notifyListeners();
      throw err;
    }
  }

  /**
   * Play Tone.js code
   * 
   * The runtime automatically:
   * - Tracks all created Tone.js objects (synths, effects, sequences, etc.)
   * - Starts the Transport after code evaluation
   * - Disposes all tracked objects on stop
   * 
   * User code just needs to define instruments and sequences - no cleanup needed!
   */
  async play(code: string): Promise<void> {
    if (!this.initialized) {
      // Auto-initialize on first play
      await this.init();
    }

    // Stop any currently playing code and clean up
    this.stop();

    // Start visualization bridge
    const vizBridge = getVisualizationBridge();
    vizBridge.reset();
    vizBridge.start();

    // Transform code to inject visualization triggers
    const instrumentedCode = wrapCodeForVisualization(code);

    try {
      this.state = 'playing';
      this.playCallCount++;
      this.notifyListeners();

      // Array to track all disposable Tone.js objects
      const disposables: Array<{ dispose: () => void }> = [];

      // Create a proxy that auto-tracks all new Tone.js object instantiations
      const createTrackedTone = () => {
        return new Proxy(Tone, {
          get(target, prop: string) {
            const value = (target as Record<string, unknown>)[prop];
            
            // If it's a constructor (starts with capital letter), wrap it to track instances
            if (typeof value === 'function' && /^[A-Z]/.test(prop)) {
              return new Proxy(value, {
                construct(constructorTarget, args): object {
                  const instance = new (constructorTarget as new (...args: unknown[]) => object)(...args);
                  // Track anything with a dispose method
                  if (instance && typeof (instance as { dispose?: () => void }).dispose === 'function') {
                    disposables.push(instance as { dispose: () => void });
                  }
                  return instance;
                }
              });
            }
            return value;
          }
        });
      };

      const trackedTone = createTrackedTone();

      // Build the play function - user code gets the tracked Tone object
      const playFunction = new Function(
        'Tone',
        instrumentedCode
      );

      // Execute the code with tracked Tone
      playFunction(trackedTone);

      // Store cleanup function for this session
      window.__toneCleanup = () => {
        for (const obj of disposables) {
          try {
            obj.dispose();
          } catch (e) {
            console.warn('Error disposing Tone object:', e);
          }
        }
        disposables.length = 0;
      };

      // Wait for effects (especially Reverb) to be ready before starting
      // Reverb needs time to generate its impulse response
      const reverbs = disposables.filter(obj => obj instanceof Tone.Reverb) as Tone.Reverb[];
      if (reverbs.length > 0) {
        await Promise.all(reverbs.map(r => r.ready));
      }

      // Ensure audio context is running
      await Tone.getContext().resume();

      // Configure transport for 32-bar loop (4 sections x 8 bars)
      const transport = Tone.getTransport();
      transport.position = 0;
      transport.loop = true;
      transport.loopStart = 0;
      transport.loopEnd = '32:0:0'; // 32 bars

      // Start transport immediately - no offset needed since we've waited for everything
      if (transport.state !== 'started') {
        transport.start();
      }

      this.addEvent({
        type: 'eval_ok',
        message: `Code evaluated (${disposables.length} objects tracked)`,
      });
      this.addEvent({
        type: 'play',
        message: 'Playing',
      });
    } catch (err) {
      this.state = 'error';
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addEvent({
        type: 'eval_fail',
        message: 'Code evaluation failed',
        error: errorMsg,
      });
      this.notifyListeners();
      throw err;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    try {
      this.stopCallCount++;

      // Stop visualization bridge
      const vizBridge = getVisualizationBridge();
      vizBridge.stop();

      // Call user's cleanup function if it exists
      if (typeof window !== 'undefined' && window.__toneCleanup) {
        try {
          window.__toneCleanup();
          window.__toneCleanup = undefined;
        } catch (e) {
          console.warn('Error in cleanup function:', e);
        }
      }
      
      // Stop Tone.js Transport (use getTransport() to avoid deprecation)
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel(0); // Cancel all scheduled events
      transport.position = 0; // Reset position
      
      this.state = this.initialized ? 'ready' : 'idle';
      this.addEvent({
        type: 'stop',
        message: 'Stopped',
      });
      this.notifyListeners();
    } catch (err) {
      // Ignore stop errors, but log them
      console.warn('Error stopping playback:', err);
    }
  }

  /**
   * Reset runtime state (useful for testing or hot reload)
   */
  reset(): void {
    this.stop();
    this.state = 'idle';
    this.initialized = false;
    this.events = [];
    this.initCallCount = 0;
    this.playCallCount = 0;
    this.stopCallCount = 0;
    this.notifyListeners();
  }
}

// Export singleton instance getter
export function getAudioRuntime(): AudioRuntime {
  return AudioRuntime.getInstance();
}
