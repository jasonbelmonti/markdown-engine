import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type DeclarativeSelector,
  type ValidationProfile,
} from "../src/index.js";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

const selectors: readonly DeclarativeSelector[] = [
  { target: "document" },
  { target: "section", title: "Inventory" },
  { target: "heading", text: "Inventory" },
  { target: "table", section: "Inventory" },
  { target: "tableRow", section: "Inventory" },
  { target: "tableCell", section: "Inventory", column: "ID" },
  { target: "textSpan", section: "Inventory" },
  { target: "link", section: "Inventory" },
  { target: "list", section: "Inventory" },
];

const twoTableSource = [
  "# Inventory",
  "",
  "| ID |",
  "| --- |",
  "| A |",
  "",
  "| ID |",
  "| --- |",
  "| B |",
  "",
].join("\n");

describe("declarative validation selectionCount", () => {
  it("admits v2 bounds and keeps selectionCount unsupported in v1", () => {
    const v2 = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: tables.exactly-one
    select:
      target: table
    assert:
      selectionCount:
        min: 1
        max: 1
`);

    expect(v2.diagnostics).toEqual([]);
    expect(v2.profile?.rules[0]).toMatchObject({
      assert: { selectionCount: { min: 1, max: 1 } },
    });

    const v1 = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: tables.exactly-one
    select:
      target: table
    assert:
      selectionCount:
        min: 1
        max: 1
`);

    expect(v1.profile).toBeUndefined();
    expect(v1.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "selectionCount".',
      }),
    );

    const directV1 = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "tables.direct-v1",
          select: { target: "table" },
          assert: { selectionCount: { min: 1 } },
        },
      ],
    });

    expect(directV1.plan).toBeUndefined();
    expect(directV1.diagnostics).toContainEqual(
      expect.objectContaining({ code: "profile.config.unsupportedKey" }),
    );
  });

  it.each([
    ["{}", "selectionCount must include min, max, or both."],
    [
      "min: -1",
      "selectionCount.min must be a non-negative integer when provided.",
    ],
    [
      "max: 1.5",
      "selectionCount.max must be a non-negative integer when provided.",
    ],
    [
      "min: 2\n        max: 1",
      "selectionCount.min must be less than or equal to selectionCount.max.",
    ],
    ["min: 1\n        unit: rows", 'Unsupported validation profile key "unit".'],
  ])("rejects invalid v2 bounds: %s", (selectionCount, message) => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: selection.invalid
    select:
      target: table
    assert:
      selectionCount:
        ${selectionCount}
`);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ message }),
    );
  });

  it.each([
    [{}, "selectionCount must include min, max, or both."],
    [
      { min: "1" },
      "selectionCount.min must be a number when provided.",
    ],
    [
      { min: 2, max: 1 },
      "selectionCount.min must be less than or equal to selectionCount.max.",
    ],
    [{ min: 1, unit: "rows" }, 'Unsupported validation profile key "unit".'],
  ])("rejects invalid direct profile bounds: %j", (bounds, message) => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "selection.direct-invalid",
          select: { target: "table" },
          assert: { selectionCount: bounds },
        },
      ],
    } as unknown as ValidationProfile);

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ message }),
    );
  });

  it("compiles the assertion for every supported selector target", () => {
    for (const selector of selectors) {
      const result = compileValidationProfile(
        selectionCountProfile(selector, { min: 1, max: 3 }),
      );

      expect(result.diagnostics).toEqual([]);
      expect(result.plan?.rules[0]).toMatchObject({
        selector,
        assertions: [{ kind: "selectionCount", min: 1, max: 3 }],
      });
    }
  });

  it("treats an empty selection as a count of zero", () => {
    const document = normalize(parse("# Inventory\n").parsed).document;

    expect(
      validateWithProfile(
        document,
        selectionCountProfile(
          { target: "section", title: "Missing" },
          { max: 0 },
        ),
      ),
    ).toMatchObject({ valid: true, diagnostics: [] });

    const underflow = validateWithProfile(
      document,
      selectionCountProfile(
        { target: "section", title: "Missing" },
        { min: 1 },
      ),
    );

    expect(underflow.valid).toBe(false);
    expect(underflow.diagnostics).toEqual([
      {
        code: "profile.validation.assertionFailed",
        message: "Rule selector target count must be at least 1; found 0.",
        ruleId: "selection.count",
        severity: "error",
      },
    ]);
  });

  it("passes inclusive exact bounds and source-anchors the first excess target", () => {
    const document = normalize(parse(twoTableSource).parsed, {
      documentVersion: "1.0.0",
    }).document;
    const exact = validateWithProfile(
      document,
      selectionCountProfile({ target: "table" }, { min: 2, max: 2 }),
    );

    expect(exact).toMatchObject({ valid: true, diagnostics: [] });

    const overflow = validateWithProfile(
      document,
      selectionCountProfile({ target: "table" }, { max: 1 }),
    );

    expect(overflow.valid).toBe(false);
    expect(overflow.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        message: "Rule selector target count must be at most 1; found 2.",
        ruleId: "selection.count",
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 7, column: 1 }),
        }),
      }),
    ]);
  });
});

function selectionCountProfile(
  select: DeclarativeSelector,
  bounds: { min?: number; max?: number },
): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    rules: [
      {
        id: "selection.count",
        select,
        assert: { selectionCount: bounds },
      },
    ],
  };
}
