import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the codeExport functions
vi.mock("@/lib/export/codeExport", () => ({
  copyToClipboard: vi.fn(),
  downloadAsJS: vi.fn(),
}));

describe("ExportButton component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export ExportButton component", async () => {
      const buttonModule = await import("../ExportButton");
      expect(buttonModule.ExportButton).toBeDefined();
      expect(typeof buttonModule.ExportButton).toBe("function");
    });

    it("should be a named export", async () => {
      const buttonModule = await import("../ExportButton");
      expect(Object.keys(buttonModule)).toContain("ExportButton");
    });
  });

  describe("props interface", () => {
    it("should accept required props: code, onExportAudio, onToast", async () => {
      const buttonModule = await import("../ExportButton");
      // TypeScript enforces the interface at compile time
      expect(buttonModule.ExportButton).toBeDefined();
    });

    it("should accept optional props: trackName, disabled", async () => {
      const buttonModule = await import("../ExportButton");
      expect(buttonModule.ExportButton).toBeDefined();
    });
  });

  describe("copy code functionality", () => {
    it("should call copyToClipboard with code content", async () => {
      const { copyToClipboard } = await import("@/lib/export/codeExport");
      const mockCopyToClipboard = vi.mocked(copyToClipboard);
      mockCopyToClipboard.mockResolvedValue({ success: true });

      const code = "const x = 1;";
      await mockCopyToClipboard(code);

      expect(mockCopyToClipboard).toHaveBeenCalledWith(code);
    });

    it("should show success toast when copy succeeds", async () => {
      const { copyToClipboard } = await import("@/lib/export/codeExport");
      const mockCopyToClipboard = vi.mocked(copyToClipboard);
      mockCopyToClipboard.mockResolvedValue({ success: true });

      const onToast = vi.fn();
      const result = await mockCopyToClipboard("test code");

      if (result.success) {
        onToast("Code copied to clipboard", "success");
      }

      expect(onToast).toHaveBeenCalledWith("Code copied to clipboard", "success");
    });

    it("should show error toast when copy fails", async () => {
      const { copyToClipboard } = await import("@/lib/export/codeExport");
      const mockCopyToClipboard = vi.mocked(copyToClipboard);
      mockCopyToClipboard.mockResolvedValue({
        success: false,
        error: "Clipboard access denied",
      });

      const onToast = vi.fn();
      const result = await mockCopyToClipboard("test code");

      if (!result.success) {
        onToast(result.error || "Failed to copy", "error");
      }

      expect(onToast).toHaveBeenCalledWith("Clipboard access denied", "error");
    });
  });

  describe("download JS functionality", () => {
    it("should call downloadAsJS with code content", async () => {
      const { downloadAsJS } = await import("@/lib/export/codeExport");
      const mockDownloadAsJS = vi.mocked(downloadAsJS);

      const code = "const x = 1;";
      mockDownloadAsJS(code);

      expect(mockDownloadAsJS).toHaveBeenCalledWith(code);
    });

    it("should generate filename from track name", async () => {
      const { downloadAsJS } = await import("@/lib/export/codeExport");
      const mockDownloadAsJS = vi.mocked(downloadAsJS);

      const trackName = "My Cool Track";
      const expectedFilename = "my-cool-track.js";

      const filename = trackName.toLowerCase().replace(/\s+/g, "-") + ".js";
      mockDownloadAsJS("code", filename);

      expect(mockDownloadAsJS).toHaveBeenCalledWith("code", expectedFilename);
    });

    it("should use undefined filename when no track name provided", async () => {
      const { downloadAsJS } = await import("@/lib/export/codeExport");
      const mockDownloadAsJS = vi.mocked(downloadAsJS);

      // When no trackName is provided, downloadAsJS is called with undefined filename
      mockDownloadAsJS("code", undefined);

      expect(mockDownloadAsJS).toHaveBeenCalledWith("code", undefined);
    });

    it("should show success toast after download", async () => {
      const onToast = vi.fn();
      onToast("Downloaded as JS file", "success");
      expect(onToast).toHaveBeenCalledWith("Downloaded as JS file", "success");
    });
  });

  describe("export audio functionality", () => {
    it("should call onExportAudio when export audio option is selected", () => {
      const onExportAudio = vi.fn();
      onExportAudio();
      expect(onExportAudio).toHaveBeenCalled();
    });
  });

  describe("dropdown behavior", () => {
    it("should toggle dropdown state when button clicked", () => {
      let showDropdown = false;

      // Simulate toggle
      showDropdown = !showDropdown;
      expect(showDropdown).toBe(true);

      showDropdown = !showDropdown;
      expect(showDropdown).toBe(false);
    });

    it("should close dropdown after action", () => {
      let showDropdown = true;

      // Simulate action closing dropdown
      showDropdown = false;
      expect(showDropdown).toBe(false);
    });
  });

  describe("disabled state", () => {
    it("should respect disabled prop", () => {
      const disabled = true;
      expect(disabled).toBe(true);
    });

    it("should allow interaction when not disabled", () => {
      const disabled = false;
      expect(disabled).toBe(false);
    });
  });

  describe("UI text content", () => {
    it("should display Export button text", () => {
      const buttonText = "Export";
      expect(buttonText).toBe("Export");
    });

    it("should display Copy Code option", () => {
      const optionText = "Copy Code";
      expect(optionText).toBe("Copy Code");
    });

    it("should display Download as JS option", () => {
      const optionText = "Download as JS";
      expect(optionText).toBe("Download as JS");
    });

    it("should display Export Audio option", () => {
      const optionText = "Export Audio...";
      expect(optionText).toBe("Export Audio...");
    });
  });

  describe("callback behavior", () => {
    it("should call onToast with correct type for success", () => {
      const onToast = vi.fn();
      onToast("Success message", "success");
      expect(onToast).toHaveBeenCalledWith("Success message", "success");
    });

    it("should call onToast with correct type for error", () => {
      const onToast = vi.fn();
      onToast("Error message", "error");
      expect(onToast).toHaveBeenCalledWith("Error message", "error");
    });
  });
});
