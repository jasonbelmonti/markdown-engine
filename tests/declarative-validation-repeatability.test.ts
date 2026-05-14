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
  "declarative-validation:text-length-result:compact",
  "declarative-validation:text-length-result:pretty",
  "declarative-validation:text-length-evidence:compact",
  "declarative-validation:text-length-evidence:pretty",
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
