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

interface GroupedRuleFixtureSuite {
  cases: GroupedRuleFixtureCase[];
}

interface GroupedRuleFixtureCase {
  name: string;
  contract: string;
  markdown: string;
  profile: unknown;
  expected: {
    valid: boolean;
    diagnostics?: ExpectedDiagnostic[];
    ruleResult: ExpectedRuleResult;
  };
}

interface ExpectedRuleResult {
  ruleId: string;
  status: "passed" | "failed";
  passed: boolean;
  diagnostics?: ExpectedDiagnostic[];
  evaluation: ExpectedEvaluation;
}

interface ExpectedEvaluation {
  kind: "anyOf" | "allOf";
  selectedBranch?: ExpectedBranchReference;
  branches: ExpectedBranchResult[];
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
  "../fixtures/declarative-validation/conditional-v2/grouped-rules.yaml";
const fixtureSuite = parseYaml(
  readFileSync(new URL(fixturePath, import.meta.url), "utf8"),
) as GroupedRuleFixtureSuite;
const expectedFixtureNames = [
  "anyof-selected-second-branch-pass",
  "anyof-all-branches-fail",
  "allof-all-branches-pass",
  "allof-one-branch-fail",
];

describe("conditional v2 grouped-rule fixture suite", () => {
  it("covers the BEL-1103 grouped-rule fixture contracts", () => {
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

      expect(result.valid).toBe(fixtureCase.expected.valid);
      expect(result.diagnostics).toEqual(
        expectedDiagnostics(fixtureCase.expected.diagnostics ?? []),
      );
      expect(result.ruleResults).toEqual([
        expectedRuleResult(fixtureCase.expected.ruleResult),
      ]);
      expect(result.evidence?.ruleResults).toEqual(result.ruleResults);
      expect(result.evidence?.diagnostics).toEqual(result.diagnostics);
    });
  }
});

function parseFixtureProfile(fixtureCase: GroupedRuleFixtureCase): ValidationProfile {
  const profileResult = parseValidationProfile(fixtureCase.profile);

  expect(profileResult.diagnostics).toEqual([]);
  if (profileResult.profile === undefined) {
    throw new Error(`Expected ${fixtureCase.name} profile to parse.`);
  }

  return profileResult.profile;
}

function fixtureDocument(fixtureCase: GroupedRuleFixtureCase) {
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
    evaluation: expectedEvaluation(expected.evaluation),
  };
}

function expectedEvaluation(expected: ExpectedEvaluation): unknown {
  return {
    kind: expected.kind,
    ...(expected.selectedBranch !== undefined
      ? { selectedBranch: expected.selectedBranch }
      : {}),
    branches: expected.branches.map(expectedBranchResult),
  };
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
