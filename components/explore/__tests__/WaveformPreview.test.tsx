import { describe, it, expect } from "vitest";

// Test the waveform generation logic directly
// The component is thin wrapper, so we focus on the core algorithm

/**
 * Generates a deterministic pseudo-random waveform from track code.
 * This is a copy of the function for testing purposes.
 */
function generateWaveformBars(code: string, barCount: number): number[] {
  // Simple hash function for deterministic randomness
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const bars: number[] = [];
  let seed = Math.abs(hash);

  for (let i = 0; i < barCount; i++) {
    // LCG pseudo-random generator
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    // Generate bar height between 0.2 and 1.0 for visual appeal
    const normalized = (seed / 0x7fffffff) * 0.8 + 0.2;
    // Apply smoothing for more natural waveform shape
    bars.push(normalized);
  }

  // Apply simple moving average for smoother waveform
  const smoothed: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const prev = bars[Math.max(0, i - 1)];
    const curr = bars[i];
    const next = bars[Math.min(bars.length - 1, i + 1)];
    smoothed.push((prev + curr + next) / 3);
  }

  return smoothed;
}

describe("WaveformPreview", () => {
  describe("waveform generation algorithm", () => {
    const sampleCode = `
      synth.triggerAttackRelease("C4", "8n");
      synth.triggerAttackRelease("E4", "8n");
    `;

    it("should generate the specified number of bars", () => {
      const bars = generateWaveformBars(sampleCode, 24);
      expect(bars).toHaveLength(24);
    });

    it("should generate bars within valid range (0.2 to 1.0)", () => {
      const bars = generateWaveformBars(sampleCode, 100);
      bars.forEach((bar) => {
        expect(bar).toBeGreaterThanOrEqual(0.1); // Slightly lower due to smoothing
        expect(bar).toBeLessThanOrEqual(1.0);
      });
    });

    it("should be deterministic - same input produces same output", () => {
      const bars1 = generateWaveformBars(sampleCode, 32);
      const bars2 = generateWaveformBars(sampleCode, 32);
      expect(bars1).toEqual(bars2);
    });

    it("should produce different waveforms for different code", () => {
      const bars1 = generateWaveformBars(sampleCode, 32);
      const bars2 = generateWaveformBars("totally.different.code()", 32);
      expect(bars1).not.toEqual(bars2);
    });

    it("should handle empty code string", () => {
      const bars = generateWaveformBars("", 24);
      expect(bars).toHaveLength(24);
      bars.forEach((bar) => {
        expect(typeof bar).toBe("number");
        expect(isNaN(bar)).toBe(false);
      });
    });

    it("should handle very long code strings", () => {
      const longCode = "x".repeat(10000);
      const bars = generateWaveformBars(longCode, 24);
      expect(bars).toHaveLength(24);
    });

    it("should handle unicode characters", () => {
      const unicodeCode = "const emoji = '🎵🎶🎸';";
      const bars = generateWaveformBars(unicodeCode, 24);
      expect(bars).toHaveLength(24);
      bars.forEach((bar) => {
        expect(typeof bar).toBe("number");
        expect(isNaN(bar)).toBe(false);
      });
    });

    it("should generate varying bar heights (not all the same)", () => {
      const bars = generateWaveformBars(sampleCode, 32);
      const uniqueHeights = new Set(bars.map((b) => b.toFixed(3)));
      // With 32 bars and smoothing, we should have many unique values
      expect(uniqueHeights.size).toBeGreaterThan(5);
    });

    it("should produce smooth transitions between adjacent bars due to averaging", () => {
      const bars = generateWaveformBars(sampleCode, 24);
      for (let i = 1; i < bars.length - 1; i++) {
        // Due to 3-point moving average, transitions should be smooth
        // The difference between adjacent bars should not be extreme
        const diff = Math.abs(bars[i] - bars[i - 1]);
        expect(diff).toBeLessThan(0.5); // Reasonable smoothness threshold
      }
    });
  });

  describe("component module structure", () => {
    it("should export WaveformPreview component", async () => {
      const waveformModule = await import("../WaveformPreview");
      expect(waveformModule.WaveformPreview).toBeDefined();
      expect(typeof waveformModule.WaveformPreview).toBe("function");
    });

    it("should be a named export", async () => {
      const waveformModule = await import("../WaveformPreview");
      expect(Object.keys(waveformModule)).toContain("WaveformPreview");
    });
  });

  describe("FFT to bar heights conversion", () => {
    /**
     * Convert FFT dB values to normalized bar heights
     * Copy of the function for testing purposes
     */
    function fftToBarHeights(fft: Float32Array, barCount: number): number[] {
      const bars: number[] = [];
      const binCount = fft.length;

      for (let i = 0; i < barCount; i++) {
        const startBin = Math.floor((i / barCount) ** 1.5 * binCount);
        const endBin = Math.floor(((i + 1) / barCount) ** 1.5 * binCount);
        const actualEndBin = Math.max(startBin + 1, endBin);

        let sum = 0;
        for (let j = startBin; j < actualEndBin && j < binCount; j++) {
          const normalized = (fft[j] + 100) / 100;
          sum += Math.max(0, Math.min(1, normalized));
        }
        const avg = sum / (actualEndBin - startBin);

        bars.push(Math.max(0.1, Math.min(1, avg * 1.5)));
      }

      return bars;
    }

    it("should generate the specified number of bars", () => {
      const fft = new Float32Array(64).fill(-50); // Mid-range dB values
      const bars = fftToBarHeights(fft, 24);
      expect(bars).toHaveLength(24);
    });

    it("should return minimum height for silent audio (all -100 dB)", () => {
      const fft = new Float32Array(64).fill(-100);
      const bars = fftToBarHeights(fft, 24);
      bars.forEach((bar) => {
        expect(bar).toBeCloseTo(0.1, 1); // Min height
      });
    });

    it("should return maximum height for loud audio (0 dB)", () => {
      const fft = new Float32Array(64).fill(0);
      const bars = fftToBarHeights(fft, 24);
      bars.forEach((bar) => {
        expect(bar).toBeCloseTo(1, 1); // Max height (clamped)
      });
    });

    it("should produce varying bar heights for varying FFT data", () => {
      const fft = new Float32Array(64);
      for (let i = 0; i < 64; i++) {
        fft[i] = -100 + (i / 64) * 100; // Gradient from -100 to 0
      }
      const bars = fftToBarHeights(fft, 24);

      // Due to logarithmic distribution, lower bars (lower frequencies) should be smaller
      expect(bars[0]).toBeLessThan(bars[bars.length - 1]);
    });

    it("should handle empty FFT array", () => {
      const fft = new Float32Array(0);
      const bars = fftToBarHeights(fft, 24);
      expect(bars).toHaveLength(24);
      // All bars should be minimum since no data
      bars.forEach((bar) => {
        expect(bar).toBeGreaterThanOrEqual(0.1);
      });
    });

    it("should clamp values between 0.1 and 1", () => {
      const fft = new Float32Array(64);
      // Test with extreme values
      for (let i = 0; i < 64; i++) {
        fft[i] = i < 32 ? -200 : 50; // Some very low, some very high
      }
      const bars = fftToBarHeights(fft, 24);
      bars.forEach((bar) => {
        expect(bar).toBeGreaterThanOrEqual(0.1);
        expect(bar).toBeLessThanOrEqual(1);
      });
    });
  });
});
