import { describe, it, expect } from 'vitest';
import { transformCode } from '../codeTransformer';

describe('codeTransformer', () => {
  describe('transformCode', () => {
    describe('block-body arrow functions', () => {
      it('should inject trigger into Tone.Sequence callback', () => {
        const input = `const kickSeq = new Tone.Sequence((time, vel) => {
  if (vel) kick.triggerAttackRelease("C1", "8n", time, vel);
}, [0.9, null], "8n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        expect(code).toMatch(/window\.__vizTrigger\?\.\(\d+, vel, "note"\)/);
      });

      it('should inject trigger into Tone.Pattern callback', () => {
        const input = `const pat = new Tone.Pattern((time, note) => {
  synth.triggerAttackRelease(note, "8n", time);
}, ["C4", "E4", "G4"], "up").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        expect(code).toMatch(/window\.__vizTrigger\?\.\(\d+, note, "note"\)/);
      });

      it('should inject trigger into Tone.Loop callback', () => {
        const input = `const loop = new Tone.Loop((time) => {
  synth.triggerAttackRelease("C4", "8n", time);
}, "4n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
      });
    });

    describe('expression-body arrow functions', () => {
      it('should transform expression-body Sequence callbacks', () => {
        const input = `const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v), [0.9, null], "8n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        // Should convert to block body
        expect(code).toContain('=> {');
        expect(code).toContain('window.__vizTrigger?.(1, v, "note")');
      });

      it('should transform compact sequence with ternary', () => {
        const input = `const hatPat = new Tone.Sequence((t, v) => v > 0.7 ? hihatOpen.triggerAttackRelease("32n", t, v) : hihatClosed.triggerAttackRelease("32n", t, v), [0.6, 0.3], "16n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
      });

      it('should handle sequence with simple method call', () => {
        const input = `const bassSeq = new Tone.Sequence((t, n) => n && bass.triggerAttackRelease(n, "8n", t), ["C2", null], "8n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        expect(code).toContain('window.__vizTrigger?.(1, n, "note")');
      });
    });

    describe('preserves original code', () => {
      it('should preserve the original callback code', () => {
        const input = `const kickSeq = new Tone.Sequence((time, vel) => {
  if (vel) kick.triggerAttackRelease("C1", "8n", time, vel);
}, [0.9, null], "8n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('kick.triggerAttackRelease("C1", "8n", time, vel)');
      });

      it('should preserve expression body content', () => {
        const input = `const seq = new Tone.Sequence((t, v) => v && synth.trigger(v), [1], "8n")`;

        const { code } = transformCode(input);

        expect(code).toContain('v && synth.trigger(v)');
      });
    });

    describe('line numbers', () => {
      it('should use correct line number for the trigger', () => {
        const input = `// Comment on line 1
const synth = new Tone.Synth();
const seq = new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, "8n", time);
}, ["C4"], "8n").start(0);`;

        const { code } = transformCode(input);

        // The Sequence starts on line 3
        expect(code).toContain('window.__vizTrigger?.(3,');
      });

      it('should use line 1 for first-line sequence', () => {
        const input = `const seq = new Tone.Sequence((t, v) => v && synth.trigger(v), [1], "8n")`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger?.(1,');
      });
    });

    describe('multiple sequences', () => {
      it('should handle multiple sequences', () => {
        const input = `const kickSeq = new Tone.Sequence((t, v) => v && kick.trigger(v), [0.9], "8n").start(0);

const snareSeq = new Tone.Sequence((t, v) => v && snare.trigger(v), [null, 0.9], "8n").start(0);`;

        const { code } = transformCode(input);

        const matches = code.match(/window\.__vizTrigger/g);
        expect(matches?.length).toBeGreaterThanOrEqual(2);
      });

      it('should use different line numbers for different sequences', () => {
        const input = `const kickSeq = new Tone.Sequence((t, v) => v && kick.trigger(v), [0.9], "8n").start(0);
const snareSeq = new Tone.Sequence((t, v) => v && snare.trigger(v), [0.9], "8n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger?.(1,');
        expect(code).toContain('window.__vizTrigger?.(2,');
      });
    });

    describe('real-world code patterns', () => {
      it('should transform the DEFAULT_CODE kick pattern', () => {
        const input = `const kickPat = new Tone.Sequence((t, v) => v && kick.triggerAttackRelease("C1", "8n", t, v),
  [0.95, null, null, 0.4, 0.9, null, 0.35, null, 0.85, null, null, 0.45, 0.9, null, 0.3, 0.5], "16n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        // Expression body should be converted to block body
        expect(code).toContain('=> {');
      });

      it('should transform the DEFAULT_CODE hat pattern with conditional', () => {
        const input = `const hatPat = new Tone.Sequence((t, v) => {
  if (v > 0.7) hihatOpen.triggerAttackRelease("32n", t, v * 0.6);
  else if (v) hihatClosed.triggerAttackRelease("32n", t, v);
}, [0.6, 0.25, 0.5, 0.3, 0.55, 0.2, 0.8, 0.35, 0.55, 0.25, 0.5, 0.3, 0.6, 0.2, 0.75, 0.4], "16n").start(0);`;

        const { code } = transformCode(input);

        expect(code).toContain('window.__vizTrigger');
        expect(code).toContain('window.__vizTrigger?.(1, v, "note")');
      });
    });
  });
});
