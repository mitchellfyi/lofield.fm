import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStrudelRuntime } from './runtime';

describe('StrudelRuntime', () => {
  beforeEach(() => {
    // Reset runtime before each test
    const runtime = getStrudelRuntime();
    runtime.reset();
    
    // Mock window.initStrudel and window.hush
    if (typeof window !== 'undefined') {
      vi.stubGlobal('initStrudel', vi.fn());
      vi.stubGlobal('hush', vi.fn());
    }
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const runtime1 = getStrudelRuntime();
      const runtime2 = getStrudelRuntime();
      expect(runtime1).toBe(runtime2);
    });
  });

  describe('initial state', () => {
    it('should start in idle state', () => {
      const runtime = getStrudelRuntime();
      expect(runtime.getState()).toBe('idle');
    });

    it('should not be initialized initially', () => {
      const runtime = getStrudelRuntime();
      expect(runtime.isInitialised()).toBe(false);
    });

    it('should have no events initially', () => {
      const runtime = getStrudelRuntime();
      expect(runtime.getEvents()).toHaveLength(0);
    });
  });

  describe('init', () => {
    it('should transition to ready', async () => {
      const runtime = getStrudelRuntime();
      
      // Mock initStrudel
      global.window = { initStrudel: vi.fn() } as any;
      
      await runtime.init();
      
      expect(runtime.getState()).toBe('ready');
      expect(runtime.isInitialised()).toBe(true);
    });

    it('should add init event on success', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn() } as any;
      
      await runtime.init();
      
      const events = runtime.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('init');
      expect(events[0].message).toContain('initialized successfully');
    });

    it('should handle init errors', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(() => { throw new Error('Init failed'); }) } as any;
      
      await expect(runtime.init()).rejects.toThrow('Init failed');
      expect(runtime.getState()).toBe('error');
      
      const events = runtime.getEvents();
      expect(events[0].type).toBe('error');
    });

    it('should not reinitialize if already initialized', async () => {
      const runtime = getStrudelRuntime();
      const mockInit = vi.fn();
      global.window = { initStrudel: mockInit } as any;
      
      await runtime.init();
      await runtime.init();
      
      expect(mockInit).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', () => {
    it('should auto-initialize if not initialized', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      const code = 'console.log("test")';
      await runtime.play(code);
      
      expect(runtime.isInitialised()).toBe(true);
      expect(runtime.getState()).toBe('playing');
    });

    it('should call hush before playing', async () => {
      const runtime = getStrudelRuntime();
      const mockHush = vi.fn();
      global.window = { initStrudel: vi.fn(), hush: mockHush } as any;
      
      await runtime.init();
      await runtime.play('console.log("test")');
      
      expect(mockHush).toHaveBeenCalled();
    });

    it('should add play event on success', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      await runtime.play('1 + 1');
      
      const events = runtime.getEvents();
      const playEvent = events.find(e => e.type === 'play');
      expect(playEvent).toBeDefined();
    });

    it('should handle eval errors', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      const badCode = 'throw new Error("Bad code")';
      await expect(runtime.play(badCode)).rejects.toThrow();
      
      expect(runtime.getState()).toBe('error');
      const events = runtime.getEvents();
      const failEvent = events.find(e => e.type === 'eval_fail');
      expect(failEvent).toBeDefined();
    });
  });

  describe('stop', () => {
    it('should call hush and transition to ready', async () => {
      const runtime = getStrudelRuntime();
      const mockHush = vi.fn();
      global.window = { initStrudel: vi.fn(), hush: mockHush } as any;
      
      await runtime.init();
      await runtime.play('1 + 1');
      runtime.stop();
      
      expect(mockHush).toHaveBeenCalled();
      expect(runtime.getState()).toBe('ready');
    });

    it('should add stop event', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      await runtime.init();
      runtime.stop();
      
      const events = runtime.getEvents();
      const stopEvent = events.find(e => e.type === 'stop');
      expect(stopEvent).toBeDefined();
    });

    it('should transition to idle if not initialized', () => {
      const runtime = getStrudelRuntime();
      global.window = { hush: vi.fn() } as any;
      
      runtime.stop();
      
      expect(runtime.getState()).toBe('idle');
    });
  });

  describe('events', () => {
    it('should limit events to maxEvents', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      // Generate more than 10 events
      for (let i = 0; i < 15; i++) {
        runtime.stop();
      }
      
      const events = runtime.getEvents();
      expect(events.length).toBeLessThanOrEqual(10);
    });

    it('should include timestamp in events', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      await runtime.init();
      
      const events = runtime.getEvents();
      expect(events[0].timestamp).toBeDefined();
      expect(typeof events[0].timestamp).toBe('number');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      const listener = vi.fn();
      runtime.subscribe(listener);
      
      await runtime.init();
      
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribe', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      const listener = vi.fn();
      const unsubscribe = runtime.subscribe(listener);
      unsubscribe();
      
      await runtime.init();
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      const runtime = getStrudelRuntime();
      global.window = { initStrudel: vi.fn(), hush: vi.fn() } as any;
      
      await runtime.init();
      runtime.reset();
      
      expect(runtime.getState()).toBe('idle');
      expect(runtime.isInitialised()).toBe(false);
      expect(runtime.getEvents()).toHaveLength(0);
    });
  });
});
