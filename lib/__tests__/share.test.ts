import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSharedTrack,
  getTrackShareInfo,
  generateShare,
  updateSharePrivacy,
  revokeShare,
} from "@/lib/share";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PrivacyLevel } from "@/lib/types/share";

// Mock Supabase service client
let mockSupabaseClient: Record<string, unknown>;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock share token utilities
vi.mock("@/lib/share/token", () => ({
  generateShareToken: vi.fn(() => "test-share-token"),
  buildShareUrl: vi.fn((token: string) => `https://lofield.fm/share/${token}`),
}));

const MOCK_USER_ID = "user-123";
const MOCK_TRACK_ID = "track-123";
const MOCK_SHARE_TOKEN = "existing-share-token";

const MOCK_TRACK = {
  id: MOCK_TRACK_ID,
  name: "Test Track",
  current_code: "// test code",
  created_at: "2024-01-01T00:00:00Z",
  privacy: "private",
  share_token: null,
  shared_at: null,
  project: { user_id: MOCK_USER_ID },
};

const MOCK_SHARED_TRACK = {
  ...MOCK_TRACK,
  privacy: "unlisted",
  share_token: MOCK_SHARE_TOKEN,
  shared_at: "2024-01-02T00:00:00Z",
};

describe("share service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup
    mockSupabaseClient = {
      from: vi.fn(() => mockSupabaseClient),
      select: vi.fn(() => mockSupabaseClient),
      eq: vi.fn(() => mockSupabaseClient),
      in: vi.fn(() => mockSupabaseClient),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => mockSupabaseClient),
    };
  });

  describe("getSharedTrack", () => {
    it("returns null when token not found", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      mockSupabaseClient.single = mockSingle;

      const result = await getSharedTrack("invalid-token");

      expect(result).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("tracks");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("share_token", "invalid-token");
      expect(mockSupabaseClient.in).toHaveBeenCalledWith("privacy", ["public", "unlisted"]);
    });

    it("returns null for private tracks", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      mockSupabaseClient.single = mockSingle;

      const result = await getSharedTrack(MOCK_SHARE_TOKEN);

      expect(result).toBeNull();
    });

    it("returns public track data without author name when profile not found", async () => {
      const publicTrack = { ...MOCK_SHARED_TRACK, privacy: "public" };

      // First query returns track
      let queryCount = 0;
      mockSupabaseClient.single = vi.fn().mockImplementation(() => {
        queryCount++;
        if (queryCount === 1) {
          return Promise.resolve({ data: publicTrack, error: null });
        }
        // Second query (profile) returns nothing
        return Promise.resolve({ data: null, error: null });
      });

      const result = await getSharedTrack(MOCK_SHARE_TOKEN);

      expect(result).toEqual({
        id: MOCK_TRACK_ID,
        name: "Test Track",
        current_code: "// test code",
        created_at: "2024-01-01T00:00:00Z",
        privacy: "public",
        author_name: null,
      });
    });

    it("returns track data with author name when available", async () => {
      const publicTrack = { ...MOCK_SHARED_TRACK, privacy: "public" };

      // First query returns track
      let queryCount = 0;
      mockSupabaseClient.single = vi.fn().mockImplementation(() => {
        queryCount++;
        if (queryCount === 1) {
          return Promise.resolve({ data: publicTrack, error: null });
        }
        // Second query returns profile
        return Promise.resolve({ data: { display_name: "Test User" }, error: null });
      });

      // Need to reset 'from' between queries
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === "profiles") {
          mockSupabaseClient.eq = vi.fn(() => mockSupabaseClient);
        }
        return mockSupabaseClient;
      });

      const result = await getSharedTrack(MOCK_SHARE_TOKEN);

      expect(result).toEqual({
        id: MOCK_TRACK_ID,
        name: "Test Track",
        current_code: "// test code",
        created_at: "2024-01-01T00:00:00Z",
        privacy: "public",
        author_name: "Test User",
      });
    });
  });

  describe("getTrackShareInfo", () => {
    it("returns null when track not found", async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      const result = await getTrackShareInfo(MOCK_USER_ID, MOCK_TRACK_ID);

      expect(result).toBeNull();
    });

    it("returns null when user does not own track", async () => {
      const trackWithDifferentOwner = {
        ...MOCK_TRACK,
        project: { user_id: "different-user" },
      };

      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: trackWithDifferentOwner,
        error: null,
      });

      const result = await getTrackShareInfo(MOCK_USER_ID, MOCK_TRACK_ID);

      expect(result).toBeNull();
    });

    it("returns track data when user owns track", async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: MOCK_TRACK,
        error: null,
      });

      const result = await getTrackShareInfo(MOCK_USER_ID, MOCK_TRACK_ID);

      expect(result).toEqual({
        id: MOCK_TRACK_ID,
        name: "Test Track",
        current_code: "// test code",
        created_at: "2024-01-01T00:00:00Z",
        privacy: "private",
        share_token: null,
        shared_at: null,
      });
    });

    it("throws error on database error", async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "UNEXPECTED", message: "Database error" },
      });

      await expect(getTrackShareInfo(MOCK_USER_ID, MOCK_TRACK_ID)).rejects.toThrow(
        "Failed to fetch track share info: Database error"
      );
    });
  });

  describe("generateShare", () => {
    beforeEach(() => {
      // Mock getTrackShareInfo to return owned track
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: MOCK_TRACK,
        error: null,
      });
    });

    it("generates share link with default unlisted privacy", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.update = mockUpdate;

      const result = await generateShare(MOCK_USER_ID, MOCK_TRACK_ID);

      expect(result).toEqual({
        shareUrl: "https://lofield.fm/share/test-share-token",
        shareToken: "test-share-token",
        privacy: "unlisted",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        share_token: "test-share-token",
        privacy: "unlisted",
        shared_at: expect.any(String),
      });
    });

    it("generates share link with specified privacy", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.update = mockUpdate;

      const result = await generateShare(MOCK_USER_ID, MOCK_TRACK_ID, "public");

      expect(result).toEqual({
        shareUrl: "https://lofield.fm/share/test-share-token",
        shareToken: "test-share-token",
        privacy: "public",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        share_token: "test-share-token",
        privacy: "public",
        shared_at: expect.any(String),
      });
    });

    it("throws error when track not found or not owned", async () => {
      // Mock getTrackShareInfo to return null (not found/not owned)
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: { ...MOCK_TRACK, project: { user_id: "different-user" } },
        error: null,
      });

      await expect(generateShare(MOCK_USER_ID, MOCK_TRACK_ID)).rejects.toThrow(
        "Track not found or access denied"
      );
    });

    it("throws error when update fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
      });
      mockSupabaseClient.update = mockUpdate;

      await expect(generateShare(MOCK_USER_ID, MOCK_TRACK_ID)).rejects.toThrow(
        "Failed to generate share link: Update failed"
      );
    });
  });

  describe("updateSharePrivacy", () => {
    beforeEach(() => {
      // Mock getTrackShareInfo to return owned track
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: MOCK_TRACK,
        error: null,
      });
    });

    it("updates privacy setting successfully", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.update = mockUpdate;

      const result = await updateSharePrivacy(MOCK_USER_ID, MOCK_TRACK_ID, "public");

      expect(result).toEqual({ privacy: "public" });
      expect(mockUpdate).toHaveBeenCalledWith({ privacy: "public" });
    });

    it("throws error when track not found or not owned", async () => {
      // Mock getTrackShareInfo to return null
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: { ...MOCK_TRACK, project: { user_id: "different-user" } },
        error: null,
      });

      await expect(updateSharePrivacy(MOCK_USER_ID, MOCK_TRACK_ID, "private")).rejects.toThrow(
        "Track not found or access denied"
      );
    });

    it("throws error when update fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
      });
      mockSupabaseClient.update = mockUpdate;

      await expect(updateSharePrivacy(MOCK_USER_ID, MOCK_TRACK_ID, "private")).rejects.toThrow(
        "Failed to update share privacy: Update failed"
      );
    });
  });

  describe("revokeShare", () => {
    beforeEach(() => {
      // Mock getTrackShareInfo to return owned track
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: MOCK_SHARED_TRACK,
        error: null,
      });
    });

    it("revokes share by clearing token and setting private", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabaseClient.update = mockUpdate;

      await revokeShare(MOCK_USER_ID, MOCK_TRACK_ID);

      expect(mockUpdate).toHaveBeenCalledWith({
        share_token: null,
        privacy: "private",
        shared_at: null,
      });
    });

    it("throws error when track not found or not owned", async () => {
      // Mock getTrackShareInfo to return null
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: { ...MOCK_TRACK, project: { user_id: "different-user" } },
        error: null,
      });

      await expect(revokeShare(MOCK_USER_ID, MOCK_TRACK_ID)).rejects.toThrow(
        "Track not found or access denied"
      );
    });

    it("throws error when update fails", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
      });
      mockSupabaseClient.update = mockUpdate;

      await expect(revokeShare(MOCK_USER_ID, MOCK_TRACK_ID)).rejects.toThrow(
        "Failed to revoke share: Update failed"
      );
    });
  });
});
