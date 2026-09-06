import { describe, it, expect } from "vitest";
import { scrubErrorEvent } from "../ops-error-tracking";

describe("Ops error privacy", () => {
  it("keeps the failure but removes request and user secrets", () => {
    const event = scrubErrorEvent({
      message: "A controlled failure",
      user: { email: "private@example.com", ip_address: "192.0.2.1" },
      request: {
        url: "https://example.com/settings?token=private#secret",
        method: "POST",
        headers: { Authorization: "Bearer private" },
        data: "password=private",
        cookies: { session: "private" },
      },
      breadcrumbs: [{ message: "private" }],
      extra: { password: "private" },
    });
    expect(event.message).toBe("A controlled failure");
    expect(event.request).toEqual({ url: "https://example.com/settings", method: "POST" });
    expect(event.tags?.hostname).toBe("example.com");
    expect(JSON.stringify(event)).not.toContain("private");
  });
  it("handles an event without a request", () => {
    expect(scrubErrorEvent({ message: "Background failure" }).message).toBe("Background failure");
  });
  it("does not retain malformed URLs", () => {
    expect(
      scrubErrorEvent({ request: { url: "not a URL?secret=private" } }).request?.url
    ).toBeUndefined();
  });
});
