import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "../SignInForm";
import { SignUpForm } from "../SignUpForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

afterEach(() => vi.unstubAllEnvs());

describe.each([
  ["sign in", SignInForm],
  ["sign up", SignUpForm],
] as const)("configured authentication providers: %s", (_name, Form) => {
  it("keeps email authentication and hides unconfigured social providers", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_AUTH_GITHUB_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED", "false");
    const html = renderToStaticMarkup(createElement(Form));
    expect(html).toContain('type="email"');
    expect(html).not.toContain("GitHub");
    expect(html).not.toContain("Google");
    expect(html).not.toContain("Or continue with");
  });

  it.each(["GITHUB", "GOOGLE"])("only shows an explicitly enabled %s provider", (provider) => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_AUTH_GITHUB_ENABLED",
      provider === "GITHUB" ? "true" : "false"
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED",
      provider === "GOOGLE" ? "true" : "false"
    );
    const html = renderToStaticMarkup(createElement(Form));
    expect(html).toContain(provider === "GITHUB" ? "GitHub" : "Google");
    expect(html).not.toContain(provider === "GITHUB" ? "Google" : "GitHub");
    expect(html).toContain("Or continue with");
  });
});
