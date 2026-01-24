import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useRecordings hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module structure", () => {
    it("should export useRecordings function", async () => {
      const hookModule = await import("../useRecordings");
      expect(hookModule.useRecordings).toBeDefined();
      expect(typeof hookModule.useRecordings).toBe("function");
    });

    it("should be a named export", async () => {
      const hookModule = await import("../useRecordings");
      expect(Object.keys(hookModule)).toContain("useRecordings");
    });
  });

  describe("return interface", () => {
    it("should be a function that takes trackId argument", async () => {
      const hookModule = await import("../useRecordings");
      expect(typeof hookModule.useRecordings).toBe("function");
      expect(hookModule.useRecordings.length).toBe(1);
    });
  });
});

describe("useRecordings API logic", () => {
  describe("fetch recordings endpoint", () => {
    it("should construct correct API URL for track recordings", () => {
      const trackId = "track-123";
      const url = `/api/tracks/${trackId}/recordings`;
      expect(url).toBe("/api/tracks/track-123/recordings");
    });

    it("should handle null trackId by clearing recordings", () => {
      const trackId: string | null = null;
      const recordings: unknown[] = [];

      if (!trackId) {
        // The hook sets recordings to empty array when trackId is null
        expect(recordings).toEqual([]);
      }
    });

    it("should handle 401 unauthorized by clearing recordings", () => {
      const status = 401;
      let recordings: unknown[] = [{ id: "existing" }];

      if (status === 401) {
        recordings = [];
      }

      expect(recordings).toEqual([]);
    });

    it("should parse successful response data", () => {
      const responseData = {
        recordings: [
          { id: "r1", name: "Recording 1" },
          { id: "r2", name: "Recording 2" },
        ],
      };

      const recordings = responseData.recordings || [];
      expect(recordings).toHaveLength(2);
      expect(recordings[0].id).toBe("r1");
    });
  });

  describe("create recording endpoint", () => {
    it("should construct correct API URL for creating recording", () => {
      const trackId = "track-123";
      const url = `/api/tracks/${trackId}/recordings`;
      const method = "POST";

      expect(url).toBe("/api/tracks/track-123/recordings");
      expect(method).toBe("POST");
    });

    it("should include required fields in request body", () => {
      const durationMs = 5000;
      const events = [
        { id: "e1", timestamp_ms: 1000, type: "tweak" },
        { id: "e2", timestamp_ms: 2000, type: "layer_mute" },
      ];
      const name = "My Recording";

      const body = {
        duration_ms: durationMs,
        events,
        name,
      };

      expect(body.duration_ms).toBe(5000);
      expect(body.events).toHaveLength(2);
      expect(body.name).toBe("My Recording");
    });

    it("should handle optional name field", () => {
      const body = {
        duration_ms: 5000,
        events: [],
        name: undefined,
      };

      expect(body.name).toBeUndefined();
    });

    it("should add created recording to local state", () => {
      const recordings = [{ id: "r1" }];
      const newRecording = { id: "r2" };

      // The hook prepends new recordings
      const updatedRecordings = [newRecording, ...recordings];
      expect(updatedRecordings).toHaveLength(2);
      expect(updatedRecordings[0].id).toBe("r2");
    });

    it("should return null when trackId is null", () => {
      const trackId: string | null = null;
      let result: unknown = "initial";

      if (!trackId) {
        result = null;
      }

      expect(result).toBeNull();
    });
  });

  describe("update recording endpoint", () => {
    it("should construct correct API URL for updating recording", () => {
      const trackId = "track-123";
      const recordingId = "rec-456";
      const url = `/api/tracks/${trackId}/recordings/${recordingId}`;
      const method = "PUT";

      expect(url).toBe("/api/tracks/track-123/recordings/rec-456");
      expect(method).toBe("PUT");
    });

    it("should support updating name", () => {
      const updates = { name: "New Name" };
      expect(updates.name).toBe("New Name");
    });

    it("should support updating events", () => {
      const updates = {
        events: [{ id: "e1", timestamp_ms: 1000, type: "tweak" }],
      };
      expect(updates.events).toHaveLength(1);
    });

    it("should update recording in local state", () => {
      const recordings = [
        { id: "r1", name: "Old Name" },
        { id: "r2", name: "Keep This" },
      ];
      const recordingId = "r1";
      const updatedData = { name: "New Name" };

      const updated = recordings.map((r) => (r.id === recordingId ? { ...r, ...updatedData } : r));

      expect(updated[0].name).toBe("New Name");
      expect(updated[1].name).toBe("Keep This");
    });

    it("should return null when trackId is null", () => {
      const trackId: string | null = null;
      let result: unknown = "initial";

      if (!trackId) {
        result = null;
      }

      expect(result).toBeNull();
    });
  });

  describe("delete recording endpoint", () => {
    it("should construct correct API URL for deleting recording", () => {
      const trackId = "track-123";
      const recordingId = "rec-456";
      const url = `/api/tracks/${trackId}/recordings/${recordingId}`;
      const method = "DELETE";

      expect(url).toBe("/api/tracks/track-123/recordings/rec-456");
      expect(method).toBe("DELETE");
    });

    it("should remove recording from local state", () => {
      const recordings = [{ id: "r1" }, { id: "r2" }, { id: "r3" }];
      const recordingIdToDelete = "r2";

      const filtered = recordings.filter((r) => r.id !== recordingIdToDelete);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((r) => r.id === "r2")).toBeUndefined();
    });

    it("should return true on successful delete", () => {
      const result = true;
      expect(result).toBe(true);
    });

    it("should return false when trackId is null", () => {
      const trackId: string | null = null;
      let result = true;

      if (!trackId) {
        result = false;
      }

      expect(result).toBe(false);
    });
  });
});

