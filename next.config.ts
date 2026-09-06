import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
};

export default withSentryConfig(nextConfig, {
  sentryUrl: "https://errors.m12n.org",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  // Sentry organization and project (from environment variables)
  org: process.env.SENTRY_ORG || "ops",
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps if auth token is available
  silent: !process.env.CI,

  // Upload source maps for error tracking
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Opt out of automatic instrumentation for specific pages if needed
  // automaticVercelMonitors: true,
});
