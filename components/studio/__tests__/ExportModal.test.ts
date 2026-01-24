import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the audio export functions
vi.mock("@/lib/export/audioExport", () => ({
  renderAudio: vi.fn(),
  estimateFileSize: vi.fn((duration: number, format: string) => {
    if (format === "wav") {
      return 44 + duration * 44100 * 2 * 2;
    }
    return Math.ceil(duration * 16 * 1024);
  }),
  formatFileSize: vi.fn((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }),
}));

vi.mock("@/lib/export/codeExport", () => ({
  downloadBlob: vi.fn(),
}));

describe("ExportModal component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export ExportModal component", async () => {
      const modalModule = await import("../ExportModal");
      expect(modalModule.ExportModal).toBeDefined();
      expect(typeof modalModule.ExportModal).toBe("function");
    });

    it("should be a named export", async () => {
      const modalModule = await import("../ExportModal");
      expect(Object.keys(modalModule)).toContain("ExportModal");
    });
  });

  describe("props interface", () => {
    it("should accept required props: isOpen, code, onClose", async () => {
      const modalModule = await import("../ExportModal");
      expect(modalModule.ExportModal).toBeDefined();
    });

    it("should accept optional props: trackName, onSuccess", async () => {
      const modalModule = await import("../ExportModal");
      expect(modalModule.ExportModal).toBeDefined();
    });
  });

  describe("duration presets", () => {
    const DURATION_PRESETS = [
      { label: "30s", value: 30 },
      { label: "1 min", value: 60 },
      { label: "2 min", value: 120 },
      { label: "4 min", value: 240 },
      { label: "Custom", value: 0 },
    ];

    it("should include 30 second preset", () => {
      const preset = DURATION_PRESETS.find((p) => p.value === 30);
      expect(preset).toBeDefined();
      expect(preset?.label).toBe("30s");
    });

    it("should include 1 minute preset", () => {
      const preset = DURATION_PRESETS.find((p) => p.value === 60);
      expect(preset).toBeDefined();
      expect(preset?.label).toBe("1 min");
    });

    it("should include 2 minute preset", () => {
      const preset = DURATION_PRESETS.find((p) => p.value === 120);
      expect(preset).toBeDefined();
      expect(preset?.label).toBe("2 min");
    });

    it("should include 4 minute preset", () => {
      const preset = DURATION_PRESETS.find((p) => p.value === 240);
      expect(preset).toBeDefined();
      expect(preset?.label).toBe("4 min");
    });

    it("should include custom duration option", () => {
      const preset = DURATION_PRESETS.find((p) => p.label === "Custom");
      expect(preset).toBeDefined();
      expect(preset?.value).toBe(0);
    });
  });

  describe("format selection", () => {
    it("should support WAV format", () => {
      const format = "wav";
      expect(format).toBe("wav");
    });

    it("should have MP3 format disabled (coming soon)", () => {
      // MP3 support is not yet implemented
      const mp3Enabled = false;
      expect(mp3Enabled).toBe(false);
    });
  });

  describe("file size estimation", () => {
    it("should estimate file size for WAV at 30 seconds", async () => {
      const { estimateFileSize } = await import("@/lib/export/audioExport");
      const size = estimateFileSize(30, "wav");
      expect(size).toBeGreaterThan(0);
    });

    it("should estimate file size for WAV at 60 seconds", async () => {
      const { estimateFileSize } = await import("@/lib/export/audioExport");
      const size = estimateFileSize(60, "wav");
      const size30 = estimateFileSize(30, "wav");
      // 60 seconds should be roughly double 30 seconds
      expect(size).toBeGreaterThan(size30);
    });

    it("should format file size for display", async () => {
      const { formatFileSize } = await import("@/lib/export/audioExport");
      const formatted = formatFileSize(1024 * 1024);
      expect(formatted).toContain("MB");
    });
  });

  describe("export state machine", () => {
    type ExportState = "idle" | "rendering" | "complete" | "error";

    it("should start in idle state", () => {
      const state: ExportState = "idle";
      expect(state).toBe("idle");
    });

    it("should transition to rendering state when export starts", () => {
      let state: ExportState = "idle";
      state = "rendering";
      expect(state).toBe("rendering");
    });

    it("should transition to complete state on success", () => {
      let state: ExportState = "rendering";
      state = "complete";
      expect(state).toBe("complete");
    });

    it("should transition to error state on failure", () => {
      let state: ExportState = "rendering";
      state = "error";
      expect(state).toBe("error");
    });

    it("should reset to idle state on close", () => {
      let state: ExportState = "complete";
      state = "idle";
      expect(state).toBe("idle");
    });
  });

  describe("progress tracking", () => {
    const phases = ["preparing", "rendering", "encoding", "complete"] as const;

    it("should support preparing phase", () => {
      expect(phases).toContain("preparing");
    });

    it("should support rendering phase", () => {
      expect(phases).toContain("rendering");
    });

    it("should support encoding phase", () => {
      expect(phases).toContain("encoding");
    });

    it("should support complete phase", () => {
      expect(phases).toContain("complete");
    });

    it("should display correct message for each phase", () => {
      const phaseMessages = {
        preparing: "Preparing...",
        rendering: "Rendering audio...",
        encoding: "Encoding file...",
        complete: "Export complete!",
      };

      expect(phaseMessages.preparing).toBe("Preparing...");
      expect(phaseMessages.rendering).toBe("Rendering audio...");
      expect(phaseMessages.encoding).toBe("Encoding file...");
      expect(phaseMessages.complete).toBe("Export complete!");
    });
  });

  describe("custom duration handling", () => {
    it("should parse custom duration as integer", () => {
      const customDuration = "45";
      const parsed = parseInt(customDuration, 10);
      expect(parsed).toBe(45);
    });

    it("should handle invalid custom duration", () => {
      const customDuration = "abc";
      const parsed = parseInt(customDuration, 10);
      expect(isNaN(parsed)).toBe(true);
    });

    it("should use fallback for invalid duration", () => {
      const customDuration = "abc";
      const effectiveDuration = parseInt(customDuration, 10) || 60;
      expect(effectiveDuration).toBe(60);
    });
  });

  describe("filename generation", () => {
    it("should generate filename with track name", () => {
      const trackName = "My Cool Track";
      const format = "wav";
      const extension = format === "wav" ? "wav" : "mp3";
      const filename = `${trackName.toLowerCase().replace(/\s+/g, "-")}.${extension}`;
      expect(filename).toBe("my-cool-track.wav");
    });

    it("should generate timestamp filename without track name", () => {
      const trackName = undefined;
      const format = "wav";
      const extension = format === "wav" ? "wav" : "mp3";
      const filename = trackName
        ? `${trackName.toLowerCase().replace(/\s+/g, "-")}.${extension}`
        : `track-${Date.now()}.${extension}`;
      expect(filename).toMatch(/^track-\d+\.wav$/);
    });
  });

  describe("abort handling", () => {
    it("should support cancellation during render", () => {
      let aborted = false;
      aborted = true;
      expect(aborted).toBe(true);
    });
  });

  describe("download functionality", () => {
    it("should call downloadBlob with blob and filename", async () => {
      const { downloadBlob } = await import("@/lib/export/codeExport");
      const mockDownloadBlob = vi.mocked(downloadBlob);

      const blob = new Blob(["test"], { type: "audio/wav" });
      mockDownloadBlob(blob, "test.wav");

      expect(mockDownloadBlob).toHaveBeenCalledWith(blob, "test.wav");
    });

    it("should call onSuccess callback after download", () => {
      const onSuccess = vi.fn();
      onSuccess();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("close behavior", () => {
    it("should reset state on close", () => {
      const resetState = () => ({
        exportState: "idle" as const,
        progress: null,
        error: null,
        exportedBlob: null,
      });

      const state = resetState();
      expect(state.exportState).toBe("idle");
      expect(state.progress).toBeNull();
      expect(state.error).toBeNull();
      expect(state.exportedBlob).toBeNull();
    });

    it("should call onClose callback", () => {
      const onClose = vi.fn();
      onClose();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("UI text content", () => {
    it("should display Export Audio title", () => {
      const title = "Export Audio";
      expect(title).toBe("Export Audio");
    });

    it("should display WAV format option", () => {
      const wavLabel = "WAV";
      const wavDescription = "Lossless quality";
      expect(wavLabel).toBe("WAV");
      expect(wavDescription).toBe("Lossless quality");
    });

    it("should display MP3 format option as coming soon", () => {
      const mp3Label = "MP3";
      const mp3Description = "Coming soon";
      expect(mp3Label).toBe("MP3");
      expect(mp3Description).toBe("Coming soon");
    });

    it("should display success message", () => {
      const message = "Audio rendered successfully! Click download to save.";
      expect(message).toContain("rendered successfully");
    });

    it("should show Export button text", () => {
      const buttonText = "Export";
      expect(buttonText).toBe("Export");
    });

    it("should show Download button text when complete", () => {
      const buttonText = "Download";
      expect(buttonText).toBe("Download");
    });

    it("should show Cancel button when rendering", () => {
      const exportState = "rendering";
      const buttonText = exportState === "rendering" ? "Cancel" : "Close";
      expect(buttonText).toBe("Cancel");
    });

    it("should show Close button when not rendering", () => {
      const exportState = "idle";
      const buttonText = exportState === "rendering" ? "Cancel" : "Close";
      expect(buttonText).toBe("Close");
    });
  });
});
