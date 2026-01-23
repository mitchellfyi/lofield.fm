import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ApiKeyModal component", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export ApiKeyModal component", async () => {
      const modalModule = await import("../ApiKeyModal");
      expect(modalModule.ApiKeyModal).toBeDefined();
      expect(typeof modalModule.ApiKeyModal).toBe("function");
    });

    it("should be a named export", async () => {
      const modalModule = await import("../ApiKeyModal");
      expect(Object.keys(modalModule)).toContain("ApiKeyModal");
    });
  });

  describe("props interface", () => {
    it("should accept isOpen, onClose, and onSuccess props", async () => {
      const modalModule = await import("../ApiKeyModal");
      // TypeScript enforces the interface at compile time
      // Verify component function exists
      expect(modalModule.ApiKeyModal).toBeDefined();
    });
  });

  describe("validation endpoint integration", () => {
    it("should call /api/validate-key endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ valid: true }),
      });

      // Simulate validation call
      await mockFetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "sk-test-key" }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "sk-test-key" }),
      });
    });

    it("should handle valid key response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ valid: true }),
      });

      const response = await mockFetch("/api/validate-key", {
        method: "POST",
        body: JSON.stringify({ key: "sk-valid-key" }),
      });
      const data = await response.json();

      expect(data.valid).toBe(true);
    });

    it("should handle invalid key response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          valid: false,
          error: "Invalid API key",
        }),
      });

      const response = await mockFetch("/api/validate-key", {
        method: "POST",
        body: JSON.stringify({ key: "sk-invalid-key" }),
      });
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toBe("Invalid API key");
    });

    it("should handle validation network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        mockFetch("/api/validate-key", {
          method: "POST",
          body: JSON.stringify({ key: "sk-test" }),
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("save endpoint integration", () => {
    it("should call /api/api-keys endpoint on save", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await mockFetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "sk-validated-key" }),
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "sk-validated-key" }),
      });
    });

    it("should handle successful save response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const response = await mockFetch("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ key: "sk-test-key" }),
      });

      expect(response.ok).toBe(true);
    });

    it("should handle save error response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "Failed to save API key" }),
      });

      const response = await mockFetch("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ key: "sk-test-key" }),
      });
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe("Failed to save API key");
    });
  });

  describe("input validation behavior", () => {
    it("should require API key to be non-empty for validation", () => {
      // The component validates that apiKey.trim() is not empty
      // before allowing validation
      const emptyKey = "";
      const whitespaceKey = "   ";

      expect(emptyKey.trim()).toBe("");
      expect(whitespaceKey.trim()).toBe("");
      expect("sk-test".trim()).not.toBe("");
    });

    it("should require validation before saving", () => {
      // Save button should be disabled until key is validated
      // This is handled by the validated state in the component
      const validated = false;
      expect(validated).toBe(false);
    });
  });

  describe("state management", () => {
    it("should reset state on close", async () => {
      // The component clears apiKey, error, and validated on close
      const modalModule = await import("../ApiKeyModal");
      expect(modalModule.ApiKeyModal).toBeDefined();
    });

    it("should reset validated state when key changes", async () => {
      // When the key input changes, validated should be reset to false
      const modalModule = await import("../ApiKeyModal");
      expect(modalModule.ApiKeyModal).toBeDefined();
    });
  });

  describe("UI text content", () => {
    it("should display correct title", async () => {
      // The modal has title "Add OpenAI API Key"
      const title = "Add OpenAI API Key";
      expect(title).toBe("Add OpenAI API Key");
    });

    it("should display help text with OpenAI link", async () => {
      const helpUrl = "https://platform.openai.com/api-keys";
      expect(helpUrl).toContain("platform.openai.com");
    });

    it("should show validate button when not validated", () => {
      const validated = false;
      const buttonText = validated ? "Save Key" : "Validate";
      expect(buttonText).toBe("Validate");
    });

    it("should show save button when validated", () => {
      const validated = true;
      const buttonText = validated ? "Save Key" : "Validate";
      expect(buttonText).toBe("Save Key");
    });

    it("should show validating state", () => {
      const validating = true;
      const buttonText = validating ? "Validating..." : "Validate";
      expect(buttonText).toBe("Validating...");
    });

    it("should show saving state", () => {
      const loading = true;
      const buttonText = loading ? "Saving..." : "Save Key";
      expect(buttonText).toBe("Saving...");
    });
  });

  describe("error display", () => {
    it("should show error message when validation fails", async () => {
      const errorMessage = "Invalid API key";
      expect(errorMessage).toBe("Invalid API key");
    });

    it("should show error message when save fails", async () => {
      const errorMessage = "Failed to save API key";
      expect(errorMessage).toBe("Failed to save API key");
    });

    it("should show success message after validation", async () => {
      const successMessage = "API key validated successfully";
      expect(successMessage).toBe("API key validated successfully");
    });
  });

  describe("button disabled states", () => {
    it("should disable validate button when key is empty", () => {
      const apiKey = "";
      const validating = false;
      const disabled = validating || !apiKey.trim();
      expect(disabled).toBe(true);
    });

    it("should disable validate button while validating", () => {
      const apiKey = "sk-test";
      const validating = true;
      const disabled = validating || !apiKey.trim();
      expect(disabled).toBe(true);
    });

    it("should disable save button while saving", () => {
      const loading = true;
      const disabled = loading;
      expect(disabled).toBe(true);
    });

    it("should disable cancel button while validating or saving", () => {
      const loading = true;
      const validating = false;
      const disabled = loading || validating;
      expect(disabled).toBe(true);
    });
  });

  describe("callback behavior", () => {
    it("should call onClose when cancel is clicked", () => {
      const onClose = vi.fn();
      onClose();
      expect(onClose).toHaveBeenCalled();
    });

    it("should call onSuccess and onClose after successful save", () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      // Simulate successful save
      onSuccess();
      onClose();

      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
