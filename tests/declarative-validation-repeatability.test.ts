import { describe, expect, it } from "vitest";

import { declarativeValidationRepeatabilityCases } from "./support/declarative-validation-repeatability.js";

const expectedRepeatabilityCaseNames = [
  "declarative-validation:passing-result:compact",
  "declarative-validation:passing-result:pretty",
  "declarative-validation:passing-evidence:compact",
  "declarative-validation:passing-evidence:pretty",
  "declarative-validation:explicit-default-result:compact",
  "declarative-validation:explicit-default-result:pretty",
  "declarative-validation:alternate-path-result:compact",
  "declarative-validation:alternate-path-result:pretty",
  "declarative-validation:failing-result:compact",
  "declarative-validation:failing-result:pretty",
  "declarative-validation:failing-evidence:compact",
  "declarative-validation:failing-evidence:pretty",
  "declarative-validation:v2-flat-passing-result:compact",
  "declarative-validation:v2-flat-passing-result:pretty",
  "declarative-validation:v2-flat-passing-evidence:compact",
  "declarative-validation:v2-flat-passing-evidence:pretty",
  "declarative-validation:v2-flat-failing-result:compact",
  "declarative-validation:v2-flat-failing-result:pretty",
  "declarative-validation:v2-flat-failing-evidence:compact",
  "declarative-validation:v2-flat-failing-evidence:pretty",
  "declarative-validation:v2-grouped-result:compact",
  "declarative-validation:v2-grouped-result:pretty",
  "declarative-validation:v2-grouped-evidence:compact",
  "declarative-validation:v2-grouped-evidence:pretty",
  "declarative-validation:v2-when-result:compact",
  "declarative-validation:v2-when-result:pretty",
  "declarative-validation:v2-when-evidence:compact",
  "declarative-validation:v2-when-evidence:pretty",
  "declarative-validation:v2-id-count-result:compact",
  "declarative-validation:v2-id-count-result:pretty",
  "declarative-validation:v2-id-count-evidence:compact",
  "declarative-validation:v2-id-count-evidence:pretty",
  "declarative-validation:v2-table-column-coverage-result:compact",
  "declarative-validation:v2-table-column-coverage-result:pretty",
  "declarative-validation:v2-table-column-coverage-evidence:compact",
  "declarative-validation:v2-table-column-coverage-evidence:pretty",
  "declarative-validation:v2-composite-result:compact",
  "declarative-validation:v2-composite-result:pretty",
  "declarative-validation:v2-composite-evidence:compact",
  "declarative-validation:v2-composite-evidence:pretty",
  "declarative-validation:text-length-result:compact",
  "declarative-validation:text-length-result:pretty",
  "declarative-validation:text-length-evidence:compact",
  "declarative-validation:text-length-evidence:pretty",
  "declarative-validation:source-length-result:compact",
  "declarative-validation:source-length-result:pretty",
  "declarative-validation:source-length-evidence:compact",
  "declarative-validation:source-length-evidence:pretty",
  "declarative-validation:v2-composite-cli-json",
] as const;

