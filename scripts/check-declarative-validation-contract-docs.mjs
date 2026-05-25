#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

checkFile("docs/contracts/declarative-validation.md", {
  headings: [
    "## 1.0 Contract",
    "## Syntax Versioning",
    "## Document-Version Behavior",
    "## Profile Shape",
    "## Selector Contract",
    "## Assertion Contract",
    "## Diagnostics",
    "## Result Shape",
    "## Evidence Fields",
    "## CLI Behavior",
    "## CLI JSON Union",
    "## Exit Codes",
    "## Compatibility And Migration",
    "## Examples",
    "## Boundary And Non-Goals",
    "## Contract Review Gates",
  ],
  phrases: [
    "Status: package 2.0.0, v1 profile syntax with v2 profile admission, document contract 1.0.0",
    "Package 2.0 does not introduce",
    "markdown-engine.validation@v1",
    "markdown-engine.validation@v2",
    "same flat rule shape with `id`",
    'documentVersion: "1.0.0"',
    "Direct object inputs to `parseValidationProfile` are closed as JSON-safe data",
    "profile.config.documentVersionMismatch",
    "profile.compile.unsupportedSelector",
    "profile.compile.unsupportedAssertion",
    "profile.compile.incompatibleSelectorAssertion",
    "profile.validation.emptySelection",
    "profile.validation.duplicateId",
    "profile.validation.referenceMissing",
    "DeclarativeValidationCliJsonResult",
    "DeclarativeValidationConfigErrorResult",
    "skippedRuleCount",
    'reason: "whenNotMatched"',
    'evaluation.kind: "skipped"',
    "V1 preservation is explicit",
    "inputHash",
    "profileHash",
    'engineVersion` records the package version',
    '2.0 release line this is `"2.0.0"`',
    "Conditional V2 EVD-6 reviewer notes",
    "profile-sourced regex compilation",
    "arbitrary JavaScript",
    "expression evaluation",
    "plugins and plugin loading",
    "network calls",
    "LLM calls",
    "file watching",
    "persistence",
    "profile-specific core semantics",
  ],
});

checkFile("docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md", {
  headings: [
    "## Scope",
    "## Reviewed Documents",
    "## Contract Coverage",
    "## Commands",
    "## Recorded Results",
    "## Residual Risks",
    "## Conclusion",
  ],
  phrases: [
    "BEL-985",
    "npm run docs:declarative-validation-contract",
    "docs/contracts/declarative-validation.md",
    "syntax versioning",
    "document-version mismatch behavior",
    "selectors",
    "assertions",
    "diagnostic inventory",
    "CLI JSON union",
    "exit codes",
    "migration notes",
  ],
});

checkFile("docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md", {
  headings: [
    "## Scope",
    "## Boundary Assertions",
    "## Automated Gate",
    "## Commands",
    "## Recorded Results",
    "## Residual Risks",
    "## Conclusion",
  ],
  phrases: [
    "BEL-985",
    "npm run audit:declarative-validation-boundary",
    "arbitrary JavaScript",
    "expression evaluation",
    "profile-sourced regex compilation",
    "plugins",
    "network calls",
    "LLM calls",
    "file watching",
    "persistence",
    "profile-specific core semantics",
    "profile.config.unsupportedKey",
  ],
});

checkFile("docs/evidence/conditional-v2-evd-6-contract-docs.md", {
  headings: [
    "## Scope",
    "## Reviewed Sources",
    "## Contract Coverage",
    "## Commands",
    "## Recorded Results",
    "## Residual Risks",
    "## Review Boundary",
    "## Conclusion",
  ],
  phrases: [
    "BEL-1108",
    "Conditional V2 EVD-6",
    "docs/contracts/declarative-validation.md",
    "docs/evidence/conditional-v2-evd-5-when-skipped-rules.md",
    "src/declarative-validation/results/types.ts",
    "npm run docs:declarative-validation-contract",
    "markdown-engine.validation@v2",
    "skippedRuleCount",
    'evaluation.kind: "skipped"',
    "whenNotMatched",
    "V1 preservation",
    "CLI JSON union",
    "evidence hashes",
    "non-goals",
  ],
});

checkFile("README.md", {
  headings: ["## Public API", "## CLI", "## Validation"],
  phrases: [
    "parseValidationProfile",
    "validateWithProfile",
    "docs/contracts/declarative-validation.md",
    "docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md",
    "docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md",
    "npm run docs:declarative-validation-contract",
    "npm run audit:declarative-validation-boundary",
  ],
});

checkPackageScripts();

if (failures.length > 0) {
  console.error("Declarative validation contract documentation gate FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Declarative validation contract documentation gate PASS");
console.log(
  "Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, docs/evidence/conditional-v2-evd-6-contract-docs.md, package.json",
);

function checkFile(file, check) {
  const content = readContractFile(file);

  for (const heading of check.headings) {
    if (!content.includes(heading)) {
      failures.push(`${file}: missing heading ${heading}`);
    }
  }

  for (const phrase of check.phrases) {
    if (!content.includes(phrase)) {
      failures.push(`${file}: missing required phrase ${phrase}`);
    }
  }
}

function checkPackageScripts() {
  const packageJson = JSON.parse(readContractFile("package.json"));
  const scripts = packageJson.scripts ?? {};
  const releaseVerify = String(scripts["release:verify"] ?? "");
  const requiredScripts = {
    "docs:declarative-validation-contract":
      "node scripts/check-declarative-validation-contract-docs.mjs",
    "audit:declarative-validation-boundary":
      "node scripts/check-declarative-validation-boundary.mjs",
  };

  for (const [name, expected] of Object.entries(requiredScripts)) {
    if (scripts[name] !== expected) {
      failures.push(`${name}: expected package script ${expected}`);
    }

    if (String(scripts[name] ?? "").includes("scripts/gate-placeholder.mjs")) {
      failures.push(`${name}: still points at scripts/gate-placeholder.mjs`);
    }

    if (!releaseVerify.includes(`npm run ${name}`)) {
      failures.push(`release:verify: missing npm run ${name}`);
    }
  }
}

function readContractFile(file) {
  try {
    return readFileSync(resolve(repoRoot, file), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${file}: unable to read file: ${message}`);
    return "";
  }
}
