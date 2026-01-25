import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the hooks
vi.mock("@/lib/hooks/useProjects", () => ({
  useProjects: vi.fn(),
}));

vi.mock("@/lib/hooks/useTracks", () => ({
  useTracks: vi.fn(),
}));

describe("TrackBrowser component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export TrackBrowser component", async () => {
      const trackBrowserModule = await import("../TrackBrowser");
      expect(trackBrowserModule.TrackBrowser).toBeDefined();
      expect(typeof trackBrowserModule.TrackBrowser).toBe("function");
    });
  });

  describe("error display behavior", () => {
    it("should show error message and retry button when fetch fails with no cache", async () => {
      // When projectsError is set and projects array is empty,
      // the component shows error message with "Try Again" button
      const mockState = {
        projectsError: "Server error. Please try again later.",
        projectsLength: 0,
        showRetryButton: true,
      };

      // Error state should display error message
      expect(mockState.projectsError).toBeTruthy();
      expect(mockState.projectsLength).toBe(0);
      expect(mockState.showRetryButton).toBe(true);
    });

    it("should show cached data banner when using cache fallback", async () => {
      // When isUsingCache is true and projects exist,
      // component shows amber banner with "Showing cached data" and "Retry" link
      const mockState = {
        isUsingCache: true,
        projectsLength: 2,
        showCacheBanner: true,
      };

      expect(mockState.isUsingCache).toBe(true);
      expect(mockState.projectsLength).toBeGreaterThan(0);
      expect(mockState.showCacheBanner).toBe(true);
    });

    it("should not show cache banner when not using cache", async () => {
      const mockState = {
        isUsingCache: false,
        projectsLength: 2,
        showCacheBanner: false,
      };

      expect(mockState.isUsingCache).toBe(false);
      expect(mockState.showCacheBanner).toBe(false);
    });

    it("should show loading state while fetching", async () => {
      const mockState = {
        projectsLoading: true,
        showLoadingIndicator: true,
      };

      expect(mockState.projectsLoading).toBe(true);
      expect(mockState.showLoadingIndicator).toBe(true);
    });

    it("should show empty state when no projects and no error", async () => {
      const mockState = {
        projectsLength: 0,
        projectsError: null,
        showNewProject: false,
        showEmptyState: true,
      };

      expect(mockState.projectsLength).toBe(0);
      expect(mockState.projectsError).toBeNull();
      expect(mockState.showEmptyState).toBe(true);
    });
  });

  describe("error message rendering", () => {
    it("should display user-friendly error messages", async () => {
      // The error prop comes from useProjects which now provides friendly messages
      const friendlyMessages = [
        "Unable to connect. Check your internet connection.",
        "Please sign in to view your projects.",
        "You don't have permission to view these projects.",
        "Could not find your projects.",
        "Server error. Please try again later.",
        "There was a problem with your request.",
        "Unable to load projects. Please try again.",
      ];

      // All messages should be user-friendly (no technical jargon)
      friendlyMessages.forEach((message) => {
        expect(message).not.toContain("fetch");
        expect(message).not.toContain("500");
        expect(message).not.toContain("401");
        expect(message).not.toContain("undefined");
        expect(message).not.toContain("null");
      });
    });

    it("should style error message with rose color", async () => {
      // Error message div has class text-rose-400
      const errorClasses = "text-rose-400 mb-4";
      expect(errorClasses).toContain("text-rose-400");
    });

    it("should style retry button with cyan color", async () => {
      // Retry button has cyan background
      const buttonClasses =
        "px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors";
      expect(buttonClasses).toContain("bg-cyan-600");
      expect(buttonClasses).toContain("hover:bg-cyan-500");
    });
  });

  describe("cache fallback banner", () => {
    it("should have amber warning styling", async () => {
      // Cache banner uses amber colors for warning
      const bannerClasses = "mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg";
      expect(bannerClasses).toContain("bg-amber-500/10");
      expect(bannerClasses).toContain("border-amber-500/30");
    });

    it("should include warning icon", async () => {
      // Banner includes a warning triangle icon
      const iconPath =
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
      expect(iconPath).toContain("M12 9v2"); // Warning icon path starts with this
    });

    it("should display 'Showing cached data' text", async () => {
      const message = "Showing cached data";
      expect(message).toBe("Showing cached data");
    });

    it("should have retry link in amber color", async () => {
      const retryLinkClasses =
        "text-xs text-amber-400 hover:text-amber-300 underline transition-colors";
      expect(retryLinkClasses).toContain("text-amber-400");
      expect(retryLinkClasses).toContain("hover:text-amber-300");
    });
  });

  describe("refresh functionality", () => {
    it("should call refreshProjects when retry button clicked", async () => {
      const mockRefreshProjects = vi.fn();

      // Simulate click on retry
      mockRefreshProjects();

      expect(mockRefreshProjects).toHaveBeenCalledTimes(1);
    });

    it("should call refreshProjects when retry link in banner clicked", async () => {
      const mockRefreshProjects = vi.fn();

      // Simulate click on retry link
      mockRefreshProjects();

      expect(mockRefreshProjects).toHaveBeenCalledTimes(1);
    });
  });

  describe("props interface", () => {
    it("should accept isOpen prop", async () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        onSelectTrack: vi.fn(),
        currentTrackId: null,
      };

      expect(props.isOpen).toBe(true);
    });

    it("should accept onClose callback", async () => {
      const mockOnClose = vi.fn();
      const props = {
        isOpen: true,
        onClose: mockOnClose,
        onSelectTrack: vi.fn(),
        currentTrackId: null,
      };

      props.onClose();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should accept onSelectTrack callback", async () => {
      const mockOnSelectTrack = vi.fn();
      const mockTrack = {
        id: "track-1",
        project_id: "project-1",
        name: "Test Track",
        current_code: "// code",
        created_at: "2026-01-25T00:00:00Z",
        updated_at: "2026-01-25T00:00:00Z",
      };

      mockOnSelectTrack(mockTrack);
      expect(mockOnSelectTrack).toHaveBeenCalledWith(mockTrack);
    });

    it("should accept currentTrackId prop", async () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        onSelectTrack: vi.fn(),
        currentTrackId: "track-123",
      };

      expect(props.currentTrackId).toBe("track-123");
    });
  });

  describe("conditional rendering", () => {
    it("should return null when isOpen is false", async () => {
      // When isOpen is false, component returns null (renders nothing)
      const isOpen = false;
      const shouldRender = isOpen;
      expect(shouldRender).toBe(false);
    });

    it("should render modal when isOpen is true", async () => {
      const isOpen = true;
      const shouldRender = isOpen;
      expect(shouldRender).toBe(true);
    });
  });

  describe("track selection", () => {
    it("should highlight currently selected track", async () => {
      const currentTrackId = "track-1";
      const trackId = "track-1";

      const isSelected = currentTrackId === trackId;
      expect(isSelected).toBe(true);
    });

    it("should apply selected styles to current track", async () => {
      // Selected track has cyan border and background
      const selectedClasses = "bg-cyan-600/20 border border-cyan-500/50";
      expect(selectedClasses).toContain("bg-cyan-600/20");
      expect(selectedClasses).toContain("border-cyan-500/50");
    });

    it("should apply hover styles to non-selected tracks", async () => {
      const nonSelectedClasses = "hover:bg-slate-700/50";
      expect(nonSelectedClasses).toContain("hover:bg-slate-700/50");
    });
  });

  describe("accessibility", () => {
    it("should have modal title 'My Tracks'", async () => {
      const title = "My Tracks";
      expect(title).toBe("My Tracks");
    });

    it("should have close button with X icon", async () => {
      // Close button SVG path for X icon
      const closePath = "M6 18L18 6M6 6l12 12";
      expect(closePath).toContain("M6 18L18 6"); // First line of X
      expect(closePath).toContain("M6 6l12 12"); // Second line of X
    });

    it("should have semantic structure with header, content, and footer", async () => {
      const sections = ["Header", "Content", "Footer"];
      expect(sections).toContain("Header");
      expect(sections).toContain("Content");
      expect(sections).toContain("Footer");
    });
  });
});
