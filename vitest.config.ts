import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
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
