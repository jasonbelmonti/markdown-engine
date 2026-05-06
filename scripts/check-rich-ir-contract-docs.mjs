#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  {
    file: "docs/contracts/api.md",
    headings: [
      "## 1.0 Draft Contract",
      "### 1.0 Draft Document Fields",
      "### Target Contract And Stability Limits",
      "### Structural Views",
      "### Query Helpers",
      "### Annotation Contract",
      "### Compatibility And Migration",
      "### CLI Impact",
      "### Non-Goals And Limits",
    ],
    phrases: [
      'documentVersion: "1.0.0-draft"',
      'compatibilityMode: "default"',
      'compatibilityMode: "legacy-0.1"',
      "EngineNodeTarget",
      "documentQueries",
      "validateAnnotations",
      "sourceSlice(document, target)",
      "cannot prove source-target",
      "source ranges proven out of bounds",
      "--document-version 0.0.0",
      "breaking CLI output-shape change",
      "rowIndex",
      "columnIndex",
      "itemIndex",
      "raw parser AST",
    ],
  },
  {
    file: "README.md",
    headings: ["## Public API", "## CLI", "## Validation"],
    phrases: [
      "documentQueries",
      "validateAnnotations",
      'documentVersion: "1.0.0-draft"',
      "--document-version 0.0.0",
      "breaking for consumers that",
      "npm run docs:rich-ir-contract",
      "docs/evidence/wp-5-evd-6-rich-ir-contract.md",
    ],
  },
  {
    file: "docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md",
    headings: ["## 14. Data, Schemas, and Compatibility"],
    phrases: [
      "BEL-950 implementation status as of 2026-05-06",
      'documentVersion: "1.0.0-draft"',
      "EngineSourceSlice | undefined",
      'compatibilityMode: "legacy-0.1"',
    ],
  },
  {
    file: "docs/evidence/wp-5-evd-6-rich-ir-contract.md",
    headings: [
      "## Reviewed documents",
      "## Commands",
      "## Compatibility classification",
      "## Remaining non-goals and limitations",
    ],
    phrases: [
      "BEL-950",
      "npm run docs:rich-ir-contract",
      "npm run test:rich-ir:compat",
      "npm run test:rich-ir:repeatability",
      "npm run typecheck",
      "git diff --check HEAD --",
      "Annotation source-target bounds are checked only",
    ],
  },
  {
    file: "docs/evidence/wp-5-evd-8-compatibility-cli-impact.md",
    headings: [
      "## Scope",
      "## Compatibility Behavior",
      "## CLI Decision",
      "## Migration Notes",
      "## Commands",
      "## Recorded Results",
      "## Residual Risks",
    ],
    phrases: [
      "BEL-952",
      'version: "1.0.0-draft"',
      'version: "0.0.0"',
      "--document-version",
      "Missing, invalid, or repeated",
      "exit with code `2`",
      "Semver classification: breaking CLI output-shape change",
      "pin `--document-version 0.0.0`",
      "npm test",
    ],
  },
];

const failures = [];

for (const check of checks) {
  const content = readContractFile(check.file);

  for (const heading of check.headings) {
    if (!content.includes(heading)) {
      failures.push(`${check.file}: missing heading ${heading}`);
    }
  }

  for (const phrase of check.phrases) {
    if (!content.includes(phrase)) {
      failures.push(`${check.file}: missing required contract phrase ${phrase}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Rich IR contract documentation gate FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Rich IR contract documentation gate PASS");
console.log(`Checked files: ${checks.map((check) => check.file).join(", ")}`);

function readContractFile(file) {
  try {
    return readFileSync(resolve(repoRoot, file), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${file}: unable to read file: ${message}`);
    return "";
  }
}
