import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable source maps in production for better error tracking
  productionBrowserSourceMaps: true,
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project (from environment variables)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps if auth token is available
  silent: !process.env.CI,

  // Upload source maps for error tracking
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Opt out of automatic instrumentation for specific pages if needed
  // automaticVercelMonitors: true,
});