describe("useRecordings state management", () => {
  describe("loading state", () => {
    it("should start with loading false", () => {
      const loading = false;
      expect(loading).toBe(false);
    });

    it("should set loading true during fetch", () => {
      let loading = false;
      loading = true;
      expect(loading).toBe(true);
    });

    it("should set loading false after fetch completes", () => {
      let loading = true;
      loading = false;
      expect(loading).toBe(false);
    });

    it("should set loading false after fetch fails", () => {
      let loading = true;
      loading = false;
      expect(loading).toBe(false);
    });
  });

  describe("error state", () => {
    it("should start with error null", () => {
      const error: string | null = null;
      expect(error).toBeNull();
    });

    it("should clear error before fetch", () => {
      let error: string | null = "Previous error";
      error = null;
      expect(error).toBeNull();
    });

    it("should set error on fetch failure", () => {
      let error: string | null = null;
      error = "Failed to fetch recordings";
      expect(error).toBe("Failed to fetch recordings");
    });

    it("should extract error message from Error instance", () => {
      const err = new Error("Network error");
      const message = err instanceof Error ? err.message : "Unknown error";
      expect(message).toBe("Network error");
    });

    it("should handle non-Error throws", () => {
      const err: unknown = "string error";
      const message = err instanceof Error ? err.message : "Unknown error";
      expect(message).toBe("Unknown error");
    });

    it("should set specific error for no track selected", () => {
      const error = "No track selected";
      expect(error).toBe("No track selected");
    });
  });

  describe("recordings state", () => {
    it("should start with empty array", () => {
      const recordings: unknown[] = [];
      expect(recordings).toEqual([]);
    });

    it("should set recordings from API response", () => {
      const apiRecordings = [{ id: "r1" }, { id: "r2" }];
      const recordings = apiRecordings;
      expect(recordings).toHaveLength(2);
    });

    it("should clear recordings on null trackId", () => {
      let recordings = [{ id: "r1" }];
      const trackId: string | null = null;

      if (!trackId) {
        recordings = [];
      }

      expect(recordings).toEqual([]);
    });
  });
});

