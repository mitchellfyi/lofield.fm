import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateMusic,
  getSubscription,
  getUsageStats,
} from "@/lib/elevenlabs";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock ElevenLabs SDK
const mockClient = {
  music: {
    compose: vi.fn(),
  },
};

vi.mock("@elevenlabs/elevenlabs-js", () => {
  return {
    ElevenLabsClient: class {
      music = mockClient.music;
    },
  };
});

describe("elevenlabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMusic", () => {
    it("validates length", async () => {
      await expect(
        generateMusic({
          apiKey: "k",
          prompt: "p",
          lengthMs: 1000, // too short
          instrumental: true,
        })
      ).rejects.toThrow("Invalid length");
    });

    it("calls SDK compose and returns buffer", async () => {
      // Mock stream
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      mockClient.music.compose.mockResolvedValue(stream);

      const result = await generateMusic({
        apiKey: "k",
        prompt: "p",
        lengthMs: 5000,
        instrumental: true,
      });

      expect(mockClient.music.compose).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: "p",
          musicLengthMs: 5000,
        })
      );
      expect(result.audioBuffer).toBeInstanceOf(Uint8Array);
      expect(result.audioBytes).toBe(3);
    });

    it("sanitizes API errors", async () => {
      mockClient.music.compose.mockRejectedValue(
        new Error("Auth failed for key sk-12345678901234567890")
      );

      await expect(
        generateMusic({
          apiKey: "k",
          prompt: "p",
          lengthMs: 5000,
          instrumental: true,
        })
      ).rejects.toThrow("ElevenLabs API error: Auth failed for key [REDACTED]");
    });
  });

  describe("getSubscription", () => {
    it("fetches and parses subscription", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          character_count: 100,
          character_limit: 1000,
          next_character_count_reset_unix: 1234567890,
          tier: "pro",
        }),
      });

      const sub = await getSubscription("k");
      expect(sub.creditsUsedCurrentPeriod).toBe(100);
      expect(sub.creditsLimitCurrentPeriod).toBe(1000);
      expect(sub.creditsRemaining).toBe(900);
      expect(sub.tier).toBe("pro");
    });

    it("handles API errors", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(getSubscription("k")).rejects.toThrow(
        "ElevenLabs subscription API error: 401 Unauthorized"
      );
    });
  });

  describe("getUsageStats", () => {
    it("fetches and parses usage stats", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          history: [
            { unix_timestamp: 1672531200000, character_count: 50 }, // 2023-01-01
          ],
        }),
      });

      const stats = await getUsageStats("k", 100, 200);
      expect(stats.dailyUsage).toHaveLength(1);
      expect(stats.dailyUsage[0].date).toContain("2023-01-01");
      expect(stats.dailyUsage[0].creditsUsed).toBe(50);
    });
  });
});

