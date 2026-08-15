import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type EngineDocument,
  type ValidationProfile,
} from "../src/index.js";

const expectedColumns = [
  "Contract state",
  "Execution route",
  "State rationale",
] as const;

describe("declarative validation tableColumnsExact", () => {
  it("passes only when the complete normalized header sequence is exact", () => {
    const document = tableDocument(expectedColumns);
    const parsed = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: task-control.columns
    select:
      target: table
    assert:
      tableColumnsExact:
        columns:
          - Contract state
          - Execution route
          - State rationale
`);

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.profile).toBeDefined();
    expect(
      validateWithProfile(document, parsed.profile as ValidationProfile),
    ).toMatchObject({ valid: true, diagnostics: [] });
    expect(validateWithProfile(document, exactProfile(expectedColumns))).toMatchObject({
      valid: true,
      diagnostics: [],
    });
  });

  it.each([
    [
      "additional column before",
      ["Owner", "Contract state", "Execution route", "State rationale"],
    ],
    [
      "additional column between",
      ["Contract state", "Owner", "Execution route", "State rationale"],
    ],
    [
      "additional column after",
      ["Contract state", "Execution route", "State rationale", "Owner"],
    ],
    ["missing column", ["Contract state", "State rationale"]],
    [
      "reordered columns",
      ["Execution route", "Contract state", "State rationale"],
    ],
    [
      "renamed column",
      ["Contract state", "Execution path", "State rationale"],
    ],
    [
      "duplicated column",
      [
        "Contract state",
        "Execution route",
        "Execution route",
        "State rationale",
      ],
    ],
  ] as const)("rejects %s", (_name, actualColumns) => {
    const document = tableDocument(actualColumns);
    const result = validateWithProfile(document, exactProfile(expectedColumns));

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        ruleId: "task-control.columns",
        severity: "error",
        message: `Selected table columns must exactly match ${JSON.stringify(expectedColumns)}; found ${JSON.stringify(actualColumns)}.`,
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 1 }),
        }),
      }),
    ]);
  });

  it("uses the first mismatched normalized header cell as source evidence", () => {
    const document = tableDocument([
      "Contract state",
      "Owner",
      "Execution route",
      "State rationale",
    ]);
    const expectedSourceRange = document.tables?.[0]?.cells.find(
      (cell) => cell.header && cell.text === "Owner",
    )?.sourceRange;
    const result = validateWithProfile(document, exactProfile(expectedColumns));

    expect(expectedSourceRange).toBeDefined();
    expect(result.diagnostics[0]?.sourceRange).toEqual(expectedSourceRange);
  });

  it("retains empty-selection behavior for table assertions", () => {
    const result = validateWithProfile(
      normalize(parse("# Task Control\n").parsed).document,
      exactProfile(expectedColumns),
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: "task-control.columns",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
    ]);
  });

  it("leaves tableColumnsRequired ordered-subsequence semantics unchanged", () => {
    const document = tableDocument([
      "Owner",
      "Contract state",
      "Execution route",
      "State rationale",
      "Reviewer",
    ]);
    const required = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "task-control.columns.required",
          select: { target: "table" },
          assert: { tableColumnsRequired: { columns: expectedColumns } },
        },
      ],
    });
    const exact = validateWithProfile(document, exactProfile(expectedColumns));

    expect(required).toMatchObject({ valid: true, diagnostics: [] });
    expect(exact.valid).toBe(false);
    expect(exact.diagnostics[0]?.message).toContain("must exactly match");
  });
});

function exactProfile(columns: readonly string[]): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    rules: [
      {
        id: "task-control.columns",
        select: { target: "table" },
        assert: { tableColumnsExact: { columns } },
      },
    ],
  };
}

function tableDocument(columns: readonly string[]): EngineDocument {
  return normalize(
    parse(
      [
        `| ${columns.join(" | ")} |`,
        `| ${columns.map(() => "---").join(" | ")} |`,
        `| ${columns.map(() => "value").join(" | ")} |`,
      ].join("\n"),
    ).parsed,
    { documentVersion: "1.0.0" },
  ).document;
}
