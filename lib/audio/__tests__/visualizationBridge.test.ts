import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Tone.js before importing the bridge
vi.mock('tone', () => ({
  Transport: {
    state: 'stopped',
    position: '0:0:0',
    seconds: 0,
    bpm: { value: 120 },
  },
}));

import { getVisualizationBridge } from '../visualizationBridge';

describe('VisualizationBridge', () => {
  let bridge: ReturnType<typeof getVisualizationBridge>;

  beforeEach(() => {
    bridge = getVisualizationBridge();
    bridge.reset();
  });

  afterEach(() => {
    bridge.stop();
    bridge.reset();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const bridge1 = getVisualizationBridge();
      const bridge2 = getVisualizationBridge();
      expect(bridge1).toBe(bridge2);
    });
  });

  describe('transport state', () => {
    it('should have default transport state', () => {
      const state = bridge.getTransportSnapshot();
      expect(state.bpm).toBe(120);
      expect(state.playing).toBe(false);
      expect(state.bar).toBe(1);
      expect(state.beat).toBe(1);
    });
  });

  describe('trigger events', () => {
    it('should emit trigger events', () => {
      bridge.emitTrigger(42, 'C4', 'note');

      const activeLines = bridge.getActiveLinesSnapshot();
      expect(activeLines.has(42)).toBe(true);
    });

    it('should track multiple active lines', () => {
      bridge.emitTrigger(10, 'C4', 'note');
      bridge.emitTrigger(20, 'E4', 'note');
      bridge.emitTrigger(30, 'G4', 'note');

      const activeLines = bridge.getActiveLinesSnapshot();
      expect(activeLines.has(10)).toBe(true);
      expect(activeLines.has(20)).toBe(true);
      expect(activeLines.has(30)).toBe(true);
      expect(activeLines.size).toBe(3);
    });

    it('should notify trigger listeners when trigger is emitted', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.subscribeTriggers(listener);

      bridge.emitTrigger(42, 'C4', 'note');

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should clear active lines on reset', () => {
      bridge.emitTrigger(42, 'C4', 'note');
      expect(bridge.getActiveLinesSnapshot().has(42)).toBe(true);

      bridge.reset();

      expect(bridge.getActiveLinesSnapshot().size).toBe(0);
    });
  });

  describe('subscriptions', () => {
    it('should allow subscribing to transport state', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.subscribeTransport(listener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should allow subscribing to triggers', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.subscribeTriggers(listener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = bridge.subscribeTriggers(listener);

      unsubscribe();
      bridge.emitTrigger(42, 'C4', 'note');

      // Should only be called once (from before unsubscribe)
      // Actually it shouldn't be called at all since we unsubscribed before emitting
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // Skip window tests in Node.js (no window object)
  describe.skipIf(typeof globalThis.window === 'undefined')('global trigger function', () => {
    it('should expose window.__vizTrigger', () => {
      expect(typeof window.__vizTrigger).toBe('function');
    });

    it('should emit trigger when window.__vizTrigger is called', () => {
      const listener = vi.fn();
      bridge.subscribeTriggers(listener);

      window.__vizTrigger?.(99, 'D4', 'note');

      const activeLines = bridge.getActiveLinesSnapshot();
      expect(activeLines.has(99)).toBe(true);
    });
  });
});
