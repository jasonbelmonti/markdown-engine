import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "../src/index.js";
import { runCli, type TextOutput } from "../src/cli/run.js";

interface ExampleCase {
  domain: string;
  profilePath: string;
  passingPath: string;
  failingPath: string;
  expectedRuleIds: readonly string[];
  expectedFailureCodes: readonly string[];
  expectedFailureRuleIds: readonly string[];
}

const examples: readonly ExampleCase[] = [
  {
    domain: "operational spec",
    profilePath: "fixtures/declarative-validation/examples/operational-spec/profile.yaml",
    passingPath: "fixtures/declarative-validation/examples/operational-spec/pass.md",
    failingPath: "fixtures/declarative-validation/examples/operational-spec/fail.md",
    expectedRuleIds: [
      "execution.list",
      "execution.must.count",
      "frontmatter.required",
      "handoff.link",
      "handoff.paragraph",
      "objective.length",
      "objective.text",
      "risk.heading.text",
      "risk.ids.unique",
      "risk.table.columns",
      "sections.required",
      "tracked.risk.row",
    ],
    expectedFailureCodes: [
      "profile.validation.assertionFailed",
      "profile.validation.frontmatterFieldMissing",
    ],
    expectedFailureRuleIds: [
      "execution.must.count",
      "frontmatter.required",
      "objective.length",
    ],
  },
  {
    domain: "release checklist",
    profilePath: "fixtures/declarative-validation/examples/release-checklist/profile.yaml",
    passingPath: "fixtures/declarative-validation/examples/release-checklist/pass.md",
    failingPath: "fixtures/declarative-validation/examples/release-checklist/fail.md",
    expectedRuleIds: [
      "checklist.list",
      "frontmatter.required",
      "gate.ids.unique",
      "gate.table.columns",
      "ready.gate.row",
      "release.link",
      "sections.required",
      "status.ready.count",
    ],
    expectedFailureCodes: [
      "profile.validation.duplicateId",
      "profile.validation.assertionFailed",
      "profile.validation.textExcluded",
      "profile.validation.textMissing",
    ],
    expectedFailureRuleIds: [
      "checklist.list",
      "gate.ids.unique",
      "ready.gate.row",
      "status.ready.count",
    ],
  },
  {
    domain: "requirements traceability",
    profilePath:
      "fixtures/declarative-validation/examples/requirements-traceability/profile.yaml",
    passingPath:
      "fixtures/declarative-validation/examples/requirements-traceability/pass.md",
    failingPath:
      "fixtures/declarative-validation/examples/requirements-traceability/fail.md",
    expectedRuleIds: [
      "evidence.ids.unique",
      "evidence.table.columns",
      "frontmatter.required",
      "requirement.ids.unique",
      "requirement.text",
      "requirements.shall.count",
      "requirements.table.columns",
      "sections.required",
      "traceability.evidence",
      "traceability.requirements",
    ],
    expectedFailureCodes: [
      "profile.validation.assertionFailed",
      "profile.validation.referenceMissing",
    ],
    expectedFailureRuleIds: [
      "evidence.table.columns",
      "traceability.requirements",
    ],
  },
] as const;
const okfPackagedExampleFiles = [
  "fixtures/declarative-validation/examples/okf-v0.1/fail/invalid-log-date/log.md",
  "fixtures/declarative-validation/examples/okf-v0.1/fail/missing-concept-type/concepts/customer-metric.md",
  "fixtures/declarative-validation/examples/okf-v0.1/fail/non-root-index-frontmatter/datasets/index.md",
  "fixtures/declarative-validation/examples/okf-v0.1/pass/datasets/index.md",
  "fixtures/declarative-validation/examples/okf-v0.1/pass/datasets/sales.md",
  "fixtures/declarative-validation/examples/okf-v0.1/pass/index.md",
  "fixtures/declarative-validation/examples/okf-v0.1/pass/log.md",
  "fixtures/declarative-validation/examples/okf-v0.1/pass/playbooks/incident-response.md",
  "fixtures/declarative-validation/examples/okf-v0.1/profiles/concept.yaml",
  "fixtures/declarative-validation/examples/okf-v0.1/profiles/log.yaml",
  "fixtures/declarative-validation/examples/okf-v0.1/profiles/non-root-index.yaml",
  "fixtures/declarative-validation/examples/okf-v0.1/profiles/root-index.yaml",
] as const;
const supportedSelectorTargets = [
  "document",
  "heading",
  "link",
  "list",
  "section",
  "table",
  "tableCell",
  "tableRow",
  "textSpan",
] as const;
const supportedAssertionFamilies = [
  "exists",
  "frontmatterRequired",
  "ids",
  "references",
  "sectionsRequired",
  "tableColumnsRequired",
  "text",
  "textLength",
  "textOccurrenceCount",
] as const;
const packagedExamplesRoot = "fixtures/declarative-validation/examples";
const installedExamplesRoot =
  "node_modules/@jasonbelmonti/markdown-engine/fixtures/declarative-validation/examples";
