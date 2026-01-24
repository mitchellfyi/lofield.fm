import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard, downloadAsJS, downloadBlob } from "../codeExport";

describe("codeExport", () => {
  describe("copyToClipboard", () => {
    const originalNavigator = global.navigator;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _originalDocument = global.document;

    beforeEach(() => {
      // Reset mocks
      vi.restoreAllMocks();
    });

    afterEach(() => {
      // Restore original objects if needed
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should use navigator.clipboard.writeText when available in secure context", async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(global, "navigator", {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
      });

      Object.defineProperty(window, "isSecureContext", {
        value: true,
        writable: true,
      });

      const result = await copyToClipboard("test code");

      expect(result.success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith("test code");
    });

    it("should return error when clipboard API fails", async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error("Clipboard error"));

      Object.defineProperty(global, "navigator", {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
      });

      Object.defineProperty(window, "isSecureContext", {
        value: true,
        writable: true,
      });

      const result = await copyToClipboard("test code");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Clipboard error");
    });

    it("should fall back to execCommand when clipboard API is unavailable", async () => {
      // Mock no clipboard API
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
      });

      Object.defineProperty(window, "isSecureContext", {
        value: false,
        writable: true,
      });

      // Mock document methods
      const mockTextArea = {
        value: "",
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };

      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const createElementMock = vi.fn().mockReturnValue(mockTextArea);
      const execCommandMock = vi.fn().mockReturnValue(true);

      vi.spyOn(document, "createElement").mockImplementation(createElementMock);
      vi.spyOn(document.body, "appendChild").mockImplementation(appendChildMock);
      vi.spyOn(document.body, "removeChild").mockImplementation(removeChildMock);
      // execCommand is deprecated but we need to mock it for the fallback path
      (document as Document & { execCommand: typeof execCommandMock }).execCommand =
        execCommandMock;

      const result = await copyToClipboard("fallback code");

      expect(result.success).toBe(true);
      expect(createElementMock).toHaveBeenCalledWith("textarea");
      expect(mockTextArea.value).toBe("fallback code");
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    it("should return error when execCommand fails", async () => {
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
      });

      Object.defineProperty(window, "isSecureContext", {
        value: false,
        writable: true,
      });

      const mockTextArea = {
        value: "",
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
      };

      const execCommandMock = vi.fn().mockReturnValue(false);

      vi.spyOn(document, "createElement").mockReturnValue(
        mockTextArea as unknown as HTMLTextAreaElement
      );
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());
      // execCommand is deprecated but we need to mock it for the fallback path
      (document as Document & { execCommand: typeof execCommandMock }).execCommand =
        execCommandMock;

      const result = await copyToClipboard("test code");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Copy command failed");
    });
  });

  describe("downloadAsJS", () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let createdLink: { href: string; download: string; click: () => void } | null;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();
      createdLink = null;

      global.URL.createObjectURL = mockCreateObjectURL as typeof URL.createObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL as typeof URL.revokeObjectURL;

      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          createdLink = {
            href: "",
            download: "",
            click: mockClick as () => void,
          };
          return createdLink as unknown as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });

      vi.spyOn(document.body, "appendChild").mockImplementation(
        vi.fn() as unknown as typeof document.body.appendChild
      );
      vi.spyOn(document.body, "removeChild").mockImplementation(
        vi.fn() as unknown as typeof document.body.removeChild
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create a blob with the correct type", () => {
      downloadAsJS("const x = 1;");

      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/javascript");
    });

    it("should use the provided filename", () => {
      downloadAsJS("const x = 1;", "custom-name.js");

      expect(createdLink?.download).toBe("custom-name.js");
    });

    it("should generate a default filename with timestamp when not provided", () => {
      downloadAsJS("const x = 1;");

      expect(createdLink?.download).toMatch(/^track-\d+\.js$/);
    });

    it("should trigger click on the link", () => {
      downloadAsJS("const x = 1;");

      expect(mockClick).toHaveBeenCalled();
    });

    it("should revoke the object URL after download", () => {
      downloadAsJS("const x = 1;");

      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("should set the link href to the blob URL", () => {
      downloadAsJS("const x = 1;");

      expect(createdLink?.href).toBe("blob:test-url");
    });
  });

  describe("downloadBlob", () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let createdLink: { href: string; download: string; click: () => void } | null;

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();
      createdLink = null;

      global.URL.createObjectURL = mockCreateObjectURL as typeof URL.createObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL as typeof URL.revokeObjectURL;

      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
          createdLink = {
            href: "",
            download: "",
            click: mockClick as () => void,
          };
          return createdLink as unknown as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });

      vi.spyOn(document.body, "appendChild").mockImplementation(
        vi.fn() as unknown as typeof document.body.appendChild
      );
      vi.spyOn(document.body, "removeChild").mockImplementation(
        vi.fn() as unknown as typeof document.body.removeChild
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should download the blob with the given filename", () => {
      const blob = new Blob(["test content"], { type: "audio/wav" });

      downloadBlob(blob, "test-audio.wav");

      expect(createdLink?.download).toBe("test-audio.wav");
      expect(mockClick).toHaveBeenCalled();
    });

    it("should revoke the object URL after download", () => {
      const blob = new Blob(["test content"], { type: "audio/wav" });

      downloadBlob(blob, "test.wav");

      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });
  });
});
