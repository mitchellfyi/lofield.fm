import { vi } from "vitest";

export const generateMusic = vi.fn().mockResolvedValue({
  audioBuffer: new Uint8Array([1, 2, 3]),
  audioBytes: 3,
  audioSeconds: 10,
  requestId: "mock-req-id",
  latencyMs: 100,
});

export const getSubscription = vi.fn().mockResolvedValue({
  status: "active",
});

export const getUsageStats = vi.fn().mockResolvedValue({
  data: [],
});