const intentionalPackageFiles = [
  "dist",
  "dist-bundled",
  "scripts/install-markdown-engine-cli.sh",
  "skills",
  "docs/contracts",
  packagedExamplesRoot,
  "CHANGELOG.md",
  "SECURITY.md",
] as const;

describe("declarative validation example suite", () => {
  it("keeps reader-facing example fixtures inside package files", () => {
    const packageJson = readPackageJson();

    expect(packageJson.files).toEqual([...intentionalPackageFiles]);

    for (const example of examples) {
      expect(example.profilePath.startsWith(packagedExamplesRoot), example.domain)
        .toBe(true);
      expect(example.passingPath.startsWith(packagedExamplesRoot), example.domain)
        .toBe(true);
      expect(example.failingPath.startsWith(packagedExamplesRoot), example.domain)
        .toBe(true);
    }

    for (const okfFile of okfPackagedExampleFiles) {
      expect(okfFile.startsWith(packagedExamplesRoot), okfFile).toBe(true);
      expect(readRepoFile(okfFile).length, okfFile).toBeGreaterThan(0);
    }
  });

  it("uses packaged example fixtures in README CLI commands", () => {
    const cliSection = readReadmeCliSection();

    expect(cliSection).toContain(
      "node dist/cli/index.js --file fixtures/declarative-validation/examples/operational-spec/pass.md",
    );
    expect(cliSection).toContain(
      "From the repository or package root after building",
    );
    expect(cliSection).toContain(
      `markdown-engine --path ${installedExamplesRoot}/operational-spec/pass.md`,
    );
    expect(cliSection).toContain(
      `markdown-engine --document-version 0.0.0 --file ${installedExamplesRoot}/operational-spec/pass.md`,
    );
    expect(cliSection).toContain(
      `markdown-engine validate --file ${installedExamplesRoot}/operational-spec/pass.md --profile ${installedExamplesRoot}/operational-spec/profile.yaml`,
    );
    expect(cliSection).not.toContain("fixtures/representative.md");
    expect(cliSection).not.toContain("--profile profile.yaml");
    expect(cliSection).not.toContain(
      "markdown-engine --path fixtures/declarative-validation/examples",
    );
  });

  it("covers the supported v1 selector and assertion vocabulary", () => {
    const selectorTargets = new Set<string>();
    const assertionFamilies = new Set<string>();

    for (const example of examples) {
      const profile = readProfile(example);

      for (const rule of profile.rules) {
        selectorTargets.add(rule.select.target);
        Object.keys(rule.assert).forEach((assertion) =>
          assertionFamilies.add(assertion),
        );
      }
    }

    expect([...selectorTargets].sort()).toEqual([...supportedSelectorTargets]);
    expect([...assertionFamilies].sort()).toEqual([
      ...supportedAssertionFamilies,
    ]);
  });

  it("validates all passing examples through the public API", () => {
    for (const example of examples) {
      const { result } = validateExample(example, example.passingPath);

      expect(result.valid, example.domain).toBe(true);
      expect(result.diagnostics, example.domain).toEqual([]);
      expect(result.ruleResults.map((ruleResult) => ruleResult.ruleId)).toEqual(
        [...example.expectedRuleIds].sort(),
      );
      expect(result.ruleResults.every((ruleResult) => ruleResult.passed)).toBe(
        true,
      );
      expect(result.evidence, example.domain).toMatchObject({
        diagnostics: [],
        ruleResults: result.ruleResults,
      });
      expect(result.evidence?.inputHash, example.domain).toMatch(/^[0-9a-f]{64}$/);
      expect(result.evidence?.profileHash, example.domain).toMatch(
        /^[0-9a-f]{64}$/,
      );
    }
  });

  it("emits useful diagnostics for all intentionally failing examples", () => {
    for (const example of examples) {
      const { result } = validateExample(example, example.failingPath);

      expect(result.valid, example.domain).toBe(false);
      expect(result.evidence, example.domain).toBeDefined();
      expect(codes(result.diagnostics)).toEqual(
        [...example.expectedFailureCodes].sort(),
      );
      expect(ruleIds(result.diagnostics)).toEqual(
        [...example.expectedFailureRuleIds].sort(),
      );
    }
  });

  it("runs representative passing and failing examples through the CLI JSON path", async () => {
    const example = examples[0] ?? missingExample();
    const passing = await runValidationCli(example.passingPath, example.profilePath);
    const failing = await runValidationCli(example.failingPath, example.profilePath);

    expect(passing.exitCode).toBe(0);
    expect(passing.stderr.text()).toBe("");
    expect(passing.result).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: example.expectedRuleIds.length,
        syntaxVersion: "markdown-engine.validation@v1",
      },
      valid: true,
    });
    expect(passing.result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: passing.result.ruleResults,
    });
    expect(passing.result.evidence.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(passing.result.evidence.profileHash).toMatch(/^[0-9a-f]{64}$/);

    expect(failing.exitCode).toBe(1);
    expect(failing.stderr.text()).toBe("");
    expect(failing.result).toMatchObject({
      profile: {
        documentVersion: "1.0.0",
        ruleCount: example.expectedRuleIds.length,
      },
      valid: false,
    });
    expect(codes(failing.result.diagnostics)).toEqual(
      [...example.expectedFailureCodes].sort(),
    );
    expect(ruleIds(failing.result.diagnostics)).toEqual(
      [...example.expectedFailureRuleIds].sort(),
    );
    expect(failing.result.evidence).toBeDefined();
  });
});

