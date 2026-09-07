import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("private Supabase deployment contract", () => {
  it("never links a hosted Supabase project from a deployment workflow", () => {
    const workflows = resolve(process.cwd(), ".github/workflows");
    for (const file of readdirSync(workflows).filter((name) => name.endsWith(".yml"))) {
      const source = readFileSync(resolve(workflows, file), "utf8");
      expect(source, file).not.toMatch(/supabase link|SUPABASE_PROJECT_REF|SUPABASE_ACCESS_TOKEN/);
    }
  });

  it("builds CI against a private placeholder instead of Cloud credentials", () => {
    const source = readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8");
    expect(source).not.toContain("supabase.co");
    expect(source).not.toContain("secrets.NEXT_PUBLIC_SUPABASE");
  });
});
