import { describe, it, expect } from "vitest";

// Test the spectrum analyzer module structure and data processing
// Canvas rendering is tested via integration tests

describe("SpectrumAnalyzer", () => {
  describe("module structure", () => {
    it("should export SpectrumAnalyzer component", async () => {
      const spectrumModule = await import("../SpectrumAnalyzer");
      expect(spectrumModule.SpectrumAnalyzer).toBeDefined();
      expect(typeof spectrumModule.SpectrumAnalyzer).toBe("function");
    });

    it("should be a named export", async () => {
      const spectrumModule = await import("../SpectrumAnalyzer");
      expect(Object.keys(spectrumModule)).toContain("SpectrumAnalyzer");
    });
  });

  describe("frequency to position conversion", () => {
    // Test the logarithmic frequency distribution logic
    // This mirrors the internal freqToX function

    function freqToX(freq: number, width: number): number {
      const minFreq = 20;
      const maxFreq = 20000;
      if (freq <= minFreq) return 0;
      if (freq >= maxFreq) return width;
      const logPos = Math.log10(freq / minFreq) / Math.log10(maxFreq / minFreq);
      return logPos * width;
    }

    it("should return 0 for frequencies at or below 20Hz", () => {
      expect(freqToX(20, 100)).toBe(0);
      expect(freqToX(10, 100)).toBe(0);
      expect(freqToX(0, 100)).toBe(0);
    });

    it("should return width for frequencies at or above 20kHz", () => {
      expect(freqToX(20000, 100)).toBe(100);
      expect(freqToX(25000, 100)).toBe(100);
    });

    it("should place 1kHz roughly in the middle (logarithmic scale)", () => {
      // 1kHz is log(1000/20) / log(20000/20) = log(50) / log(1000) ≈ 0.566
      const position = freqToX(1000, 100);
      expect(position).toBeGreaterThan(40);
      expect(position).toBeLessThan(70);
    });

    it("should maintain logarithmic distribution", () => {
      // Higher frequencies should be spaced closer together
      const pos100 = freqToX(100, 100);
      const pos1k = freqToX(1000, 100);
      const pos10k = freqToX(10000, 100);

      // Gaps should decrease as frequency increases
      const gap1 = pos1k - pos100; // 100Hz to 1kHz
      const gap2 = pos10k - pos1k; // 1kHz to 10kHz

      // Both represent 10x frequency increase, so gaps should be similar
      // (within tolerance due to logarithmic scale)
      expect(Math.abs(gap1 - gap2)).toBeLessThan(5);
    });

    it("should scale proportionally with width", () => {
      const narrow = freqToX(1000, 100);
      const wide = freqToX(1000, 200);
      expect(wide).toBeCloseTo(narrow * 2, 1);
    });
  });

  describe("dB normalization", () => {
    // Test the dB to visual height conversion logic

    function normalizeDb(db: number): number {
      // Normalize dB to 0-1 range (assuming -100 to 0 dB range)
      return Math.max(0, Math.min(1, (db + 100) / 100));
    }

    it("should return 0 for -100 dB (silence)", () => {
      expect(normalizeDb(-100)).toBe(0);
    });

    it("should return 1 for 0 dB (full scale)", () => {
      expect(normalizeDb(0)).toBe(1);
    });

    it("should return 0.5 for -50 dB", () => {
      expect(normalizeDb(-50)).toBe(0.5);
    });

    it("should clamp values below -100 dB", () => {
      expect(normalizeDb(-200)).toBe(0);
    });

    it("should clamp values above 0 dB", () => {
      expect(normalizeDb(10)).toBe(1);
    });

    it("should handle typical music levels (-30 to -6 dB)", () => {
      const level = normalizeDb(-18);
      expect(level).toBeGreaterThan(0.7);
      expect(level).toBeLessThan(0.95);
    });
  });

  describe("logarithmic bar distribution", () => {
    // Test the FFT bin to visual bar grouping logic

    function getBinRange(
      barIndex: number,
      totalBars: number,
      fftLength: number
    ): { startBin: number; endBin: number } {
      const startRatio = barIndex / totalBars;
      const endRatio = (barIndex + 1) / totalBars;

      const minFreq = 20;
      const maxFreq = 20000;
      const startFreq = minFreq * Math.pow(maxFreq / minFreq, startRatio);
      const endFreq = minFreq * Math.pow(maxFreq / minFreq, endRatio);

      const nyquist = 22050;
      const startBin = Math.floor((startFreq / nyquist) * fftLength);
      const endBin = Math.ceil((endFreq / nyquist) * fftLength);

      return { startBin, endBin };
    }

    it("should group lower frequency bins into first bars", () => {
      const { startBin, endBin } = getBinRange(0, 32, 64);
      expect(startBin).toBe(0);
      expect(endBin).toBeGreaterThan(0);
    });

    it("should have increasing bin ranges for higher bars", () => {
      const low = getBinRange(5, 32, 64);
      const high = getBinRange(25, 32, 64);

      // Higher bars should span larger frequency ranges
      const lowRange = low.endBin - low.startBin;
      const highRange = high.endBin - high.startBin;
      expect(highRange).toBeGreaterThanOrEqual(lowRange);
    });

    it("should cover most of the FFT range", () => {
      const first = getBinRange(0, 32, 64);
      const last = getBinRange(31, 32, 64);

      expect(first.startBin).toBe(0);
      // The last bar should extend to at least 90% of FFT bins
      // (some high frequency bins may be outside 20kHz range)
      expect(last.endBin).toBeGreaterThanOrEqual(Math.floor(64 * 0.9));
    });
  });
});
