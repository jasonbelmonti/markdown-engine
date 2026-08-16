#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { securityPolicyFailures } from "./security-policy-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [
  {
    file: "docs/contracts/api.md",
    headings: [
      "## 1.0 Contract",
      "### 1.0 Document Fields",
      "### Target Contract And Stability Limits",
      "### Structural Views",
      "### Query Helpers",
      "### Annotation Contract",
      "### Compatibility And Migration",
      "### CLI Impact",
      "### Non-Goals And Limits",
    ],
    phrases: [
      "Status: package 3.0.0, document contract 1.0.0",
      "The current package version is `3.0.0`",
      "version remains `\"1.0.0\"`",
      'documentVersion: "1.0.0"',
      'compatibilityMode: "default"',
      'compatibilityMode: "legacy-0.1"',
      "EngineNodeTarget",
      "documentQueries",
      "validateAnnotations",
      "sourceSlice(document, target)",
      "cannot prove source-target",
      "source ranges proven out of bounds",
      "--document-version 0.0.0",
      "Package 3.0 selects that rich IR contract by",
      'pin `documentVersion: "0.0.0"`',
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
      "version: `3.5.0`",
      "Package 3.5 retains the serialized document contract",
      'documentVersion: "1.0.0"',
      "--document-version 0.0.0",
      "Package 3.5 keeps the 2.0 API normalization default",
      'normalize(parsed, { documentVersion: "0.0.0" })',
      "npm run docs:rich-ir-contract",
      "docs/evidence/wp-5-evd-6-rich-ir-contract.md",
    ],
  },
  {
    file: "docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md",
    headings: ["## 14. Data, Schemas, and Compatibility"],
    phrases: [
      "BEL-950 implementation status as of 2026-05-06",
      'documentVersion: "1.0.0"',
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
      "BEL-955",
      "BEL-952",
      'version: "1.0.0"',
      'version: "0.0.0"',
      "--document-version",
      "Missing, invalid, or repeated",
      "exit with code `2`",
      "Semver classification: breaking CLI output-shape change",
      "1.0 release lane",
      "not a `0.1.x` patch",
      "pin `--document-version 0.0.0`",
      "Code Simplifier",
      "Organize Code Boundaries",
      "Review Test Value",
      "Consensus Review",
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

failures.push(
  ...securityPolicyFailures({
    packageFile: "package.json",
    packageJson: readContractFile("package.json"),
    securityFile: "SECURITY.md",
    securityMarkdown: readContractFile("SECURITY.md"),
  }),
);

if (failures.length > 0) {
  console.error("Rich IR contract documentation gate FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Rich IR contract documentation gate PASS");
console.log(
  `Checked files: ${[
    ...checks.map((check) => check.file),
    "SECURITY.md",
    "package.json",
  ].join(", ")}`,
);

function readContractFile(file) {
  try {
    return readFileSync(resolve(repoRoot, file), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${file}: unable to read file: ${message}`);
    return "";
  }
}
