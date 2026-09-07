import { afterEach, expect, it, vi } from "vitest";

const { createClient, cookies } = vi.hoisted(() => ({ createClient: vi.fn(), cookies: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
vi.mock("next/headers", () => ({ cookies }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("keeps service credentials isolated from request cookies and session persistence", async () => {
  vi.stubEnv("NEXT_PUBLIC_E2E", "0");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase-lofield.m12n.org");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  const client = { from: vi.fn() };
  createClient.mockReturnValue(client);
  const { createServiceClient } = await import("../service");
  expect(await createServiceClient()).toBe(client);
  expect(cookies).not.toHaveBeenCalled();
  expect(createClient).toHaveBeenCalledWith(
    "https://supabase-lofield.m12n.org",
    "test-service-key",
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );
});

it("fails clearly when the server-only service key is missing", async () => {
  vi.stubEnv("NEXT_PUBLIC_E2E", "0");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const { createServiceClient } = await import("../service");
  await expect(createServiceClient()).rejects.toThrow("SUPABASE_SERVICE_ROLE_KEY is required");
  expect(createClient).not.toHaveBeenCalled();
});
