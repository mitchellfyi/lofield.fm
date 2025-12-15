import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/route";
import { NextRequest } from "next/server";

// Mocks
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

vi.mock("@/lib/secrets", () => ({
  getOpenAIKeyForUser: vi.fn().mockResolvedValue("k"),
}));

const mockOpenAI = vi.fn();
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => mockOpenAI,
}));

// Mock streamText to execute callback
vi.mock("ai", () => ({
  streamText: vi.fn().mockImplementation(async ({ onFinish }) => {
    // Simulate stream completion
    if (onFinish) {
      await onFinish({
        text: "assistant reply",
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        response: { id: "resp-1" },
      });
    }
    return {
      toTextStreamResponse: () => new Response("stream"),
    };
  }),
}));

vi.mock("crypto", () => ({
  randomUUID: () => "uuid",
}));

vi.mock("@/lib/usage-tracking", () => ({
  logUsageEvent: vi.fn(),
  calculateOpenAICost: vi.fn().mockResolvedValue({
    costUsd: 0.001,
    costNotes: "cheap",
  }),
}));

import { logUsageEvent } from "@/lib/usage-tracking";

import { getOpenAIKeyForUser } from "@/lib/secrets";

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
  });

  // ... (other tests)

  it("streams response and saves messages", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { user_id: "u1" },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    });

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        chat_id: "chat-1",
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify usage logging
    expect(logUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "chat_stream",
        userId: "u1",
        status: "ok",
        costUsd: 0.001,
      })
    );
  });

  it("handles missing API key", async () => {
    vi.mocked(getOpenAIKeyForUser).mockResolvedValueOnce(null);
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("logs error if saving user message fails", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { user_id: "u1" },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
    });

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        chat_id: "chat-1",
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("handles empty message content warning", async () => {
    const consoleSpy = vi.spyOn(console, "warn");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "user", content: "hi" },
          { role: "user", content: "   " },
        ],
      }),
    });
    await POST(req);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Empty message content"),
      expect.anything()
    );
  });
});