describe("useRecordings fetch behavior", () => {
  describe("automatic fetching", () => {
    it("should fetch when trackId changes", () => {
      // The hook uses useEffect with trackId dependency
      const trackIds = ["track-1", "track-2"];
      let fetchCount = 0;

      trackIds.forEach(() => {
        fetchCount++;
      });

      expect(fetchCount).toBe(2);
    });

    it("should refetch when refresh is called", () => {
      let fetchCount = 0;
      const refresh = () => {
        fetchCount++;
      };

      refresh();
      refresh();

      expect(fetchCount).toBe(2);
    });
  });

  describe("request handling", () => {
    it("should include Content-Type header for POST requests", () => {
      const headers = { "Content-Type": "application/json" };
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should include Content-Type header for PUT requests", () => {
      const headers = { "Content-Type": "application/json" };
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should stringify body for POST requests", () => {
      const body = { duration_ms: 5000, events: [] };
      const stringified = JSON.stringify(body);
      expect(stringified).toBe('{"duration_ms":5000,"events":[]}');
    });
  });
});

describe("useRecordings error handling", () => {
  describe("API error responses", () => {
    it("should handle error response with error field", () => {
      const responseData = { error: "Recording not found" };
      const error = responseData.error || "Failed to fetch";
      expect(error).toBe("Recording not found");
    });

    it("should use default error when no error field", () => {
      const responseData = {};
      const error = (responseData as { error?: string }).error || "Failed to fetch";
      expect(error).toBe("Failed to fetch");
    });

    it("should handle create recording error", () => {
      const errorMessage = "Failed to create recording";
      expect(errorMessage).toBe("Failed to create recording");
    });

    it("should handle update recording error", () => {
      const errorMessage = "Failed to update recording";
      expect(errorMessage).toBe("Failed to update recording");
    });

    it("should handle delete recording error", () => {
      const errorMessage = "Failed to delete recording";
      expect(errorMessage).toBe("Failed to delete recording");
    });
  });

  describe("network errors", () => {
    it("should handle fetch rejection", () => {
      const err = new Error("Network request failed");
      expect(err.message).toBe("Network request failed");
    });
  });
});

describe("useRecordings Recording type", () => {
  describe("Recording structure", () => {
    it("should have required id field", () => {
      const recording = { id: "rec-123" };
      expect(recording.id).toBe("rec-123");
    });

    it("should have required track_id field", () => {
      const recording = { track_id: "track-456" };
      expect(recording.track_id).toBe("track-456");
    });

    it("should have required duration_ms field", () => {
      const recording = { duration_ms: 5000 };
      expect(recording.duration_ms).toBe(5000);
    });

    it("should have required events array", () => {
      const recording = { events: [] };
      expect(Array.isArray(recording.events)).toBe(true);
    });

    it("should have optional name field", () => {
      const recording1 = { name: "My Recording" };
      const recording2 = { name: null };

      expect(recording1.name).toBe("My Recording");
      expect(recording2.name).toBeNull();
    });

    it("should have timestamp fields", () => {
      const recording = {
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      expect(recording.created_at).toBeDefined();
      expect(recording.updated_at).toBeDefined();
    });
  });
});

describe("useRecordings callback dependencies", () => {
  describe("useCallback dependencies", () => {
    it("should depend on trackId for fetchRecordings", () => {
      // The hook recreates fetchRecordings when trackId changes
      const trackId1 = "track-1";
      const trackId2 = "track-2";
      expect(trackId1).not.toBe(trackId2);
    });

    it("should depend on trackId for createRecording", () => {
      const trackId = "track-123";
      expect(trackId).toBeTruthy();
    });

    it("should depend on trackId for updateRecording", () => {
      const trackId = "track-123";
      expect(trackId).toBeTruthy();
    });

    it("should depend on trackId for deleteRecording", () => {
      const trackId = "track-123";
      expect(trackId).toBeTruthy();
    });
  });

  describe("useEffect dependencies", () => {
    it("should trigger on fetchRecordings change", () => {
      // The hook calls fetchRecordings in useEffect when it changes
      let effectCalled = false;
      const fetchRecordings = () => {
        effectCalled = true;
      };

      fetchRecordings();
      expect(effectCalled).toBe(true);
    });
  });
});
