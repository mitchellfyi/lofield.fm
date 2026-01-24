import { describe, it, expect } from "vitest";
import { estimateFileSize, formatFileSize } from "../audioExport";

// Note: renderAudio function requires actual Web Audio API and Tone.js
// which cannot be easily mocked in unit tests. Integration tests would be
// more appropriate for testing the full render pipeline.
// Here we test the utility functions that don't require browser APIs.

describe("audioExport", () => {
  describe("estimateFileSize", () => {
    describe("WAV format estimation", () => {
      it("should calculate correct size for 1 second stereo WAV at 44100 Hz", () => {
        // 44 bytes header + 44100 samples * 2 channels * 2 bytes = 44 + 176400
        const expectedSize = 44 + 44100 * 2 * 2;
        const size = estimateFileSize(1, "wav", 44100);
        expect(size).toBe(expectedSize); // 176444 bytes
      });

      it("should calculate correct size for 30 seconds stereo WAV at 44100 Hz", () => {
        const expectedSize = 44 + 30 * 44100 * 2 * 2;
        const size = estimateFileSize(30, "wav", 44100);
        expect(size).toBe(expectedSize); // ~5.3 MB
      });

      it("should calculate correct size for 60 seconds stereo WAV at 44100 Hz", () => {
        const expectedSize = 44 + 60 * 44100 * 2 * 2;
        const size = estimateFileSize(60, "wav", 44100);
        expect(size).toBe(expectedSize); // ~10.6 MB
      });

      it("should calculate correct size for 1 second stereo WAV at 48000 Hz", () => {
        const expectedSize = 44 + 48000 * 2 * 2;
        const size = estimateFileSize(1, "wav", 48000);
        expect(size).toBe(expectedSize); // 192044 bytes
      });

      it("should use default sample rate of 44100 Hz when not specified", () => {
        const expectedSize = 44 + 44100 * 2 * 2;
        const size = estimateFileSize(1, "wav");
        expect(size).toBe(expectedSize);
      });
    });

    describe("MP3 format estimation", () => {
      it("should estimate ~16 KB per second for MP3", () => {
        // 128kbps = 16 KB/s
        const expectedSize = Math.ceil(1 * 16 * 1024);
        const size = estimateFileSize(1, "mp3");
        expect(size).toBe(expectedSize); // 16384 bytes
      });

      it("should estimate correctly for 30 second MP3", () => {
        const expectedSize = Math.ceil(30 * 16 * 1024);
        const size = estimateFileSize(30, "mp3");
        expect(size).toBe(expectedSize); // ~480 KB
      });

      it("should estimate correctly for 60 second MP3", () => {
        const expectedSize = Math.ceil(60 * 16 * 1024);
        const size = estimateFileSize(60, "mp3");
        expect(size).toBe(expectedSize); // ~960 KB
      });
    });

    describe("edge cases", () => {
      it("should handle zero duration", () => {
        const wavSize = estimateFileSize(0, "wav");
        expect(wavSize).toBe(44); // Just header

        const mp3Size = estimateFileSize(0, "mp3");
        expect(mp3Size).toBe(0);
      });

      it("should handle fractional durations", () => {
        const size = estimateFileSize(1.5, "wav", 44100);
        const expectedSize = 44 + 1.5 * 44100 * 2 * 2;
        expect(size).toBe(expectedSize);
      });

      it("should handle very long durations", () => {
        // 10 minutes
        const size = estimateFileSize(600, "wav", 44100);
        const expectedSize = 44 + 600 * 44100 * 2 * 2;
        expect(size).toBe(expectedSize); // ~106 MB
      });
    });
  });

  describe("formatFileSize", () => {
    describe("bytes formatting", () => {
      it("should format 0 bytes correctly", () => {
        expect(formatFileSize(0)).toBe("0 B");
      });

      it("should format small byte values", () => {
        expect(formatFileSize(1)).toBe("1 B");
        expect(formatFileSize(44)).toBe("44 B");
        expect(formatFileSize(512)).toBe("512 B");
        expect(formatFileSize(1023)).toBe("1023 B");
      });
    });

    describe("kilobytes formatting", () => {
      it("should format 1 KB correctly", () => {
        expect(formatFileSize(1024)).toBe("1.0 KB");
      });

      it("should format KB values with one decimal", () => {
        expect(formatFileSize(1536)).toBe("1.5 KB");
        expect(formatFileSize(2048)).toBe("2.0 KB");
        expect(formatFileSize(10240)).toBe("10.0 KB");
      });

      it("should handle values just under 1 MB", () => {
        expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.0 KB");
      });
    });

    describe("megabytes formatting", () => {
      it("should format 1 MB correctly", () => {
        expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      });

      it("should format MB values with one decimal", () => {
        expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
        expect(formatFileSize(1024 * 1024 * 5.2)).toBe("5.2 MB");
        expect(formatFileSize(1024 * 1024 * 10)).toBe("10.0 MB");
      });

      it("should handle large MB values", () => {
        expect(formatFileSize(1024 * 1024 * 100)).toBe("100.0 MB");
        expect(formatFileSize(1024 * 1024 * 500)).toBe("500.0 MB");
      });
    });

    describe("realistic file size examples", () => {
      it("should format 30 second WAV correctly", () => {
        // 30s stereo WAV at 44100 Hz ≈ 5.3 MB
        const size = estimateFileSize(30, "wav", 44100);
        const formatted = formatFileSize(size);
        expect(formatted).toMatch(/^5\.\d MB$/);
      });

      it("should format 1 minute WAV correctly", () => {
        // 60s stereo WAV at 44100 Hz ≈ 10.6 MB
        const size = estimateFileSize(60, "wav", 44100);
        const formatted = formatFileSize(size);
        expect(formatted).toMatch(/^10\.\d MB$/);
      });

      it("should format 30 second MP3 correctly", () => {
        // 30s MP3 at 128kbps ≈ 480 KB
        const size = estimateFileSize(30, "mp3");
        const formatted = formatFileSize(size);
        expect(formatted).toBe("480.0 KB");
      });
    });
  });

  describe("module exports", () => {
    it("should export renderAudio function", async () => {
      const audioExport = await import("../audioExport");
      expect(audioExport.renderAudio).toBeDefined();
      expect(typeof audioExport.renderAudio).toBe("function");
    });

    it("should export estimateFileSize function", async () => {
      const audioExport = await import("../audioExport");
      expect(audioExport.estimateFileSize).toBeDefined();
      expect(typeof audioExport.estimateFileSize).toBe("function");
    });

    it("should export formatFileSize function", async () => {
      const audioExport = await import("../audioExport");
      expect(audioExport.formatFileSize).toBeDefined();
      expect(typeof audioExport.formatFileSize).toBe("function");
    });
  });
});
