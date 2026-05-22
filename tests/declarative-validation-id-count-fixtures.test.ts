import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

interface IdCountFixtureSuite {
  cases: IdCountFixtureCase[];
}

interface IdCountFixtureCase {
  name: string;
  contract: string;
  markdown: string;
  profile: unknown;
  expected: {
    valid: boolean;
    diagnostics?: ExpectedDiagnostic[];
    compiledAssertions: ExpectedCompiledIdsAssertion[];
  };
}

interface ExpectedDiagnostic {
  code: string;
  ruleId: string;
  message: string;
  sourceLine?: number;
}

interface ExpectedCompiledIdsAssertion {
  ruleId: string;
  unique?: true;
  prefix?: string;
  caseSensitive?: boolean;
  minCount?: number;
  maxCount?: number;
}

const fixturePath =
  "../fixtures/declarative-validation/conditional-v2/id-count-bounds.yaml";
const fixtureSuite = parseYaml(
  readFileSync(new URL(fixturePath, import.meta.url), "utf8"),
) as IdCountFixtureSuite;
const expectedFixtureNames = [
  "min-count-pass",
  "min-count-fail",
  "max-count-pass",
  "max-count-fail",
  "combined-bounds-pass",
  "duplicate-id-compatibility",
  "prefix-filtering-pass",
  "case-sensitivity-pass",
];

describe("conditional v2 ID count fixture suite", () => {
  it("covers the BEL-1093 ID-count fixture contracts", () => {
    expect(fixtureSuite.cases.map((fixtureCase) => fixtureCase.name)).toEqual(
      expectedFixtureNames,
    );
  });

  for (const fixtureCase of fixtureSuite.cases) {
    it(`${fixtureCase.name}: ${fixtureCase.contract}`, () => {
      const profile = parseFixtureProfile(fixtureCase);
      const document = normalize(
        parse(fixtureCase.markdown, {
          path: `fixtures/declarative-validation/conditional-v2/${fixtureCase.name}.md`,
        }).parsed,
        { documentVersion: "1.0.0" },
      ).document;
      const result = validateWithProfile(document, profile);

      expect(result.valid).toBe(fixtureCase.expected.valid);
      expect(result.diagnostics).toEqual(
        expectedDiagnostics(fixtureCase.expected.diagnostics ?? []),
      );
      expectCompiledIdsAssertions(
        profile,
        fixtureCase.expected.compiledAssertions,
      );
    });
  }
});

function parseFixtureProfile(fixtureCase: IdCountFixtureCase): ValidationProfile {
  const profileResult = parseValidationProfile(fixtureCase.profile);

  expect(profileResult.diagnostics).toEqual([]);
  if (profileResult.profile === undefined) {
    throw new Error(`Expected ${fixtureCase.name} profile to parse.`);
  }

  return profileResult.profile;
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
      ? expect.objectContaining(expected)
      : expect.objectContaining({
          ...expected,
          sourceRange: expect.objectContaining({
            start: expect.objectContaining({ line: diagnostic.sourceLine }),
          }),
        });
  });
}

function expectCompiledIdsAssertions(
  profile: ValidationProfile,
  expectedAssertions: ExpectedCompiledIdsAssertion[],
): void {
  const compiledProfile = compileValidationProfile(profile);
  const actualAssertions = (compiledProfile.plan?.rules ?? []).flatMap((rule) =>
    rule.assertions
      .filter((assertion) => assertion.kind === "ids")
      .map((assertion) => ({ ruleId: rule.ruleId, ...assertion })),
  );

  expect(compiledProfile.diagnostics).toEqual([]);
  expect(actualAssertions).toEqual(
    expectedAssertions.map((expectedAssertion) =>
      expect.objectContaining({
        kind: "ids",
        caseSensitive: true,
        ...expectedAssertion,
      }),
    ),
  );
}
