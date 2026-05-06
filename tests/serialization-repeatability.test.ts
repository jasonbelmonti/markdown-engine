import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { snapshotRoot } from "./support/parser-fixture-support.js";
import { serializedRepeatabilityCases } from "./support/repeatability.js";

const expectedRepeatabilityCaseNames = [
  "parse:representative:compact",
  "parse:representative:pretty",
  "normalize:representative:compact",
  "normalize:representative:pretty",
  "validate:representative-pass:compact",
  "validate:representative-pass:pretty",
  "validate:wp-4-diagnostics:compact",
  "validate:wp-4-diagnostics:pretty",
  "rich-ir:document:compact",
  "rich-ir:document:pretty",
  "rich-ir:annotated-document:compact",
  "rich-ir:annotated-document:pretty",
  "rich-ir:annotation-diagnostics:compact",
  "rich-ir:annotation-diagnostics:pretty",
] as const;

describe("WP-5 deterministic serialization repeatability", () => {
  it("VAL-5/EVD-5 serializes identical inputs and config byte-for-byte across ten runs", () => {
    const baseline = serializedRepeatabilityCases();
    const observedRuns = Array.from({ length: 10 }, () =>
      serializedRepeatabilityCases(),
    );

    expect(baseline.map((testCase) => testCase.name)).toEqual(
      expectedRepeatabilityCaseNames,
    );

    for (const [runIndex, observed] of observedRuns.entries()) {
      expect(
        observed.map((testCase) => testCase.name),
        `run ${runIndex + 1} case order`,
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

  it("VAL-5: records stable serialized JSON snapshots for parse, normalize, and diagnostics", async () => {
    const casesByName = new Map(
      serializedRepeatabilityCases().map((testCase) => [
        testCase.name,
        testCase.json,
      ]),
    );

    await expect(
      jsonCase(casesByName, "parse:representative:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-parse-representative.json"),
    );
    await expect(
      jsonCase(casesByName, "normalize:representative:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-normalize-representative.json"),
    );
    await expect(
      jsonCase(casesByName, "validate:wp-4-diagnostics:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-validation-diagnostics.json"),
    );
  });
});

function jsonCase(
  casesByName: ReadonlyMap<string, string>,
  name: string,
): string {
  const json = casesByName.get(name);

  if (json === undefined) {
    throw new Error(`Missing repeatability case: ${name}`);
  }

  return json;
}
