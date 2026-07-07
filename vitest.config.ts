import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      all: true,
      exclude: [
        "dist/**",
        "dist-bundled/**",
        "node_modules/**",
        "tests/**",
      ],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 75,
        lines: 60,
      },
    },
  },
});
