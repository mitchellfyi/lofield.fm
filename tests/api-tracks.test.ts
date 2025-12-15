import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as RefinePOST } from "@/app/api/chats/[id]/refine/route";
import { POST as GeneratePOST } from "@/app/api/chats/[id]/tracks/route";
import { POST as LegacyGeneratePOST } from "@/app/api/chats/[id]/generate/route";
import { GET as PlayGET } from "@/app/api/tracks/[id]/play/route";
import { NextRequest } from "next/server";

// Mock Deps
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

const mockSupabaseAdmin = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

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
  const actual = await importOriginal();
  return {
    ...actual,
    validateGenerationParams: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  };
});

vi.mock("@/lib/elevenlabs", () => ({
  generateMusic: vi.fn().mockResolvedValue({
    audioBuffer: new Uint8Array([1, 2, 3]),
    audioBytes: 3,
    audioSeconds: 10,
    requestId: "rid",
    latencyMs: 100,
  }),
}));

vi.mock("ai", () => ({
  streamText: vi.fn().mockResolvedValue({
    toTextStreamResponse: () => new Response("stream"),
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

  describe("refine", () => {
    it("refines prompt", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        insert: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockReturnThis(),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "more bass" }),
      });
      const res = await RefinePOST(req, { params: Promise.resolve({ id: "c1" }) });
      expect(res.status).toBe(200);
    });

    it("returns 400 for invalid body", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ message: "" }), // empty
      });
      const res = await RefinePOST(req, { params: Promise.resolve({ id: "c1" }) });
      expect(res.status).toBe(400);
    });
  });

  describe("tracks/generate", () => {
    it("starts generation", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
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

      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "p" }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "url" } }),
      });

      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "p" }, error: null }),
      });

      const req = new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await GeneratePOST(req, { params: Promise.resolve({ id: "c1" }) });
      expect(res.status).toBe(200);
    });
  });

  describe("legacy generate", () => {
    it("works like tracks/generate", async () => {
      // Re-use logic from above, just simple check
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
            single: vi.fn().mockResolvedValue({ data: { id: "c1", user_id: "u1" } }),
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
        return {};
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "p" }, error: null }),
      });
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "p" }, error: null }),
      });

      const req = new NextRequest("http://localhost", { method: "POST" });
      const res = await LegacyGeneratePOST(req, { params: Promise.resolve({ id: "c1" }) });
      expect(res.status).toBe(200);
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

