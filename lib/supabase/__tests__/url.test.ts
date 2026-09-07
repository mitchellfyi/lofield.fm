import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseUrl } from "../url";

afterEach(() => vi.unstubAllEnvs());

describe("private Supabase endpoint", () => {
  it.each([
    "https://supabase-lofield.m12n.org",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
  ])("accepts %s", (url) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    expect(supabaseUrl()).toBe(url);
  });

  it.each([
    "https://legacy.supabase.co",
    "https://LEGACY.SUPABASE.CO",
    "https://legacy.supabase.co.",
    "https://supabase.co",
    "http://supabase-lofield.m12n.org",
    "https://user:password@supabase-lofield.m12n.org",
    "https://supabase-lofield.m12n.org?token=secret",
    "https://supabase-lofield.m12n.org#fragment",
    "https://supabase-lofield.m12n.org/auth/v1",
    "not a URL",
    "",
  ])("rejects an unsafe or Cloud endpoint without echoing it", (url) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    expect(() => supabaseUrl()).toThrow("Configure a private Supabase base URL");
  });

  it("rejects a missing URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    expect(() => supabaseUrl()).toThrow("Configure a private Supabase base URL");
  });
});
