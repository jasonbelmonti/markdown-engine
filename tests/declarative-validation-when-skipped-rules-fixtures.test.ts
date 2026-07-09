import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "../src/index.js";

interface WhenFixtureSuite {
  cases: WhenFixtureCase[];
}

interface WhenFixtureCase {
  name: string;
  contract: string;
  markdown: string;
  profile: unknown;
  expected: {
    valid: boolean;
    diagnostics?: ExpectedDiagnostic[];
    profile: ExpectedProfileCounts;
    ruleResult: ExpectedRuleResult;
  };
}

interface ExpectedProfileCounts {
  ruleCount: number;
  evaluatedRuleCount: number;
  skippedRuleCount: number;
}

interface ExpectedRuleResult {
  ruleId: string;
  status: "passed" | "failed" | "skipped";
  passed: boolean;
  diagnostics?: ExpectedDiagnostic[];
  when?: ExpectedApplicability;
  evaluation: ExpectedEvaluation;
}

interface ExpectedApplicability {
  status: "matched" | "notMatched";
  diagnostics?: ExpectedDiagnostic[];
}

type ExpectedEvaluation =
  | ExpectedAssertionsEvaluation
  | ExpectedAnyOfEvaluation
  | ExpectedAllOfEvaluation
  | ExpectedSkippedEvaluation;

interface ExpectedAssertionsEvaluation {
  kind: "assertions";
  diagnostics?: ExpectedDiagnostic[];
}

interface ExpectedAnyOfEvaluation {
  kind: "anyOf";
  selectedBranch?: ExpectedBranchReference;
  branches: ExpectedBranchResult[];
}

interface ExpectedAllOfEvaluation {
  kind: "allOf";
  branches: ExpectedBranchResult[];
}

interface ExpectedSkippedEvaluation {
  kind: "skipped";
  reason: "whenNotMatched";
}

interface ExpectedBranchReference {
  branchIndex: number;
  label?: string;
}

interface ExpectedBranchResult extends ExpectedBranchReference {
  status: "passed" | "failed";
  diagnostics?: ExpectedDiagnostic[];
}

interface ExpectedDiagnostic {
  code: string;
  ruleId: string;
  message: string;
  sourceLine?: number;
}

const fixturePath =
  "../fixtures/declarative-validation/conditional-v2/when-skipped-rules.yaml";
const fixtureSuite = parseYaml(
  readFileSync(new URL(fixturePath, import.meta.url), "utf8"),
) as WhenFixtureSuite;
const expectedFixtureNames = [
  "flat-when-matched-pass",
  "flat-when-not-matched-skipped",
  "anyof-when-matched-pass",
  "anyof-when-not-matched-skipped",
  "allof-when-matched-pass",
  "allof-when-not-matched-skipped",
];

describe("conditional v2 when skipped-rule fixture suite", () => {
  it("covers the BEL-1107 when matched and skipped contracts", () => {
    expect(fixtureSuite.cases.map((fixtureCase) => fixtureCase.name)).toEqual(
      expectedFixtureNames,
    );
  });

  for (const fixtureCase of fixtureSuite.cases) {
    it(`${fixtureCase.name}: ${fixtureCase.contract}`, () => {
      const result = validateWithProfile(
        fixtureDocument(fixtureCase),
        parseFixtureProfile(fixtureCase),
        { includeEvidence: true },
      );
      const expectedRule = expectedRuleResult(fixtureCase.expected.ruleResult);

      expect(result.valid).toBe(fixtureCase.expected.valid);
      expect(result.diagnostics).toEqual(
        expectedDiagnostics(fixtureCase.expected.diagnostics ?? []),
      );
      expect(result.profile).toEqual({
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ...fixtureCase.expected.profile,
      });
      expect(result.ruleResults).toEqual([expectedRule]);
      expect(result.evidence?.ruleResults).toEqual(result.ruleResults);
      expect(result.evidence?.diagnostics).toEqual(result.diagnostics);

      if (fixtureCase.expected.ruleResult.status === "skipped") {
        expect(result.diagnostics).toEqual([]);
        expect(result.profile).toMatchObject({
          evaluatedRuleCount: 0,
          skippedRuleCount: 1,
        });
        expect(result.ruleResults[0]).toMatchObject({
          status: "skipped",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "skipped",
            reason: "whenNotMatched",
          },
        });
      }
    });
  }
});

function parseFixtureProfile(fixtureCase: WhenFixtureCase): ValidationProfile {
  const profileResult = parseValidationProfile(fixtureCase.profile);

  expect(profileResult.diagnostics).toEqual([]);
  if (profileResult.profile === undefined) {
    throw new Error(`Expected ${fixtureCase.name} profile to parse.`);
  }

  return profileResult.profile;
}

function fixtureDocument(fixtureCase: WhenFixtureCase) {
  return normalize(
    parse(fixtureCase.markdown, {
      path: `fixtures/declarative-validation/conditional-v2/${fixtureCase.name}.md`,
    }).parsed,
    { documentVersion: "1.0.0" },
  ).document;
}

function expectedRuleResult(expected: ExpectedRuleResult): unknown {
  return {
    ruleId: expected.ruleId,
    status: expected.status,
    passed: expected.passed,
    diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
    ...(expected.when !== undefined
      ? { when: expectedApplicability(expected.when) }
      : {}),
    evaluation: expectedEvaluation(expected.evaluation),
  };
}

function expectedApplicability(expected: ExpectedApplicability): unknown {
  return {
    status: expected.status,
    diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
  };
}

function expectedEvaluation(expected: ExpectedEvaluation): unknown {
  switch (expected.kind) {
    case "assertions":
      return {
        kind: expected.kind,
        diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
      };

    case "anyOf":
      return {
        kind: expected.kind,
        ...(expected.selectedBranch !== undefined
          ? { selectedBranch: expected.selectedBranch }
          : {}),
        branches: expected.branches.map(expectedBranchResult),
      };

    case "allOf":
      return {
        kind: expected.kind,
        branches: expected.branches.map(expectedBranchResult),
      };

    case "skipped":
      return {
        kind: expected.kind,
        reason: expected.reason,
      };
  }
}

function expectedBranchResult(expected: ExpectedBranchResult): unknown {
  return {
    branchIndex: expected.branchIndex,
    ...(expected.label !== undefined ? { label: expected.label } : {}),
    status: expected.status,
    diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
  };
}

function expectedDiagnostics(diagnostics: ExpectedDiagnostic[]): unknown[] {
  return diagnostics.map((diagnostic) => {
    const expected = {
      code: diagnostic.code,
      ruleId: diagnostic.ruleId,
      message: diagnostic.message,
      severity: "error",
    };

    return diagnostic.sourceLine === undefined
      ? expected
      : expect.objectContaining({
          ...expected,
          sourceRange: expect.objectContaining({
            start: expect.objectContaining({ line: diagnostic.sourceLine }),
          }),
        });
  });
}
