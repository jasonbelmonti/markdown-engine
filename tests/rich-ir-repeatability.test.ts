import { describe, expect, it } from "vitest";

import { serializedRepeatabilityCases } from "./support/repeatability.js";

const richIrCaseNames = [
  "rich-ir:document:compact",
  "rich-ir:document:pretty",
  "rich-ir:annotated-document:compact",
  "rich-ir:annotated-document:pretty",
  "rich-ir:annotation-diagnostics:compact",
  "rich-ir:annotation-diagnostics:pretty",
] as const;

describe("BEL-949 rich IR serialization repeatability", () => {
  it("serializes 1.0 rich IR outputs byte-for-byte across ten runs", () => {
    const baseline = richIrCases(serializedRepeatabilityCases());
    const observedRuns = Array.from({ length: 10 }, () =>
      richIrCases(serializedRepeatabilityCases()),
    );

    expect(baseline.map((testCase) => testCase.name)).toEqual(richIrCaseNames);

    for (const [runIndex, observed] of observedRuns.entries()) {
      expect(
        observed.map((testCase) => testCase.name),
        `run ${runIndex + 1} rich IR case order`,
      ).toEqual(richIrCaseNames);

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

  it("covers rich IR structure, source slices, annotations, diagnostics, and serializer modes", () => {
    const casesByName = new Map(
      richIrCases(serializedRepeatabilityCases()).map((testCase) => [
        testCase.name,
        testCase.json,
      ]),
    );
    const richIrDocument = parseJsonCase(casesByName, "rich-ir:document:pretty");
    const annotatedDocument = parseJsonCase(
      casesByName,
      "rich-ir:annotated-document:pretty",
    );
    const diagnosticResult = parseJsonCase(
      casesByName,
      "rich-ir:annotation-diagnostics:pretty",
    );

    expect(jsonCase(casesByName, "rich-ir:document:compact")).not.toContain(
      "\n",
    );
    expect(jsonCase(casesByName, "rich-ir:document:pretty")).toContain("\n");
    expect(richIrDocument).toMatchObject({
      version: "1.0.0-draft",
      compatibility: {
        mode: "default",
      },
      target: {
        kind: "node",
        nodeType: "document",
      },
      sections: expect.arrayContaining([
        expect.objectContaining({
          title: "Mission Brief",
        }),
      ]),
      tables: expect.arrayContaining([
        expect.objectContaining({
          cells: expect.arrayContaining([
            expect.objectContaining({
              text: "go",
              rowIndex: 1,
              columnIndex: 1,
            }),
          ]),
        }),
      ]),
      lists: expect.arrayContaining([
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              checked: true,
              itemIndex: 0,
            }),
          ]),
        }),
      ]),
      links: expect.arrayContaining([
        expect.objectContaining({
          url: "https://example.com/markdown-engine",
        }),
      ]),
      textSpans: expect.arrayContaining([
        expect.objectContaining({
          text: "Use markdown-engine to prove the structural path.",
        }),
      ]),
    });
    expect(JSON.stringify(richIrDocument)).toContain(
      "Use [markdown-engine](https://example.com/markdown-engine) to prove the structural path.",
    );
    expect(arrayProperty(annotatedDocument, "annotations")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "annotation:mission-paragraph",
          target: expect.objectContaining({
            kind: "node",
          }),
        }),
        expect.objectContaining({
          id: "annotation:mission-source",
          target: expect.objectContaining({
            kind: "source",
          }),
        }),
      ]),
    );
    expect(recordProperty(diagnosticResult, "valid")).toBe(false);
    expect(arrayProperty(diagnosticResult, "diagnostics")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "annotation.target.unknown",
          severity: "error",
        }),
      ]),
    );
  });
});

function richIrCases(
  cases: ReturnType<typeof serializedRepeatabilityCases>,
): ReturnType<typeof serializedRepeatabilityCases> {
  return cases.filter((testCase) => testCase.name.startsWith("rich-ir:"));
}

function parseJsonCase(
  casesByName: ReadonlyMap<string, string>,
  name: string,
): unknown {
  return JSON.parse(jsonCase(casesByName, name)) as unknown;
}

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

function arrayProperty(value: unknown, property: string): unknown[] {
  const propertyValue = recordProperty(value, property);

  if (!Array.isArray(propertyValue)) {
    throw new TypeError(`Expected ${property} to be an array.`);
  }

  return propertyValue;
}

function recordProperty(value: unknown, property: string): unknown {
  if (value === null || typeof value !== "object") {
    throw new TypeError(`Expected ${property} owner to be an object.`);
  }

  return (value as Record<string, unknown>)[property];
}
