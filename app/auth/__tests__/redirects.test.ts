// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ exchange: vi.fn(), verify: vi.fn(), createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
import { GET as callback } from "@/app/auth/callback/route";
import { GET as confirm } from "@/app/auth/confirm/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lofield.fm");
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.verify.mockResolvedValue({ error: null });
  mocks.createClient.mockResolvedValue({
    auth: { exchangeCodeForSession: mocks.exchange, verifyOtp: mocks.verify },
  });
});
afterEach(() => vi.unstubAllEnvs());

describe.each([
  { name: "callback", handler: callback, query: "code=fixture", error: "auth_error" },
  {
    name: "confirm",
    handler: confirm,
    query: "token_hash=fixture&type=email",
    error: "verification_failed",
  },
])("standalone auth $name", ({ name, handler, query, error }) => {
  it("returns missing credentials to the public sign-in page without an auth request", async () => {
    const response = await handler(
      new Request(`http://0.0.0.0:3000/auth/${name}`, {
        headers: { "x-forwarded-host": "untrusted.example", "x-forwarded-proto": "http" },
      })
    );
    expect(response.headers.get("location")).toBe(`https://lofield.fm/auth/sign-in?error=${error}`);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["/studio", "/explore?genre=jazz&genre=ambient", "/studio#timeline"])(
    "preserves the safe local destination %s",
    async (next) => {
      const response = await handler(
        new Request(`http://0.0.0.0:3000/auth/${name}?${query}&next=${encodeURIComponent(next)}`)
      );
      expect(response.headers.get("location")).toBe(`https://lofield.fm${next}`);
    }
  );

  it.each([
    "//untrusted.example",
    "https://untrusted.example",
    "/\\untrusted.example",
    "/\n/untrusted.example",
    "relative",
  ])("rejects the unsafe destination %j", async (next) => {
    const response = await handler(
      new Request(`http://0.0.0.0:3000/auth/${name}?${query}&next=${encodeURIComponent(next)}`)
    );
    expect(response.headers.get("location")).toBe("https://lofield.fm/studio");
  });

  it("keeps rejected tokens on the public sign-in page", async () => {
    mocks.exchange.mockResolvedValue({ error: new Error("rejected") });
    mocks.verify.mockResolvedValue({ error: new Error("rejected") });
    const response = await handler(new Request(`http://0.0.0.0:3000/auth/${name}?${query}`));
    expect(response.headers.get("location")).toBe(`https://lofield.fm/auth/sign-in?error=${error}`);
  });

  it("uses the canonical production fallback when no public URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    const response = await handler(new Request(`http://0.0.0.0:3000/auth/${name}`));
    expect(response.headers.get("location")).toBe(`https://lofield.fm/auth/sign-in?error=${error}`);
  });

  it("preserves local development return URLs without a public URL override", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    const response = await handler(new Request(`http://localhost:3408/auth/${name}`));
    expect(response.headers.get("location")).toBe(
      `http://localhost:3408/auth/sign-in?error=${error}`
    );
  });
});
