import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const privateSourceMaps = process.env.OPS_PRIVATE_SOURCE_MAPS === "1";
const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE;
if (
  privateSourceMaps &&
  (!/^[a-f0-9]{40}$/.test(release || "") ||
    process.env.SENTRY_RELEASE !== release ||
    process.env.SOURCE_COMMIT !== release)
) {
  throw new Error("Private source maps require the full deployment commit SHA");
}

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: privateSourceMaps,
  experimental: {
    // Keep native exception positions accurate until Turbopack fixes hoisting maps.
    turbopackScopeHoisting: privateSourceMaps ? false : undefined,
    serverSourceMaps: privateSourceMaps,
  },
  turbopack: { debugIds: privateSourceMaps },
  assetPrefix:
    privateSourceMaps && process.env.NODE_ENV === "production" ? `/_assets/${release}` : undefined,
  outputFileTracingIncludes: { "/api/chat": ["./prompts/**/*.md"] },
  async rewrites() {
    return privateSourceMaps && process.env.NODE_ENV === "production"
      ? [{ source: `/_assets/${release}/_next/static/:path*`, destination: "/_next/static/:path*" }]
      : [];
  },
};

export default withSentryConfig(nextConfig, {
  sentryUrl: "https://errors.m12n.org",
  telemetry: false,
  // Sentry organization and project (from environment variables)
  org: process.env.SENTRY_ORG || "ops",
  project: process.env.SENTRY_PROJECT,

  silent: !process.env.CI,
  sourcemaps: { disable: true },
  release: { name: release, create: false, finalize: false },

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Opt out of automatic instrumentation for specific pages if needed
  // automaticVercelMonitors: true,
});
