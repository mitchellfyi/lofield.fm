import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as RefinePOST } from "@/app/api/chats/[id]/refine/route";
import { POST as GeneratePOST } from "@/app/api/chats/[id]/tracks/route";
import { POST as LegacyGeneratePOST } from "@/app/api/chats/[id]/generate/route";
import { GET as PlayGET } from "@/app/api/tracks/[id]/play/route";
import { NextRequest } from "next/server";

// Hoist mocks to ensure they are available in factories
const { mockSupabase, mockSupabaseAdmin, mockElevenLabs } = vi.hoisted(() => {
  return {
    mockSupabase: {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
      },
      from: vi.fn(),
      storage: {
        from: vi.fn(),
      },
    },
    mockSupabaseAdmin: {
      from: vi.fn(),
      storage: {
        from: vi.fn(),
      },
    },
    mockElevenLabs: {
      generateMusic: vi.fn().mockResolvedValue({
        audioBuffer: new Uint8Array([1, 2, 3]),
        audioBytes: 3,
        audioSeconds: 10,
        requestId: "rid",
        latencyMs: 100,
      }),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => Promise.resolve(mockSupabase),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getServiceRoleClient: () => mockSupabaseAdmin,
}));

vi.mock("@/lib/secrets", () => ({
  getOpenAIKeyForUser: vi.fn().mockResolvedValue("k"),
  getElevenLabsKeyForUser: vi.fn().mockResolvedValue("k"),
}));

vi.mock("@/lib/rate-limiting", () => ({
  checkRateLimit: vi
    .fn()
    .mockResolvedValue({ allowed: true, current: 0, limit: 10 }),
  incrementRateLimit: vi.fn(),
}));

// Mock validation
vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  return {
    ...actual,
    validateGenerationParams: vi
      .fn()
      .mockReturnValue({ valid: true, errors: [] }),
  };
});

vi.mock("@/lib/usage-tracking", () => ({
  logUsageEvent: vi.fn(),
  calculateOpenAICost: vi.fn(),
}));

vi.mock("@/lib/elevenlabs", () => mockElevenLabs);

// Mock AI SDK
vi.mock("ai", () => ({
  streamText: vi.fn().mockImplementation(async ({ onFinish }) => {
    if (onFinish) {
      // Simulate finish
      await onFinish({
        text: "assistant reply",
        usage: { inputTokens: 10, outputTokens: 20 },
        response: { id: "resp-1" },
      });
    }
    return {
      toTextStreamResponse: () => new Response("stream"),
    };
  }),
  generateObject: vi.fn().mockImplementation(async () => {
    // Generate dummy object based on schema if needed or return fixed
    return {
      object: {
        reply: "Refined prompt",
        draft: {
          title: "New Title",
          prompt_final: "New Prompt",
          genre: "lofi",
          bpm: 80,
          mood: { energy: 50, focus: 50, chill: 50 },
          instrumentation: ["piano"],
          length_ms: 120000,
          instrumental: true,
          tags: ["chill"],
        },
      },
      usage: { inputTokens: 10, outputTokens: 20 },
      response: { id: "resp-obj" },
    };
  }),
}));

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    randomUUID: () => "uuid",
  },
  randomUUID: () => "uuid",
}));

