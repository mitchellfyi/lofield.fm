// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";

const { createServerClient } = vi.hoisted(() => ({ createServerClient: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { updateSession } from "../middleware";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("keeps refreshed auth cookies private alongside the authenticated user", async () => {
  vi.stubEnv("NEXT_PUBLIC_E2E", "0");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  const user = { id: "test-user" };
  const headers = {
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Expires: "0",
    Pragma: "no-cache",
  };
  createServerClient.mockImplementation((_url, _key, { cookies }) => ({
    auth: {
      getUser: async () => {
        cookies.setAll(
          [{ name: "sb-session", value: "refreshed", options: { httpOnly: true } }],
          headers
        );
        return { data: { user } };
      },
    },
  }));

  const request = new NextRequest("https://lofield.fm/studio");
  const result = await updateSession(request);

  expect(result.user).toEqual(user);
  expect(request.cookies.get("sb-session")?.value).toBe("refreshed");
  expect(result.supabaseResponse.cookies.get("sb-session")).toMatchObject({
    value: "refreshed",
    httpOnly: true,
  });
  for (const [name, value] of Object.entries(headers)) {
    expect(result.supabaseResponse.headers.get(name)).toBe(value);
  }
});
