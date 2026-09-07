// @vitest-environment node
import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "@/middleware";

const sha = "a".repeat(40);
const matches = (path: string) =>
  unstable_doesMiddlewareMatch({
    config,
    nextConfig: {},
    url: `https://lofield.fm${path}`,
  });

describe("release assets preserve the session middleware boundary", () => {
  it.each(["font.woff2", "chunk.js", "styles.css"])("serves %s without session refresh", (file) => {
    expect(matches(`/_next/static/media/${file}`)).toBe(false);
    expect(matches(`/_assets/${sha}/_next/static/media/${file}`)).toBe(false);
  });
  it.each([
    "/studio",
    "/api/chat",
    "/auth/callback",
    "/auth/confirm",
    "/_assets/invalid/private",
    `/_assets/${sha}/private`,
  ])("retains ordinary middleware for %s", (path) => expect(matches(path)).toBe(true));
});
