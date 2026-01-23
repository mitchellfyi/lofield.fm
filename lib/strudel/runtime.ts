/**
 * StrudelRuntime - Singleton wrapper for Strudel audio engine
 * Manages initialization, playback state, and provides a reliable API
 */

export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'error';

export interface RuntimeEvent {
  timestamp: number;
  type: 'init' | 'play' | 'stop' | 'eval_ok' | 'eval_fail' | 'error';
  message: string;
  error?: string;
}

interface StrudelGlobals {
  initStrudel?: () => void;
  hush?: () => void;
}

declare global {
  interface Window extends StrudelGlobals {
    __strudelTest?: {
      getState: () => PlayerState;
      getLastEvents: () => RuntimeEvent[];
      wasInitCalled: () => boolean;
      wasPlayCalled: () => boolean;
      wasHushCalled: () => boolean;
    };
  }
}

class StrudelRuntime {
  private static instance: StrudelRuntime | null = null;
  private state: PlayerState = 'idle';
  private initialized = false;
  private events: RuntimeEvent[] = [];
  private maxEvents = 10;
  private listeners = new Set<() => void>();
  private initCallCount = 0;
  private playCallCount = 0;
  private hushCallCount = 0;

  private constructor() {
    // Private constructor for singleton
    this.exposeTestAPI();
  }

  static getInstance(): StrudelRuntime {
    if (!StrudelRuntime.instance) {
      StrudelRuntime.instance = new StrudelRuntime();
    }
    return StrudelRuntime.instance;
  }

  /**
   * Expose test API for E2E testing
   * Only exposed when NEXT_PUBLIC_E2E === "1"
   */
  private exposeTestAPI(): void {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_E2E !== '1') return;

    window.__strudelTest = {
      getState: () => this.getState(),
      getLastEvents: () => this.getEvents(),
      wasInitCalled: () => this.initCallCount > 0,
      wasPlayCalled: () => this.playCallCount > 0,
      wasHushCalled: () => this.hushCallCount > 0,
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
   * Initialize Strudel audio engine (must be called after user gesture)
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
      // Check if Strudel is loaded
      if (typeof window === 'undefined' || !window.initStrudel) {
        throw new Error('Strudel library not loaded');
      }

      // Initialize Strudel
      window.initStrudel();
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
   * Play Strudel code
   */
  async play(code: string): Promise<void> {
    if (!this.initialized) {
      // Auto-initialize on first play
      await this.init();
    }

    // Always hush before running new code
    this.hush();

    try {
      this.state = 'playing';
      this.playCallCount++;
      this.notifyListeners();

      // Evaluate code using Function constructor
      const fn = new Function(code);
      fn();

      this.addEvent({
        type: 'eval_ok',
        message: 'Code evaluated successfully',
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
   * Stop playback (hush)
   */
  stop(): void {
    this.hush();
    this.state = this.initialized ? 'ready' : 'idle';
    this.addEvent({
      type: 'stop',
      message: 'Stopped',
    });
    this.notifyListeners();
  }

  /**
   * Internal hush helper
   */
  private hush(): void {
    if (typeof window !== 'undefined' && window.hush) {
      try {
        window.hush();
        this.hushCallCount++;
      } catch (err) {
        // Ignore hush errors
      }
    }
  }

  /**
   * Reset runtime state (useful for testing or hot reload)
   */
  reset(): void {
    this.hush();
    this.state = 'idle';
    this.initialized = false;
    this.events = [];
    this.initCallCount = 0;
    this.playCallCount = 0;
    this.hushCallCount = 0;
    this.notifyListeners();
  }
}

// Export singleton instance getter
export function getStrudelRuntime(): StrudelRuntime {
  return StrudelRuntime.getInstance();
}
