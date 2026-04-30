import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { snapshotRoot } from "./support/parser-fixture-support.js";
import { serializedRepeatabilityCases } from "./support/repeatability.js";

describe("WP-5 deterministic serialization repeatability", () => {
  it("VAL-5/EVD-5 serializes identical inputs and config byte-for-byte across ten runs", () => {
    const baseline = serializedRepeatabilityCases();
    const observedRuns = Array.from({ length: 10 }, () =>
      serializedRepeatabilityCases(),
    );

    expect(baseline).toHaveLength(8);

    for (const [runIndex, observed] of observedRuns.entries()) {
      expect(
        observed.map((testCase) => testCase.name),
        `run ${runIndex + 1} case order`,
      ).toEqual(baseline.map((testCase) => testCase.name));

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
      casesByName.get("parse:representative:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-parse-representative.json"),
    );
    await expect(
      casesByName.get("normalize:representative:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-normalize-representative.json"),
    );
    await expect(
      casesByName.get("validate:wp-4-diagnostics:pretty"),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "serialization/wp-5-validation-diagnostics.json"),
    );
  });
});
