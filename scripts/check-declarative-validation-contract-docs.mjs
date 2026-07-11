#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  annotatedProfileFailures,
  guideSectionFailures,
} from "./declarative-validation-agent-guide-checks.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const agentGuideFile =
  "docs/guides/declarative-validation-agent-interpretation.md";
const annotatedProfileFile =
  "fixtures/declarative-validation/examples/operational-spec/profile.yaml";

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
    "Status: package 3.1.2, v1 profile syntax with v2 Conditional V2, document contract 1.0.0",
    "Package 3.0 does not introduce",
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
    "profile.validation.assertionFailed",
    "profile.validation.duplicateId",
    "profile.validation.referenceMissing",
    "`textFormat` schema",
    'textFormat.format` must be exactly `"isoDate"`',
    "exact real calendar date in",
    "YYYY-MM-DD",
    "text-format `isoDate` failures",
    "v2 date-heading profile",
    "OKF v0.1 Hard-Validation Profile Composition",
    "Concept validation applies only to non-reserved concept documents",
    'okf_version: "0.1"',
    "`log.md` is validated as a log",
    "engine-owned path classification",
    "DeclarativeValidationCliJsonResult",
    "DeclarativeValidationConfigErrorResult",
    "skippedRuleCount",
    'reason: "whenNotMatched"',
    'evaluation.kind: "skipped"',
    "any top-level error-severity diagnostic",
    "V1 preservation is explicit",
    "inputHash",
    "profileHash",
    'engineVersion` records the package version',
    "matches the package metadata version",
    "Compatibility examples",
    "v1 compatibility profile",
    "v2 opt-in profile",
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

checkFile(agentGuideFile, {
  headings: [
    "## Authority and scope",
    "## The select -> assert execution model",
    "## Selector field roles",
    "## Table selector pipeline",
    "## Assertion behavior",
    "## Conditional and grouped v2 rules",
    "## Natural-language translation template",
    "## Annotated shipped profile",
    "## Common misreads",
    "## Agent checklist",
  ],
  phrases: [
    "does not add syntax",
    "scope filter",
    "target filter",
    "table-shape filter",
    "row filter",
    "extractor",
    "at least one item has that depth",
    "`tableHeader` versus `column`",
    "`where` versus `rowWhere`",
    "Table-shape checks versus table-cell content checks",
    "Empty selection versus assertion failure",
  ],
});

failures.push(
  ...guideSectionFailures({
    file: agentGuideFile,
    markdown: readContractFile(agentGuideFile),
    heading: "## The select -> assert execution model",
    minLength: 600,
    phrases: [
      "identity -> optional applicability -> select -> assert -> failure meaning",
      "They stop the validation run before rule evaluation",
      "Resolve `select` once into a concrete target set",
      "Evaluate every member of `assert`",
      "Empty selection",
      "Assertion failure",
    ],
  }),
);

failures.push(
  ...annotatedProfileFailures({
    guideFile: agentGuideFile,
    guideMarkdown: readContractFile(agentGuideFile),
    profileFile: annotatedProfileFile,
    profileYaml: readContractFile(annotatedProfileFile),
  }),
);

checkFile("docs/README.md", {
  headings: ["## Interpretation guidance (non-normative)"],
  phrases: [
    "guides/declarative-validation-agent-interpretation.md",
    "select -> assert",
    "declarative validation contract",
    "remains authoritative",
  ],
});

checkFile("docs/contracts/api.md", {
  headings: [
    "## `validateDocumentSet`",
  ],
  phrases: [
    "`validateDocumentSet` is a pure aggregate API",
    "classify OKF paths",
    "For OKF-style bundles, `validateDocumentSet` stays a generic aggregation API",
    "Callers must classify each path before calling the function",
    'okf_version: "0.1"',
    "The API does not infer those roles from paths.",
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

checkFile("docs/evidence/bel-1332-okf-release-readiness.md", {
  headings: [
    "## Scope",
    "## Seal Assertions",
    "## Commands",
    "## Recorded Results",
    "## Release Containment",
    "## Residual Risks",
    "## Conclusion",
  ],
  phrases: [
    "Issue: BEL-1332",
    "OKF validation seal",
    "caller-owned path classification",
    "root `index.md`",
    "non-root `index.md`",
    "`log.md` is validated as a log",
    "OKF-specific core semantic matches: 0",
    "npm run docs:declarative-validation-contract",
    "npm run audit:declarative-validation-boundary",
    "No release, publish, tag, version bump, or dist-tag mutation occurred.",
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

checkFile("docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md", {
  headings: [
    "## Scope",
    "## Reviewed Sources",
    "## Migration Documentation Evidence",
    "## Commands",
    "## Recorded Results",
    "## CLI Compatibility Coverage",
    "## V1/V2 Compatibility Notes",
    "## Public Contract Gap Review",
    "## Reviewer Approval Notes",
    "## Residual Risks",
    "## Review Boundary",
    "## Conclusion",
  ],
  phrases: [
    "BEL-1110",
    "Conditional V2 EVD-6",
    "docs/contracts/declarative-validation.md",
    "tests/declarative-validation-cli.test.ts",
    "npm run docs:declarative-validation-contract",
    "npm run test:validation:cli",
    "git diff --check",
    "markdown-engine.validation@v1",
    "markdown-engine.validation@v2",
    "V1 preservation",
    "V2 selection",
    "CLI JSON union",
    "Profile-stage failures",
    "Reviewer checks requested",
    "Approval status: pending review",
  ],
});

checkFile("README.md", {
  headings: ["## Public API", "## CLI", "## Validation"],
  phrases: [
    "parseValidationProfile",
    "validateWithProfile",
    "Declarative validation compatibility is syntax-versioned",
    "Conditional V2 behavior is selected only by an explicit v2 profile",
    "docs/contracts/declarative-validation.md",
    "docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md",
    "docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md",
    "npm run docs:declarative-validation-contract",
    "npm run audit:declarative-validation-boundary",
    "OKF v0.1 example composition",
    "`frontmatterShape`",
    "`textFormat`",
    "`validateDocumentSet`",
    "caller-owned path classification",
    "root `index.md`",
    "non-root `index.md`",
    "`log.md`",
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
  "Checked files: docs/contracts/declarative-validation.md, docs/guides/declarative-validation-agent-interpretation.md, fixtures/declarative-validation/examples/operational-spec/profile.yaml, docs/README.md, docs/contracts/api.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, docs/evidence/bel-1332-okf-release-readiness.md, docs/evidence/conditional-v2-evd-6-contract-docs.md, docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md, package.json",
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