function validateExample(example: ExampleCase, markdownPath: string) {
  const markdown = readRepoFile(markdownPath);
  const profile = readProfile(example);
  const document = normalize(parse(markdown, { path: markdownPath }).parsed, {
    documentVersion: "1.0.0",
  }).document;

  return {
    profile,
    result: validateWithProfile(document, profile, { includeEvidence: true }),
  };
}

function readProfile(example: ExampleCase): ValidationProfile {
  return requireProfile(
    parseValidationProfile(readRepoFile(example.profilePath), {
      path: example.profilePath,
    }),
    example.profilePath,
  );
}

function requireProfile(
  result: ReturnType<typeof parseValidationProfile>,
  profilePath: string,
): ValidationProfile {
  expect(result.diagnostics).toEqual([]);
  expect(result.profile).toBeDefined();

  return result.profile ?? missingProfile(profilePath);
}

async function runValidationCli(markdownPath: string, profilePath: string) {
  const stderr = new CapturedOutput();
  const stdout = new CapturedOutput();
  const exitCode = await runCli({
    args: [
      "validate",
      "--file",
      markdownPath,
      "--profile",
      profilePath,
      "--format",
      "json",
    ],
    cwd: process.cwd(),
    stderr,
    stdout,
  });

  return {
    exitCode,
    stderr,
    stdout,
    result: JSON.parse(stdout.text()),
  };
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function readPackageJson(): { files: string[] } {
  return JSON.parse(readRepoFile("package.json")) as { files: string[] };
}

function readReadmeCliSection(): string {
  const readme = readRepoFile("README.md");
  const cliStart = readme.indexOf("## CLI");
  const cliEnd = readme.indexOf("\n## ", cliStart + 1);

  expect(cliStart).not.toBe(-1);
  expect(cliEnd).not.toBe(-1);

  return readme.slice(cliStart, cliEnd);
}

function codes(diagnostics: readonly { code: string }[]): string[] {
  return [...new Set(diagnostics.map((diagnostic) => diagnostic.code))].sort();
}

function ruleIds(diagnostics: readonly { ruleId?: string }[]): string[] {
  return [...new Set(diagnostics.flatMap((diagnostic) => diagnostic.ruleId ?? []))]
    .sort();
}

function missingProfile(profilePath: string): never {
  throw new Error(`Expected ${profilePath} to parse into a validation profile.`);
}

function missingExample(): never {
  throw new Error("Expected at least one declarative validation example.");
}

class CapturedOutput implements TextOutput {
  private chunks: string[] = [];

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  text(): string {
    return this.chunks.join("");
  }
}
