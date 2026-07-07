import { defineConfig } from "vitest/config";

const passiveCoverageFiles = [
  "src/index.ts",
  "src/api/contracts.ts",
  "src/api/diagnostics.ts",
  "src/api/document-set-validation-types.ts",
  "src/api/document.ts",
  "src/declarative-validation/applicability/index.ts",
  "src/declarative-validation/assertions/context.ts",
  "src/declarative-validation/assertions/index.ts",
  "src/declarative-validation/compiler/plan.ts",
  "src/declarative-validation/diagnostics/index.ts",
  "src/declarative-validation/results/index.ts",
  "src/declarative-validation/results/types.ts",
  "src/frontmatter/index.ts",
  "src/frontmatter/types.ts",
  "src/ir/index.ts",
  "src/ir/normalization-input.ts",
  "src/parser/index.ts",
  "src/parser/mdast.ts",
  "src/parser/types.ts",
];

export default defineConfig({
  test: {
    coverage: {
      all: true,
      exclude: [
        "dist/**",
        "dist-bundled/**",
        "node_modules/**",
        "tests/**",
        ...passiveCoverageFiles,
      ],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 75,
        lines: 60,
      },
    },
  },
});
