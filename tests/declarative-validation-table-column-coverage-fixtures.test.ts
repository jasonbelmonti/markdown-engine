import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type EngineDocument,
  type ValidationProfile,
} from "../src/index.js";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

interface TableColumnCoverageFixtureSuite {
  cases: TableColumnCoverageFixtureCase[];
}

interface TableColumnCoverageFixtureCase {
  name: string;
  contract: string;
  stripFirstDataCellSourceEvidence?: boolean;
  stripSourceEvidence?: boolean;
  markdown: string;
  profile: unknown;
  expected: {
    valid: boolean;
    diagnostics?: ExpectedDiagnostic[];
    compiledAssertions: ExpectedCompiledTableColumnCoverageAssertion[];
  };
}

interface ExpectedDiagnostic {
  code: string;
  ruleId: string;
  message: string;
  sourceLine?: number;
}

interface ExpectedCompiledTableColumnCoverageAssertion {
  ruleId: string;
  source: {
    section: string;
    column: string;
    prefix?: string;
    caseSensitive?: boolean;
  };
  target: {
    section: string;
    tableHeader?: readonly string[];
    column: string;
  };
}

const fixturePath =
  "../fixtures/declarative-validation/conditional-v2/table-column-coverage.yaml";
const fixtureSuite = parseYaml(
  readFileSync(new URL(fixturePath, import.meta.url), "utf8"),
) as TableColumnCoverageFixtureSuite;
const expectedFixtureNames = [
  "coverage-pass",
  "wrong-target-column-fail",
  "narrative-text-fail",
  "missing-target-section",
  "missing-target-column",
  "source-less-missing-id",
  "later-duplicate-source-evidence",
  "case-insensitive-pass",
];

describe("conditional v2 table column coverage fixture suite", () => {
  it("covers the BEL-1096 table-column coverage fixture contracts", () => {
    expect(fixtureSuite.cases.map((fixtureCase) => fixtureCase.name)).toEqual(
      expectedFixtureNames,
    );
  });

  for (const fixtureCase of fixtureSuite.cases) {
    it(`${fixtureCase.name}: ${fixtureCase.contract}`, () => {
      const profile = parseFixtureProfile(fixtureCase);
      const document = fixtureDocument(fixtureCase);
      const result = validateWithProfile(document, profile);

      expect(result.valid).toBe(fixtureCase.expected.valid);
      expect(result.diagnostics).toEqual(
        expectedDiagnostics(fixtureCase.expected.diagnostics ?? []),
      );
      expectCompiledTableColumnCoverageAssertions(
        profile,
        fixtureCase.expected.compiledAssertions,
      );
    });
  }
});

function parseFixtureProfile(
  fixtureCase: TableColumnCoverageFixtureCase,
): ValidationProfile {
  const profileResult = parseValidationProfile(fixtureCase.profile);

  expect(profileResult.diagnostics).toEqual([]);
  if (profileResult.profile === undefined) {
    throw new Error(`Expected ${fixtureCase.name} profile to parse.`);
  }

  return profileResult.profile;
}

function fixtureDocument(
  fixtureCase: TableColumnCoverageFixtureCase,
): EngineDocument {
  const document = normalize(
    parse(fixtureCase.markdown, {
      path: `fixtures/declarative-validation/conditional-v2/${fixtureCase.name}.md`,
    }).parsed,
    { documentVersion: "1.0.0" },
  ).document;

  if (fixtureCase.stripSourceEvidence === true) {
    return withoutSourceEvidence(document);
  }

  if (fixtureCase.stripFirstDataCellSourceEvidence === true) {
    return withoutFirstDataCellSourceEvidence(document);
  }

  return document;
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

function expectCompiledTableColumnCoverageAssertions(
  profile: ValidationProfile,
  expectedAssertions: ExpectedCompiledTableColumnCoverageAssertion[],
): void {
  const compiledProfile = compileValidationProfile(profile);
  const actualAssertions = (compiledProfile.plan?.rules ?? []).flatMap((rule) =>
    rule.assertions
      .filter((assertion) => assertion.kind === "tableColumnCoverage")
      .map((assertion) => ({ ruleId: rule.ruleId, ...assertion })),
  );

  expect(compiledProfile.diagnostics).toEqual([]);
  expect(actualAssertions).toEqual(
    expectedAssertions.map((expectedAssertion) => ({
      ruleId: expectedAssertion.ruleId,
      kind: "tableColumnCoverage",
      source: {
        caseSensitive: true,
        ...expectedAssertion.source,
      },
      target: expectedAssertion.target,
      require: "everySourceId",
    })),
  );
}

function withoutSourceEvidence(document: EngineDocument): EngineDocument {
  const copy = structuredClone(document);
  stripSourceEvidence(copy);
  return copy;
}

function withoutFirstDataCellSourceEvidence(document: EngineDocument): EngineDocument {
  const copy = structuredClone(document);
  const firstDataCell = copy.tables?.[0]?.cells.find((cell) => !cell.header);

  if (firstDataCell !== undefined) {
    delete firstDataCell.sourceRange;
  }

  return copy;
}

function stripSourceEvidence(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(stripSourceEvidence);
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  delete record.source;
  delete record.sourceRange;
  Object.values(record).forEach(stripSourceEvidence);
}