describe("Track APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
  });

  // Helper to create profiles mock
  const createProfilesMock = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  });

  describe("refine", () => {
    it("refines prompt and saves draft", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        insert: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "more bass" }),
      });
      const res = await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);
    });

    it("returns structured JSON with reply and draft", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        insert: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "make it more chill" }),
      });
      const res = await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      // Response should have both reply and draft fields
      expect(json).toHaveProperty("reply");
      expect(json).toHaveProperty("draft");
      expect(json.draft).toHaveProperty("title");
      expect(json.draft).toHaveProperty("prompt_final");
      expect(json.draft).toHaveProperty("bpm");
      expect(json.draft).toHaveProperty("mood");
    });

    it("persists user message to chat_messages", async () => {
      const insertMock = vi.fn().mockReturnThis();

      mockSupabase.from.mockImplementation((table) => {
        if (table === "chat_messages") {
          return {
            insert: insertMock,
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "msg-1" } }),
          };
        }
        if (table === "chats") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === "profiles") {
          return createProfilesMock();
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "add more drums" }),
      });
      await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });

      // Verify user message was inserted
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          chat_id: "c1",
          role: "user",
          content: "add more drums",
        })
      );
    });

    it("persists assistant message with draft_spec", async () => {
      const insertMock = vi.fn().mockReturnThis();

      mockSupabase.from.mockImplementation((table) => {
        if (table === "chat_messages") {
          return {
            insert: insertMock,
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "msg-1" } }),
          };
        }
        if (table === "chats") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === "profiles") {
          return createProfilesMock();
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "add piano" }),
      });
      await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });

      // Verify assistant message was inserted with draft_spec
      // The second insert call should be the assistant message
      const insertCalls = insertMock.mock.calls;
      expect(insertCalls.length).toBeGreaterThanOrEqual(2);

      // Find the assistant message insert
      const assistantInsert = insertCalls.find(
        (call) => call[0]?.role === "assistant"
      );
      expect(assistantInsert).toBeDefined();
      if (assistantInsert) {
        expect(assistantInsert[0]).toMatchObject({
          chat_id: "c1",
          role: "assistant",
          content: expect.any(String),
          draft_spec: expect.objectContaining({
            title: expect.any(String),
            prompt_final: expect.any(String),
          }),
        });
      }
    });

    it("accepts controls and latest_draft in request body", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        insert: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          message: "make it faster",
          controls: {
            genre: "Lo-fi Hip Hop",
            bpm: 120,
            mood: { energy: 60, focus: 50, chill: 40 },
          },
          latest_draft: {
            title: "Previous Title",
            prompt_final: "Previous prompt",
          },
        }),
      });
      const res = await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);
    });

    it("returns 400 for invalid body", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "" }), // empty
      });
      const res = await RefinePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("tracks/generate", () => {
    it("starts generation and uploads file", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        insert: vi.fn().mockReturnThis(),
      });

      // Mock messages lookup for draft spec
      const selectMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockResolvedValue({
        data: [
          {
            draft_spec: {
              title: "T",
              description: "D",
              prompt_final: "P",
              genre: "lofi",
              bpm: 80,
              instrumentation: [],
              mood: { energy: 50, focus: 50, chill: 50 },
              length_ms: 10000,
              instrumental: true,
              tags: [],
            },
          },
        ],
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "chat_messages") {
          return {
            select: selectMock,
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: orderMock,
            limit: limitMock,
          };
        }
        if (table === "chats") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === "tracks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }), // no in-progress
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "t1" } }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
        };
      });

      const uploadMock = vi
        .fn()
        .mockResolvedValue({ data: { path: "p" }, error: null });
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: uploadMock,
      });

      mockSupabaseAdmin.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await GeneratePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);

      // Wait for background process
      await vi.waitUntil(() => uploadMock.mock.calls.length > 0, {
        timeout: 1000,
        interval: 5,
      });
    });

    it("handles background generation failure", async () => {
      mockElevenLabs.generateMusic.mockRejectedValueOnce(
        new Error("Generation failed")
      );

      const updateMock = vi.fn().mockReturnThis();
      mockSupabaseAdmin.from.mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
      });

      // Reuse successful setup for the endpoint itself
      mockSupabase.from.mockImplementation((table) => {
        if (table === "tracks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "t1" } }),
          };
        }
        if (table === "chat_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  draft_spec: {
                    title: "T",
                    description: "D",
                    prompt_final: "P",
                    genre: "lofi",
                    bpm: 80,
                    instrumentation: [],
                    mood: { energy: 50, focus: 50, chill: 50 },
                    length_ms: 10000,
                    instrumental: true,
                    tags: [],
                  },
                },
              ],
            }),
          };
        }
        if (table === "profiles") {
          return createProfilesMock();
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
          update: vi.fn().mockReturnThis(),
        };
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await GeneratePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);

      await vi.waitUntil(() => updateMock.mock.calls.length > 0, {
        timeout: 1000,
        interval: 5,
      });
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" })
      );
    });

    it("handles upload failure", async () => {
      const uploadMock = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Upload failed" } });
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: uploadMock,
      });

      const updateMock = vi.fn().mockReturnThis();
      mockSupabaseAdmin.from.mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
      });

      // Valid spec needed
      mockSupabase.from.mockImplementation((table) => {
        if (table === "chat_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  draft_spec: {
                    title: "T",
                    description: "D",
                    prompt_final: "P",
                    genre: "lofi",
                    bpm: 80,
                    instrumentation: [],
                    mood: { energy: 50, focus: 50, chill: 50 },
                    length_ms: 10000,
                    instrumental: true,
                    tags: [],
                  },
                },
              ],
            }),
          };
        }
        if (table === "tracks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "t1" } }),
          };
        }
        if (table === "profiles") {
          return createProfilesMock();
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
          update: vi.fn().mockReturnThis(),
        };
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await GeneratePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);

      await vi.waitUntil(() => uploadMock.mock.calls.length > 0, {
        timeout: 1000,
        interval: 5,
      });
      expect(uploadMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" })
      );
    });
  });

  describe("legacy generate", () => {
    it("works like tracks/generate", async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === "chat_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  draft_spec: {
                    title: "T",
                    description: "D",
                    prompt_final: "P",
                    genre: "lofi",
                    bpm: 80,
                    instrumentation: [],
                    mood: { energy: 50, focus: 50, chill: 50 },
                    length_ms: 10000,
                    instrumental: true,
                    tags: [],
                  },
                },
              ],
            }),
          };
        }
        if (table === "chats") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === "tracks") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "t1" } }),
          };
        }
        if (table === "profiles") {
          return createProfilesMock();
        }
        return {};
      });

      const uploadMock = vi
        .fn()
        .mockResolvedValue({ data: { path: "p" }, error: null });
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: uploadMock,
      });
      mockSupabaseAdmin.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", { method: "POST" });
      const res = await LegacyGeneratePOST(req, {
        params: Promise.resolve({ id: "c1" }),
      });
      expect(res.status).toBe(200);

      await vi.waitUntil(() => uploadMock.mock.calls.length > 0, {
        timeout: 1000,
        interval: 5,
      });
      expect(uploadMock).toHaveBeenCalled();
    });
  });

  describe("play", () => {
    it("returns signed url", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "t1",
            user_id: "u1",
            status: "ready",
            storage_path: "p/t1.mp3",
          },
        }),
      });

      mockSupabase.storage.from.mockReturnValue({
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({ data: { signedUrl: "url" }, error: null }),
      });

      const req = new NextRequest("http://localhost");
      const res = await PlayGET(req, { params: Promise.resolve({ id: "t1" }) });
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.signedUrl).toBe("url");
    });
  });
});