describe("BEL-983 declarative validation evidence repeatability", () => {
  it("serializes results and evidence byte-for-byte across ten runs", () => {
    const baseline = declarativeValidationRepeatabilityCases();
    const observedRuns = Array.from({ length: 10 }, () =>
      declarativeValidationRepeatabilityCases(),
    );

    expect(baseline.map((testCase) => testCase.name)).toEqual(
      expectedRepeatabilityCaseNames,
    );

    for (const [runIndex, observed] of observedRuns.entries()) {
      expect(
        observed.map((testCase) => testCase.name),
        `run ${runIndex + 1} declarative validation case order`,
      ).toEqual(expectedRepeatabilityCaseNames);

      for (const [caseIndex, observedCase] of observed.entries()) {
        const baselineCase = baseline[caseIndex];

        expect(observedCase.sha256, observedCase.name).toBe(
          baselineCase?.sha256,
        );
        expect(observedCase.byteLength, observedCase.name).toBe(
          baselineCase?.byteLength,
        );
        expect(
          Buffer.compare(
            Buffer.from(observedCase.json, "utf8"),
            Buffer.from(baselineCase?.json ?? "", "utf8"),
          ),
          observedCase.name,
        ).toBe(0);
      }
    }
  });

  it("uses the documented canonical inputs for inputHash and profileHash", () => {
    const casesByName = new Map(
      declarativeValidationRepeatabilityCases().map((testCase) => [
        testCase.name,
        testCase.json,
      ]),
    );
    const passingResult = parseJsonCase(
      casesByName,
      "declarative-validation:passing-result:pretty",
    );
    const passingEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:passing-evidence:pretty",
    );
    const explicitDefaultResult = parseJsonCase(
      casesByName,
      "declarative-validation:explicit-default-result:pretty",
    );
    const alternatePathResult = parseJsonCase(
      casesByName,
      "declarative-validation:alternate-path-result:pretty",
    );
    const failingEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:failing-evidence:pretty",
    );
    const v2FlatPassingResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-flat-passing-result:pretty",
    );
    const v2FlatPassingEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-flat-passing-evidence:pretty",
    );
    const v2FlatFailingResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-flat-failing-result:pretty",
    );
    const v2FlatFailingEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-flat-failing-evidence:pretty",
    );
    const v2GroupedResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-grouped-result:pretty",
    );
    const v2GroupedEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-grouped-evidence:pretty",
    );
    const v2WhenResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-when-result:pretty",
    );
    const v2WhenEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-when-evidence:pretty",
    );
    const v2IdCountResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-id-count-result:pretty",
    );
    const v2IdCountEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-id-count-evidence:pretty",
    );
    const v2TableColumnCoverageResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-table-column-coverage-result:pretty",
    );
    const v2TableColumnCoverageEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-table-column-coverage-evidence:pretty",
    );
    const v2CompositeResult = parseJsonCase(
      casesByName,
      "declarative-validation:v2-composite-result:pretty",
    );
    const v2CompositeEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:v2-composite-evidence:pretty",
    );
    const v2CompositeCliJson = parseJsonCase(
      casesByName,
      "declarative-validation:v2-composite-cli-json",
    );
    const sourceLengthResult = parseJsonCase(
      casesByName,
      "declarative-validation:source-length-result:pretty",
    );
    const sourceLengthEvidence = parseJsonCase(
      casesByName,
      "declarative-validation:source-length-evidence:pretty",
    );

    expect(evidenceHash(passingEvidence, "inputHash")).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(evidenceHash(passingEvidence, "profileHash")).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(recordProperty(passingResult, "evidence")).toEqual(passingEvidence);
    expect(
      evidenceHash(
        recordProperty(explicitDefaultResult, "evidence"),
        "profileHash",
      ),
    ).toBe(evidenceHash(passingEvidence, "profileHash"));
    expect(
      evidenceHash(
        recordProperty(alternatePathResult, "evidence"),
        "inputHash",
      ),
    ).toBe(evidenceHash(passingEvidence, "inputHash"));
    expect(evidenceHash(failingEvidence, "profileHash")).not.toBe(
      evidenceHash(passingEvidence, "profileHash"),
    );
    expect(recordProperty(v2FlatPassingResult, "evidence")).toEqual(
      v2FlatPassingEvidence,
    );
    expect(recordProperty(v2FlatFailingResult, "evidence")).toEqual(
      v2FlatFailingEvidence,
    );
    expect(recordProperty(v2FlatPassingEvidence, "ruleResults")).toEqual(
      recordProperty(v2FlatPassingResult, "ruleResults"),
    );
    expect(recordProperty(v2FlatFailingEvidence, "ruleResults")).toEqual(
      recordProperty(v2FlatFailingResult, "ruleResults"),
    );
    expect(recordProperty(v2GroupedResult, "evidence")).toEqual(
      v2GroupedEvidence,
    );
    expect(recordProperty(v2GroupedEvidence, "ruleResults")).toEqual(
      recordProperty(v2GroupedResult, "ruleResults"),
    );
    expect(recordProperty(v2GroupedEvidence, "diagnostics")).toEqual(
      recordProperty(v2GroupedResult, "diagnostics"),
    );
    expect(recordProperty(v2WhenResult, "evidence")).toEqual(v2WhenEvidence);
    expect(recordProperty(v2WhenEvidence, "ruleResults")).toEqual(
      recordProperty(v2WhenResult, "ruleResults"),
    );
    expect(recordProperty(v2WhenEvidence, "diagnostics")).toEqual(
      recordProperty(v2WhenResult, "diagnostics"),
    );
    expect(recordProperty(sourceLengthResult, "evidence")).toEqual(
      sourceLengthEvidence,
    );
    expect(recordProperty(sourceLengthEvidence, "sourceLength")).toEqual(
      expect.any(Number),
    );
    expect(evidenceHash(sourceLengthEvidence, "inputHash")).not.toBe(
      evidenceHash(v2FlatPassingEvidence, "inputHash"),
    );
    const v2WhenProfile = recordProperty(v2WhenResult, "profile");
    expect(recordProperty(v2WhenProfile, "ruleCount")).toBe(2);
    expect(recordProperty(v2WhenProfile, "evaluatedRuleCount")).toBe(1);
    expect(recordProperty(v2WhenProfile, "skippedRuleCount")).toBe(1);
    expect(recordProperty(v2IdCountResult, "evidence")).toEqual(
      v2IdCountEvidence,
    );
    expect(recordProperty(v2IdCountEvidence, "ruleResults")).toEqual(
      recordProperty(v2IdCountResult, "ruleResults"),
    );
    expect(recordProperty(v2TableColumnCoverageResult, "evidence")).toEqual(
      v2TableColumnCoverageEvidence,
    );
    expect(
      recordProperty(v2TableColumnCoverageEvidence, "ruleResults"),
    ).toEqual(recordProperty(v2TableColumnCoverageResult, "ruleResults"));
    expect(recordProperty(v2CompositeResult, "evidence")).toEqual(
      v2CompositeEvidence,
    );
    expect(recordProperty(v2CompositeEvidence, "ruleResults")).toEqual(
      recordProperty(v2CompositeResult, "ruleResults"),
    );
    expect(recordProperty(v2CompositeEvidence, "diagnostics")).toEqual(
      recordProperty(v2CompositeResult, "diagnostics"),
    );
    expect(recordProperty(v2CompositeCliJson, "valid")).toBe(true);
    const v2CompositeCliProfile = recordProperty(
      v2CompositeCliJson,
      "profile",
    );
    expect(recordProperty(v2CompositeCliProfile, "syntaxVersion")).toBe(
      "markdown-engine.validation@v2",
    );
    expect(recordProperty(v2CompositeCliProfile, "ruleCount")).toBe(5);
    expect(recordProperty(v2CompositeCliProfile, "evaluatedRuleCount")).toBe(
      4,
    );
    expect(recordProperty(v2CompositeCliProfile, "skippedRuleCount")).toBe(1);
    const v2CompositeCliRuleResults = recordProperty(
      v2CompositeCliJson,
      "ruleResults",
    );
    expect(Array.isArray(v2CompositeCliRuleResults)).toBe(true);
    if (!Array.isArray(v2CompositeCliRuleResults)) {
      throw new TypeError("Expected CLI ruleResults to be an array.");
    }
    expect(
      v2CompositeCliRuleResults.map((ruleResult) =>
        recordProperty(ruleResult, "ruleId"),
      ),
    ).toEqual([
      "repeatability.flat.text",
      "repeatability.grouped.anyof",
      "repeatability.ids.count",
      "repeatability.table.coverage",
      "repeatability.when.skipped",
    ]);
    expect(
      v2CompositeCliRuleResults.map((ruleResult) =>
        recordProperty(ruleResult, "status"),
      ),
    ).toEqual(["passed", "passed", "passed", "passed", "skipped"]);
  });
});

function parseJsonCase(
  casesByName: ReadonlyMap<string, string>,
  name: string,
): unknown {
  const json = casesByName.get(name);

  if (json === undefined) {
    throw new Error(`Missing repeatability case: ${name}`);
  }

  return JSON.parse(json) as unknown;
}

function evidenceHash(evidence: unknown, property: string): string {
  const value = recordProperty(evidence, property);

  if (typeof value !== "string") {
    throw new TypeError(`Expected ${property} to be a string.`);
  }

  return value;
}

function recordProperty(value: unknown, property: string): unknown {
  if (value === null || typeof value !== "object") {
    throw new TypeError(`Expected ${property} owner to be an object.`);
  }

  return (value as Record<string, unknown>)[property];
}
