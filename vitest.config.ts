import { defineConfig } from "vitest/config";
import { dirname, resolve } from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sentryPackage = require("@sentry/nextjs/package.json");
const sentryBrowserEntry = resolve(
  dirname(require.resolve("@sentry/nextjs/package.json")),
  sentryPackage.exports["."].browser.require
);

export default defineConfig({
  test: {
    globals: true,
    // jsdom exercises browser code; keep the real browser SDK without loading Node build plugins.
    alias: [{ find: /^@sentry\/nextjs$/, replacement: sentryBrowserEntry }],
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "**/node_modules/**",
        "**/e2e/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/test/**",
        "**/__tests__/**",
        "**/vitest.config.ts",
        "**/next.config.ts",
        "**/postcss.config.mjs",
        "**/tailwind.config.ts",
      ],
      thresholds: {
        lines: 30,
        branches: 25,
        functions: 25,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
