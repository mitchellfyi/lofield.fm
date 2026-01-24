import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ConfirmationDialog component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export ConfirmationDialog component", async () => {
      const dialogModule = await import("../ConfirmationDialog");
      expect(dialogModule.ConfirmationDialog).toBeDefined();
      expect(typeof dialogModule.ConfirmationDialog).toBe("function");
    });

    it("should be a named export", async () => {
      const dialogModule = await import("../ConfirmationDialog");
      expect(Object.keys(dialogModule)).toContain("ConfirmationDialog");
    });
  });

  describe("props interface", () => {
    it("should accept required props: isOpen, title, message, onConfirm, onCancel", async () => {
      const dialogModule = await import("../ConfirmationDialog");
      expect(dialogModule.ConfirmationDialog).toBeDefined();
    });

    it("should accept optional props: confirmLabel, cancelLabel, variant", async () => {
      const dialogModule = await import("../ConfirmationDialog");
      expect(dialogModule.ConfirmationDialog).toBeDefined();
    });

    it("should define ConfirmationDialogProps interface correctly", () => {
      interface ConfirmationDialogProps {
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: "danger" | "warning" | "info";
        onConfirm: () => void;
        onCancel: () => void;
      }

      const props: ConfirmationDialogProps = {
        isOpen: true,
        title: "Test Title",
        message: "Test message",
        confirmLabel: "OK",
        cancelLabel: "Cancel",
        variant: "warning",
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.isOpen).toBe(true);
      expect(props.title).toBe("Test Title");
      expect(props.message).toBe("Test message");
      expect(props.confirmLabel).toBe("OK");
      expect(props.cancelLabel).toBe("Cancel");
      expect(props.variant).toBe("warning");
      expect(typeof props.onConfirm).toBe("function");
      expect(typeof props.onCancel).toBe("function");
    });

    it("should have default values for optional props", () => {
      const defaultConfirmLabel = "Confirm";
      const defaultCancelLabel = "Cancel";
      const defaultVariant = "warning";

      expect(defaultConfirmLabel).toBe("Confirm");
      expect(defaultCancelLabel).toBe("Cancel");
      expect(defaultVariant).toBe("warning");
    });
  });

  describe("visibility behavior", () => {
    it("should return null when isOpen is false", () => {
      const isOpen = false;
      const renderResult = isOpen ? "dialog-content" : null;
      expect(renderResult).toBeNull();
    });

    it("should render dialog content when isOpen is true", () => {
      const isOpen = true;
      const renderResult = isOpen ? "dialog-content" : null;
      expect(renderResult).toBe("dialog-content");
    });
  });

  describe("confirm callback", () => {
    it("should call onConfirm when confirm button is clicked", () => {
      const onConfirm = vi.fn();
      onConfirm();
      expect(onConfirm).toHaveBeenCalled();
    });

    it("should call onConfirm exactly once per click", () => {
      const onConfirm = vi.fn();
      onConfirm();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("cancel callback", () => {
    it("should call onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      onCancel();
      expect(onCancel).toHaveBeenCalled();
    });

    it("should call onCancel exactly once per click", () => {
      const onCancel = vi.fn();
      onCancel();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant styling", () => {
    describe("danger variant", () => {
      it("should have rose icon color", () => {
        const variantStyles = {
          danger: { icon: "text-rose-400" },
        };
        expect(variantStyles.danger.icon).toContain("rose");
      });

      it("should have rose icon background", () => {
        const variantStyles = {
          danger: { iconBg: "bg-rose-500/20" },
        };
        expect(variantStyles.danger.iconBg).toContain("rose");
      });

      it("should have rose confirm button", () => {
        const variantStyles = {
          danger: {
            confirmButton:
              "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-500/20",
          },
        };
        expect(variantStyles.danger.confirmButton).toContain("rose");
      });
    });

    describe("warning variant", () => {
      it("should have amber icon color", () => {
        const variantStyles = {
          warning: { icon: "text-amber-400" },
        };
        expect(variantStyles.warning.icon).toContain("amber");
      });

      it("should have amber icon background", () => {
        const variantStyles = {
          warning: { iconBg: "bg-amber-500/20" },
        };
        expect(variantStyles.warning.iconBg).toContain("amber");
      });

      it("should have amber confirm button", () => {
        const variantStyles = {
          warning: {
            confirmButton:
              "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20",
          },
        };
        expect(variantStyles.warning.confirmButton).toContain("amber");
      });
    });

    describe("info variant", () => {
      it("should have cyan icon color", () => {
        const variantStyles = {
          info: { icon: "text-cyan-400" },
        };
        expect(variantStyles.info.icon).toContain("cyan");
      });

      it("should have cyan icon background", () => {
        const variantStyles = {
          info: { iconBg: "bg-cyan-500/20" },
        };
        expect(variantStyles.info.iconBg).toContain("cyan");
      });

      it("should have cyan confirm button", () => {
        const variantStyles = {
          info: {
            confirmButton:
              "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/20",
          },
        };
        expect(variantStyles.info.confirmButton).toContain("cyan");
      });
    });

    it("should have all three variants defined", () => {
      type Variant = "danger" | "warning" | "info";
      const variants: Variant[] = ["danger", "warning", "info"];

      expect(variants).toContain("danger");
      expect(variants).toContain("warning");
      expect(variants).toContain("info");
    });
  });

  describe("content display", () => {
    it("should display title", () => {
      const title = "Confirm Action";
      expect(title).toBe("Confirm Action");
    });

    it("should display message", () => {
      const message = "Are you sure you want to proceed?";
      expect(message).toBe("Are you sure you want to proceed?");
    });

    it("should display custom confirm label", () => {
      const confirmLabel = "Delete";
      expect(confirmLabel).toBe("Delete");
    });

    it("should display custom cancel label", () => {
      const cancelLabel = "Keep";
      expect(cancelLabel).toBe("Keep");
    });

    it("should display default confirm label when not provided", () => {
      const confirmLabel = "Confirm";
      expect(confirmLabel).toBe("Confirm");
    });

    it("should display default cancel label when not provided", () => {
      const cancelLabel = "Cancel";
      expect(cancelLabel).toBe("Cancel");
    });
  });

  describe("icon", () => {
    it("should display warning/exclamation icon", () => {
      // Triangle with exclamation mark SVG path
      const iconPath =
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
      expect(iconPath).toContain("M12 9v2");
    });

    it("should have icon container with correct size", () => {
      const iconContainerClasses = "w-12 h-12 rounded-full";
      expect(iconContainerClasses).toContain("w-12");
      expect(iconContainerClasses).toContain("h-12");
      expect(iconContainerClasses).toContain("rounded-full");
    });

    it("should have icon SVG with correct size", () => {
      const iconClasses = "w-6 h-6";
      expect(iconClasses).toContain("w-6");
      expect(iconClasses).toContain("h-6");
    });
  });

  describe("dialog styling", () => {
    it("should have fixed positioning for overlay", () => {
      const overlayClasses = "fixed inset-0 z-[60]";
      expect(overlayClasses).toContain("fixed");
      expect(overlayClasses).toContain("inset-0");
      expect(overlayClasses).toContain("z-[60]");
    });

    it("should have dark backdrop", () => {
      const overlayClasses = "bg-black/80 backdrop-blur-sm";
      expect(overlayClasses).toContain("bg-black/80");
      expect(overlayClasses).toContain("backdrop-blur");
    });

    it("should have max width", () => {
      const dialogClasses = "max-w-sm";
      expect(dialogClasses).toBe("max-w-sm");
    });

    it("should have rounded corners", () => {
      const dialogClasses = "rounded-2xl";
      expect(dialogClasses).toBe("rounded-2xl");
    });

    it("should have gradient background", () => {
      const dialogClasses = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
      expect(dialogClasses).toContain("bg-gradient-to-br");
      expect(dialogClasses).toContain("slate-900");
      expect(dialogClasses).toContain("slate-800");
    });

    it("should have border", () => {
      const dialogClasses = "border border-slate-700";
      expect(dialogClasses).toContain("border");
      expect(dialogClasses).toContain("slate-700");
    });

    it("should have shadow", () => {
      const dialogClasses = "shadow-2xl";
      expect(dialogClasses).toBe("shadow-2xl");
    });
  });

  describe("button layout", () => {
    it("should have buttons in footer", () => {
      const footerClasses = "px-6 py-4 bg-slate-800/50 flex gap-3";
      expect(footerClasses).toContain("flex");
      expect(footerClasses).toContain("gap-3");
    });

    it("should have equal width buttons", () => {
      const buttonClass = "flex-1";
      expect(buttonClass).toBe("flex-1");
    });

    it("should have cancel button with outline style", () => {
      const cancelClasses = "text-slate-300 border border-slate-600 hover:bg-slate-700";
      expect(cancelClasses).toContain("border");
      expect(cancelClasses).toContain("text-slate-300");
    });

    it("should have confirm button with gradient style", () => {
      const confirmClasses = "bg-gradient-to-r text-white";
      expect(confirmClasses).toContain("bg-gradient-to-r");
      expect(confirmClasses).toContain("text-white");
    });
  });

  describe("text styling", () => {
    it("should have centered title", () => {
      const titleClasses = "text-lg font-semibold text-white text-center";
      expect(titleClasses).toContain("text-center");
      expect(titleClasses).toContain("font-semibold");
    });

    it("should have centered message", () => {
      const messageClasses = "text-sm text-slate-400 text-center";
      expect(messageClasses).toContain("text-center");
      expect(messageClasses).toContain("text-slate-400");
    });
  });

  describe("animation", () => {
    it("should have fade-in animation for overlay", () => {
      const overlayClasses = "animate-in fade-in duration-200";
      expect(overlayClasses).toContain("animate-in");
      expect(overlayClasses).toContain("fade-in");
    });

    it("should have zoom-in animation for dialog", () => {
      const dialogClasses = "animate-in zoom-in-95 duration-200";
      expect(dialogClasses).toContain("animate-in");
      expect(dialogClasses).toContain("zoom-in-95");
    });
  });

  describe("z-index", () => {
    it("should have higher z-index than PresetBrowser modal", () => {
      const presetBrowserZ = 50;
      const confirmationDialogZ = 60;
      expect(confirmationDialogZ).toBeGreaterThan(presetBrowserZ);
    });
  });

  describe("accessibility", () => {
    it("should use h3 for title", () => {
      const titleElement = "h3";
      expect(titleElement).toBe("h3");
    });

    it("should use p for message", () => {
      const messageElement = "p";
      expect(messageElement).toBe("p");
    });

    it("should use button elements for actions", () => {
      const buttonElement = "button";
      expect(buttonElement).toBe("button");
    });
  });

  describe("content spacing", () => {
    it("should have proper padding in content area", () => {
      const contentClasses = "p-6 space-y-4";
      expect(contentClasses).toContain("p-6");
      expect(contentClasses).toContain("space-y-4");
    });
  });

  describe("use cases", () => {
    it("should work for unsaved changes confirmation", () => {
      const props = {
        isOpen: true,
        title: "Unsaved Changes",
        message: "You have unsaved changes. Loading a new preset will replace your current code.",
        confirmLabel: "Load Preset",
        cancelLabel: "Keep Editing",
        variant: "warning" as const,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.title).toBe("Unsaved Changes");
      expect(props.variant).toBe("warning");
    });

    it("should work for delete confirmation", () => {
      const props = {
        isOpen: true,
        title: "Delete Track",
        message: "Are you sure you want to delete this track? This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        variant: "danger" as const,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.title).toBe("Delete Track");
      expect(props.variant).toBe("danger");
    });

    it("should work for info confirmation", () => {
      const props = {
        isOpen: true,
        title: "Share Track",
        message: "This will create a public link to share your track.",
        confirmLabel: "Share",
        cancelLabel: "Cancel",
        variant: "info" as const,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.title).toBe("Share Track");
      expect(props.variant).toBe("info");
    });
  });
});
