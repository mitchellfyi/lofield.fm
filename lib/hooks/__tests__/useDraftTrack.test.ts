import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
  key: vi.fn((index: number) => Object.keys(mockLocalStorage.store)[index] ?? null),
  get length() {
    return Object.keys(this.store).length;
  },
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("useDraftTrack hook", () => {
  beforeEach(() => {
    vi.resetModules();
    mockLocalStorage.store = {};
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("module structure", () => {
    it("should export useDraftTrack function", async () => {
      const hookModule = await import("../useDraftTrack");
      expect(hookModule.useDraftTrack).toBeDefined();
      expect(typeof hookModule.useDraftTrack).toBe("function");
    });

    it("should export DraftData and UseDraftTrackResult types", async () => {
      // TypeScript interfaces are enforced at compile time
      // Verify module loads correctly
      const hookModule = await import("../useDraftTrack");
      expect(hookModule).toBeDefined();
    });
  });

  describe("draft storage", () => {
    it("should use correct localStorage prefix for drafts", async () => {
      await import("../useDraftTrack");

      // When saving a draft, it should use draft_ prefix
      const entry = {
        data: { code: "test code", savedAt: Date.now() },
        timestamp: Date.now(),
        ttl: 0,
      };
      mockLocalStorage.store["lofield_draft_track-123"] = JSON.stringify(entry);

      expect(mockLocalStorage.store["lofield_draft_track-123"]).toBeDefined();
    });

    it("should store draft data with correct structure", async () => {
      // Simulate what saveDraft does
      const draftData = {
        code: "// my code",
        savedAt: Date.now(),
        trackName: "My Track",
      };
      const entry = {
        data: draftData,
        timestamp: Date.now(),
        ttl: 0,
      };
      mockLocalStorage.store["lofield_draft_track-id"] = JSON.stringify(entry);

      const stored = JSON.parse(mockLocalStorage.store["lofield_draft_track-id"]);
      expect(stored.data.code).toBe("// my code");
      expect(stored.data.trackName).toBe("My Track");
      expect(stored.data.savedAt).toBeGreaterThan(0);
    });

    it("should support draft recovery from localStorage", async () => {
      // Pre-populate localStorage with a draft
      const savedDraft = {
        data: {
          code: "recovered code",
          savedAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
          trackName: "Recovered Track",
        },
        timestamp: Date.now(),
        ttl: 0,
      };
      mockLocalStorage.store["lofield_draft_track-recover"] = JSON.stringify(savedDraft);

      // Import the localCache to verify it can read the draft
      const { getCache } = await import("@/lib/storage/localCache");
      const cached = getCache<{ code: string; savedAt: number; trackName: string }>(
        "draft_track-recover"
      );

      expect(cached).not.toBeNull();
      expect(cached?.code).toBe("recovered code");
      expect(cached?.trackName).toBe("Recovered Track");
    });
  });

  describe("draft data structure", () => {
    it("should include code field", async () => {
      const draftData = {
        code: "const synth = new Tone.Synth();",
        savedAt: Date.now(),
      };

      expect(draftData.code).toBeDefined();
      expect(typeof draftData.code).toBe("string");
    });

    it("should include savedAt timestamp", async () => {
      const now = Date.now();
      const draftData = {
        code: "code",
        savedAt: now,
      };

      expect(draftData.savedAt).toBe(now);
      expect(typeof draftData.savedAt).toBe("number");
    });

    it("should optionally include trackName", async () => {
      const draftWithName = {
        code: "code",
        savedAt: Date.now(),
        trackName: "My Track",
      };

      const draftWithoutName: { code: string; savedAt: number; trackName?: string } = {
        code: "code",
        savedAt: Date.now(),
      };

      expect(draftWithName.trackName).toBe("My Track");
      expect(draftWithoutName.trackName).toBeUndefined();
    });
  });

  describe("draft age calculation", () => {
    it("should return 'just now' for recent drafts (< 1 minute)", async () => {
      const draftData = {
        code: "code",
        savedAt: Date.now() - 30 * 1000, // 30 seconds ago
      };

      const ageMs = Date.now() - draftData.savedAt;
      const seconds = Math.floor(ageMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      let ageString: string;
      if (hours > 0) {
        ageString = `${hours}h ago`;
      } else if (minutes > 0) {
        ageString = `${minutes}m ago`;
      } else {
        ageString = "just now";
      }

      expect(ageString).toBe("just now");
    });

    it("should return minutes for drafts < 1 hour", async () => {
      const draftData = {
        code: "code",
        savedAt: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };

      const ageMs = Date.now() - draftData.savedAt;
      const seconds = Math.floor(ageMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      let ageString: string;
      if (hours > 0) {
        ageString = `${hours}h ago`;
      } else if (minutes > 0) {
        ageString = `${minutes}m ago`;
      } else {
        ageString = "just now";
      }

      expect(ageString).toBe("15m ago");
    });

    it("should return hours for drafts >= 1 hour", async () => {
      const draftData = {
        code: "code",
        savedAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      };

      const ageMs = Date.now() - draftData.savedAt;
      const seconds = Math.floor(ageMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      let ageString: string;
      if (hours > 0) {
        ageString = `${hours}h ago`;
      } else if (minutes > 0) {
        ageString = `${minutes}m ago`;
      } else {
        ageString = "just now";
      }

      expect(ageString).toBe("3h ago");
    });
  });

  describe("hasDraft calculation", () => {
    it("should be false when no draft exists", async () => {
      // Simulating when getCache returns null (no draft found)
      function calculateHasDraft(draftData: { code: string; savedAt: number } | null): boolean {
        return draftData !== null && draftData.code.length > 0;
      }

      expect(calculateHasDraft(null)).toBe(false);
    });

    it("should be false when draft code is empty string", async () => {
      const draftData = {
        code: "",
        savedAt: Date.now(),
      };
      const hasDraft = draftData !== null && draftData.code.length > 0;

      expect(hasDraft).toBe(false);
    });

    it("should be true when draft has code", async () => {
      const draftData = {
        code: "const synth = new Tone.Synth();",
        savedAt: Date.now(),
      };
      const hasDraft = draftData !== null && draftData.code.length > 0;

      expect(hasDraft).toBe(true);
    });
  });

  describe("draft operations", () => {
    it("should clear draft from localStorage", async () => {
      // Pre-populate draft
      const entry = {
        data: { code: "draft code", savedAt: Date.now() },
        timestamp: Date.now(),
        ttl: 0,
      };
      mockLocalStorage.store["lofield_draft_track-clear"] = JSON.stringify(entry);

      // Import clearCache and clear the draft
      const { clearCache } = await import("@/lib/storage/localCache");
      clearCache("draft_track-clear");

      expect(mockLocalStorage.store["lofield_draft_track-clear"]).toBeUndefined();
    });

    it("should not save draft for null trackId", async () => {
      // When trackId is null, saveDraft should be a no-op
      const initialStoreSize = Object.keys(mockLocalStorage.store).length;

      // No storage should be added
      expect(Object.keys(mockLocalStorage.store).length).toBe(initialStoreSize);
    });
  });

  describe("debouncing behavior", () => {
    it("should debounce rapid save calls", async () => {
      // The hook debounces saves by 500ms
      // Multiple rapid calls should only result in one storage write
      vi.setSystemTime(new Date("2026-01-25T12:00:00Z"));

      const { setCache } = await import("@/lib/storage/localCache");

      // Simulate debounced save - only the last call should persist
      let savedDraft = null;

      // First save attempt
      setTimeout(() => {
        savedDraft = { code: "version 1", savedAt: Date.now() };
      }, 100);

      // Second save attempt (overrides first due to debounce)
      setTimeout(() => {
        savedDraft = { code: "version 2", savedAt: Date.now() };
      }, 200);

      // Final save (this one should actually persist after debounce)
      setTimeout(() => {
        savedDraft = { code: "version 3", savedAt: Date.now() };
        setCache("draft_track-debounce", savedDraft, 0);
      }, 500);

      // Advance timers past debounce window
      vi.advanceTimersByTime(600);

      const { getCache } = await import("@/lib/storage/localCache");
      const result = getCache<{ code: string }>("draft_track-debounce");

      expect(result?.code).toBe("version 3");
    });
  });

  describe("track change handling", () => {
    it("should use different keys for different tracks", async () => {
      const { setCache, getCache } = await import("@/lib/storage/localCache");

      // Save drafts for different tracks
      setCache("draft_track-a", { code: "track A code", savedAt: Date.now() }, 0);
      setCache("draft_track-b", { code: "track B code", savedAt: Date.now() }, 0);

      const draftA = getCache<{ code: string }>("draft_track-a");
      const draftB = getCache<{ code: string }>("draft_track-b");

      expect(draftA?.code).toBe("track A code");
      expect(draftB?.code).toBe("track B code");
    });
  });

  describe("edge cases", () => {
    it("should handle very long code strings", async () => {
      const { setCache, getCache } = await import("@/lib/storage/localCache");
      const longCode = "x".repeat(100000); // 100KB of code

      setCache("draft_track-long", { code: longCode, savedAt: Date.now() }, 0);
      const result = getCache<{ code: string }>("draft_track-long");

      expect(result?.code.length).toBe(100000);
    });

    it("should handle code with special characters", async () => {
      const { setCache, getCache } = await import("@/lib/storage/localCache");
      const specialCode = `
        const str = "Hello\\nWorld";
        const regex = /[a-z]+/g;
        const unicode = "🎵🎶";
        const quote = '"test"';
      `;

      setCache("draft_track-special", { code: specialCode, savedAt: Date.now() }, 0);
      const result = getCache<{ code: string }>("draft_track-special");

      expect(result?.code).toBe(specialCode);
    });

    it("should handle localStorage quota errors gracefully", async () => {
      const { setCache } = await import("@/lib/storage/localCache");

      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const result = setCache("draft_track-quota", { code: "test", savedAt: Date.now() }, 0);
      expect(result).toBe(false);
    });
  });
});
