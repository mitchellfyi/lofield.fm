import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

// Mock cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

// Mock Supabase SDKs
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn().mockReturnValue("server-client"),
  createBrowserClient: vi.fn().mockReturnValue("browser-client"),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue("admin-client"),
}));

describe("supabase helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.com";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  });

  describe("createServerSupabaseClient", () => {
    it("creates server client", async () => {
      const client = await createServerSupabaseClient();
      expect(client).toBe("server-client");
    });

    it("throws if env vars missing", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      await expect(createServerSupabaseClient()).rejects.toThrow(
        "Missing Supabase environment variables"
      );
    });
  });

  describe("getServiceRoleClient", () => {
    it("creates admin client", () => {
      const client = getServiceRoleClient();
      expect(client).toBe("admin-client");
    });

    it("throws if env vars missing", () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => getServiceRoleClient()).toThrow(
        "Missing Supabase environment variables"
      );
    });
  });

  describe("createClient (browser)", () => {
    it("creates browser client", () => {
      const client = createClient();
      expect(client).toBe("browser-client");
    });

    it("throws if env vars missing", () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(() => createClient()).toThrow(
        "Missing Supabase environment variables"
      );
    });
  });
});
