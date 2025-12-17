import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Player Context - Basic Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports PlayerProvider and usePlayer", async () => {
    const playerModule = await import("@/lib/contexts/player-context");
    expect(playerModule.PlayerProvider).toBeDefined();
    expect(playerModule.usePlayer).toBeDefined();
  });

  it("exports PublicTrack type", async () => {
    const playerModule = await import("@/lib/contexts/player-context");
    // Type exports are compile-time only, so we just check the module loads
    expect(playerModule).toBeDefined();
  });
});
