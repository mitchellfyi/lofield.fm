import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");

describe("Umami analytics", () => {
  it("loads the Ops-hosted tracker from the root layout", () => {
    expect(layout).toContain("https://analytics.m12n.org/script.js");
    expect(layout).toContain('data-website-id="905e3324-1f73-48b1-825b-4051fb807e15"');
    expect(layout).toContain('strategy="afterInteractive"');
    expect(layout).not.toContain("cloud.umami.is");
  });
});
