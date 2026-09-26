import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalize, parse, parseValidationProfile, validateWithProfile,
  type EngineDocument, type ValidationProfile,
} from "../src/index.js";

const fixtureRoot = "fixtures/declarative-validation/examples/table-rows-complete";
const oracle = JSON.parse(readFileSync(`${fixtureRoot}/oracle.json`, "utf8")) as {
  name: string; valid: boolean; failures: { row: number; line: number; actual: number[] }[];
}[];
const profile = {
  syntaxVersion: "markdown-engine.validation@v2",
  rules: [{ id: "rows.complete", select: { target: "table" }, assert: { tableRowsComplete: true } }],
} satisfies ValidationProfile;
const document = (markdown: string): EngineDocument => normalize(parse(markdown).parsed).document;
const fixture = (name: string) => readFileSync(`${fixtureRoot}/${name}.md`, "utf8");

describe("tableRowsComplete public API", () => {
  it.each(oracle)("checks the independent $name oracle through typed and YAML profiles", (entry) => {
    const doc = document(fixture(entry.name));
    const parsed = parseValidationProfile(readFileSync(`${fixtureRoot}/shape.yaml`, "utf8"));
    expect(parsed.diagnostics).toEqual([]);
    for (const input of [profile, parsed.profile!]) {
      const result = validateWithProfile(doc, input);
      expect(result.valid).toBe(entry.valid);
      expect(result.diagnostics).toHaveLength(entry.failures.length);
      for (const [index, failure] of entry.failures.entries()) {
        expect(result.diagnostics[index]).toMatchObject({
          code: "profile.validation.assertionFailed", ruleId: "rows.complete", severity: "error",
          message: expect.stringContaining(`body row ${failure.row} must have column positions [0,1]; found ${JSON.stringify(failure.actual)}.`),
          sourceRange: { start: { line: failure.line }, end: { line: failure.line } },
        });
      }
      expect(validateWithProfile(doc, input)).toEqual(result);
    }
  });

  it("locates each offending row using a real cell, not the missing cell or whole table", () => {
    expect(validateWithProfile(document(fixture("multiple")), profile).diagnostics).toEqual([
      {
        code: "profile.validation.assertionFailed", ruleId: "rows.complete", severity: "error",
        message: 'Selected table "node:0:table" body row 1 must have column positions [0,1]; found [0].',
        sourceRange: { start: { line: 3, column: 1, offset: 24 }, end: { line: 3, column: 6, offset: 29 } },
      },
      {
        code: "profile.validation.assertionFailed", ruleId: "rows.complete", severity: "error",
        message: 'Selected table "node:0:table" body row 2 must have column positions [0,1]; found [0,1,2].',
        sourceRange: { start: { line: 4, column: 1, offset: 30 }, end: { line: 4, column: 5, offset: 34 } },
      },
    ]);
  });

  it("omits unavailable row ranges even if a table range is available", () => {
    const doc = document(fixture("multiple"));
    const withoutCellRanges = {
      ...doc,
      tables: doc.tables!.map((table) => ({ ...table, cells: table.cells.map(({ sourceRange: _range, ...cell }) => cell) })),
    };
    const result = validateWithProfile(withoutCellRanges, profile);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics.every((diagnostic) => !("sourceRange" in diagnostic))).toBe(true);
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      'Selected table "node:0:table" body row 1 must have column positions [0,1]; found [0].',
      'Selected table "node:0:table" body row 2 must have column positions [0,1]; found [0,1,2].',
    ]);
    expect(validateWithProfile(withoutCellRanges, profile)).toEqual(result);
  });

  it("uses each selected table's own header width and reports both table identities", () => {
    const markdown = `${fixture("missing")}\n| C | D | E |\n| --- | --- | --- |\n| c | d |\n`;
    const result = validateWithProfile(document(markdown), profile);
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      'Selected table "node:0:table" body row 1 must have column positions [0,1]; found [0].',
      'Selected table "node:1:table" body row 1 must have column positions [0,1,2]; found [0,1].',
    ]);
    expect(result.diagnostics.map((d) => d.sourceRange?.start.line)).toEqual([3, 7]);
  });

  it("keeps explicit empty content and required row existence separate", () => {
    const nonblank: ValidationProfile = { ...profile, rules: [...profile.rules, {
      id: "values.nonblank", select: { target: "tableCell", column: "B" }, assert: { text: { nonBlank: true } },
    }] };
    expect(validateWithProfile(document(fixture("explicit-empty")), nonblank).diagnostics).toEqual([
      expect.objectContaining({ ruleId: "values.nonblank", code: "profile.validation.textBlank" }),
    ]);
    const rows: ValidationProfile = { ...profile, rules: [...profile.rules, {
      id: "rows.required", select: { target: "tableRow" }, assert: { selectionCount: { min: 1 } },
    }] };
    expect(validateWithProfile(document(fixture("header-only")), rows).diagnostics).toEqual([
      expect.objectContaining({ ruleId: "rows.required", code: "profile.validation.assertionFailed" }),
    ]);
    expect(validateWithProfile(document("No tables.\n"), profile).diagnostics).toEqual([
      { code: "profile.validation.emptySelection", ruleId: "rows.complete", severity: "error", message: "Rule selector did not match any document targets." },
    ]);
  });

  it("honors section descendants and header selection, leaving unselected malformed tables alone", () => {
    const selected: ValidationProfile = { ...profile, rules: [{ ...profile.rules[0],
      select: { target: "table", section: "Owned", header: ["A", "B"] },
    }] };
    const source = `## Owned\n\n### Nested\n\n${fixture("complete")}\n${fixture("missing").replace("A | B", "C | D")}\n## Appendix\n\n${fixture("missing")}`;
    expect(validateWithProfile(document(source), selected)).toMatchObject({ valid: true, diagnostics: [] });
    const broken = source.replace("| x | y |", "| x |");
    const result = validateWithProfile(document(broken), selected);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.sourceRange?.start.line).toBe(7);
  });

  it("preserves legacy headers and normalization on the downstream reproducer", () => {
    const doc = document(fixture("consumer-missing"));
    const before = JSON.stringify(doc);
    for (const [name, valid] of [["legacy", true], ["profile", false]] as const) {
      const parsed = parseValidationProfile(readFileSync(`${fixtureRoot}/${name}.yaml`, "utf8"));
      const result = validateWithProfile(doc, parsed.profile!);
      expect(result.valid).toBe(valid);
      if (!valid) {
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0]).toMatchObject({
          message: expect.stringContaining("body row 2 must have column positions [0,1,2,3]; found [0,1,2]."),
          sourceRange: { start: { line: 20 } },
        });
      }
    }
    expect(JSON.stringify(doc)).toBe(before);
    const optIn = parseValidationProfile(readFileSync(`${fixtureRoot}/profile.yaml`, "utf8")).profile!;
    expect(validateWithProfile(document(fixture("consumer-repaired")), optIn).valid).toBe(true);
  });
});
