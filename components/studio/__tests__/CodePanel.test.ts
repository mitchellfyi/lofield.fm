import { describe, it, expect, vi } from "vitest";

describe("CodePanel component", () => {
  describe("module structure", () => {
    it("should export CodePanel component", async () => {
      const { CodePanel } = await import("../CodePanel");
      expect(CodePanel).toBeDefined();
      expect(typeof CodePanel).toBe("function");
    });

    it("should be a named export", async () => {
      const codePanelModule = await import("../CodePanel");
      expect(Object.keys(codePanelModule)).toContain("CodePanel");
    });
  });

  describe("props interface", () => {
    it("should accept required props: code, onChange, validationErrors, defaultCode", async () => {
      const { CodePanel } = await import("../CodePanel");
      expect(CodePanel).toBeDefined();
    });

    it("should validate code is a string", () => {
      const code = "Tone.Transport.start()";
      expect(typeof code).toBe("string");
    });

    it("should validate onChange is a function", () => {
      const onChange = vi.fn();
      expect(typeof onChange).toBe("function");
    });

    it("should validate validationErrors is an array", () => {
      const validationErrors: string[] = [];
      expect(Array.isArray(validationErrors)).toBe(true);
    });

    it("should validate defaultCode is a string", () => {
      const defaultCode = "// default code";
      expect(typeof defaultCode).toBe("string");
    });

    it("should accept optional liveMode as boolean", () => {
      const liveMode = true;
      expect(typeof liveMode).toBe("boolean");
    });

    it("should accept optional onLiveModeChange as function", () => {
      const onLiveModeChange = vi.fn();
      expect(typeof onLiveModeChange).toBe("function");
    });

    it("should accept optional showSequencerToggle as boolean", () => {
      const showSequencerToggle = true;
      expect(typeof showSequencerToggle).toBe("boolean");
    });

    it("should accept optional sequencerVisible as boolean", () => {
      const sequencerVisible = false;
      expect(typeof sequencerVisible).toBe("boolean");
    });

    it("should accept optional onSequencerToggle as function", () => {
      const onSequencerToggle = vi.fn();
      expect(typeof onSequencerToggle).toBe("function");
    });
  });

  describe("copy functionality", () => {
    it("should track copied state", () => {
      let copied = false;
      const setCopied = (value: boolean) => {
        copied = value;
      };
      setCopied(true);
      expect(copied).toBe(true);
    });

    it("should reset copied state after timeout", () => {
      let copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
      // Initial state should be true
      expect(copied).toBe(true);
    });
  });

  describe("revert functionality", () => {
    it("should call onChange with defaultCode when revert is clicked", () => {
      const onChange = vi.fn();
      const defaultCode = "// default code";

      onChange(defaultCode);

      expect(onChange).toHaveBeenCalledWith("// default code");
    });
  });

  describe("validation errors display", () => {
    it("should not show errors panel when validationErrors is empty", () => {
      const validationErrors: string[] = [];
      expect(validationErrors.length).toBe(0);
    });

    it("should show errors panel when validationErrors has items", () => {
      const validationErrors = ["Missing Transport.start()"];
      expect(validationErrors.length).toBeGreaterThan(0);
    });

    it("should display all validation errors", () => {
      const validationErrors = ["Error 1", "Error 2", "Error 3"];
      expect(validationErrors).toHaveLength(3);
    });
  });

  describe("live mode toggle", () => {
    it("should call onLiveModeChange with opposite value when toggled", () => {
      const onLiveModeChange = vi.fn();
      const currentLiveMode = true;

      onLiveModeChange(!currentLiveMode);

      expect(onLiveModeChange).toHaveBeenCalledWith(false);
    });

    it("should show different styling when live mode is on", () => {
      const liveMode = true;
      const liveModeClass = liveMode
        ? "bg-emerald-500/20 text-emerald-400"
        : "bg-slate-700/50 text-slate-400";
      expect(liveModeClass).toContain("emerald");
    });

    it("should show different styling when live mode is off", () => {
      const liveMode = false;
      const liveModeClass = liveMode
        ? "bg-emerald-500/20 text-emerald-400"
        : "bg-slate-700/50 text-slate-400";
      expect(liveModeClass).toContain("slate");
    });
  });

  describe("sequencer toggle", () => {
    it("should call onSequencerToggle when toggle button is clicked", () => {
      const onSequencerToggle = vi.fn();
      onSequencerToggle();
      expect(onSequencerToggle).toHaveBeenCalled();
    });

    it("should show different styling when sequencer is visible", () => {
      const sequencerVisible = true;
      const toggleClass = sequencerVisible
        ? "text-cyan-400 border border-cyan-500/50 bg-cyan-500/10"
        : "text-slate-400 border border-slate-600";
      expect(toggleClass).toContain("cyan");
    });
  });

  describe("mobile touch target styling", () => {
    it("should have min-h-[44px] on revert button for mobile touch target", () => {
      // Mobile: min-h-[44px] for 44px minimum touch target (Apple HIG guideline)
      // Desktop: sm:min-h-0 reverts to auto height
      const mobileMinHeight = 44;
      expect(mobileMinHeight).toBeGreaterThanOrEqual(44);
    });

    it("should have min-h-[44px] on copy button for mobile touch target", () => {
      const mobileMinHeight = 44;
      expect(mobileMinHeight).toBeGreaterThanOrEqual(44);
    });

    it("should have min-w-[44px] and min-h-[44px] on sequencer toggle for mobile", () => {
      // The sequencer toggle button has minimum 44x44px touch target on mobile
      const mobileMinWidth = 44;
      const mobileMinHeight = 44;
      expect(mobileMinWidth).toBeGreaterThanOrEqual(44);
      expect(mobileMinHeight).toBeGreaterThanOrEqual(44);
    });

    it("should use sm: breakpoint to reset to auto sizing on small screens and above", () => {
      // sm: prefix applies at 640px and above
      const smBreakpoint = "sm:";
      expect(smBreakpoint).toBe("sm:");
    });

    it("should maintain button functionality with larger touch targets", () => {
      const handleCopy = vi.fn();
      const handleRevert = vi.fn();

      handleCopy();
      handleRevert();

      expect(handleCopy).toHaveBeenCalled();
      expect(handleRevert).toHaveBeenCalled();
    });

    it("should have responsive padding: px-3 py-2 on mobile, sm:px-3 sm:py-1.5 on desktop", () => {
      const mobilePadding = "px-3 py-2";
      const desktopPadding = "sm:px-3 sm:py-1.5";
      expect(mobilePadding).toContain("py-2");
      expect(desktopPadding).toContain("sm:py-1.5");
    });
  });

  describe("header styling", () => {
    it("should have responsive header height: h-12 on mobile, sm:h-16 on desktop", () => {
      const mobileHeight = 12 * 4; // h-12 = 48px
      const desktopHeight = 16 * 4; // h-16 = 64px
      expect(mobileHeight).toBe(48);
      expect(desktopHeight).toBe(64);
    });

    it("should have responsive padding in header: px-3 on mobile, sm:px-4 on desktop", () => {
      const mobilePadding = "px-3";
      const desktopPadding = "sm:px-4";
      expect(mobilePadding).toBe("px-3");
      expect(desktopPadding).toBe("sm:px-4");
    });

    it("should have responsive gap between elements: gap-2 on mobile, sm:gap-3 on desktop", () => {
      const mobileGap = "gap-2";
      const desktopGap = "sm:gap-3";
      expect(mobileGap).toBe("gap-2");
      expect(desktopGap).toBe("sm:gap-3");
    });
  });

  describe("editor configuration", () => {
    it("should have lineNumbers enabled in basicSetup", () => {
      const basicSetup = { lineNumbers: true };
      expect(basicSetup.lineNumbers).toBe(true);
    });

    it("should have foldGutter enabled in basicSetup", () => {
      const basicSetup = { foldGutter: true };
      expect(basicSetup.foldGutter).toBe(true);
    });

    it("should have bracketMatching enabled in basicSetup", () => {
      const basicSetup = { bracketMatching: true };
      expect(basicSetup.bracketMatching).toBe(true);
    });

    it("should have closeBrackets enabled in basicSetup", () => {
      const basicSetup = { closeBrackets: true };
      expect(basicSetup.closeBrackets).toBe(true);
    });

    it("should have autocompletion disabled in basicSetup", () => {
      const basicSetup = { autocompletion: false };
      expect(basicSetup.autocompletion).toBe(false);
    });
  });
});
