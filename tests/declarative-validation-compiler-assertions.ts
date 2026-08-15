import { describe, expect, it } from "vitest";

import type { ValidationProfile } from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

describe("declarative validation compiler assertion proof", () => {
  it("rejects typed exists assertions with values other than true before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "exists.false",
          select: { target: "document" },
          assert: {
            exists: false,
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "exists.false",
        message: "exists must be true.",
        severity: "error",
      },
    ]);
  });

  it("rejects typed text assertions with no predicate before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "text.empty",
          select: { target: "section", title: "Objective" },
          assert: { text: {} },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "text.empty",
        message: "text must include contains or a non-empty excludes array.",
        severity: "error",
      },
    ]);
  });

  it("rejects typed textLength assertions with no bound before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "text-length.empty",
          select: { target: "section", title: "Objective" },
          assert: { textLength: {} },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "text-length.empty",
        message: "textLength must include min, max, or both.",
        severity: "error",
      },
    ]);
  });

  it("rejects typed textLength assertions with invalid bounds before execution", () => {
    const invalidTextLengthAssertions = [
      {
        assert: { textLength: { min: -1 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-length.invalid-bound",
            message: "textLength.min must be a non-negative integer when provided.",
            severity: "error",
          },
        ],
      },
      {
        assert: { textLength: { max: 2.5 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-length.invalid-bound",
            message: "textLength.max must be a non-negative integer when provided.",
            severity: "error",
          },
        ],
      },
      {
        assert: { textLength: { min: 10, max: 3 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-length.invalid-bound",
            message: "textLength.min must be less than or equal to textLength.max.",
            severity: "error",
          },
        ],
      },
      {
        assert: { textLength: { min: 1, unit: "words" } },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "unit".',
            severity: "error",
          },
        ],
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"] & Record<string, unknown>;
      diagnostics: unknown[];
    }[];

    for (const { assert, diagnostics } of invalidTextLengthAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "text-length.invalid-bound",
            select: { target: "section", title: "Objective" },
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
    }
  });

  it("rejects typed textFormat assertions with invalid shapes before execution", () => {
    const invalidTextFormatAssertions = [
      {
        assert: {
          textFormat: null,
        } as unknown as ValidationProfile["rules"][number]["assert"],
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-format.invalid-shape",
            message: "textFormat must be an object.",
            severity: "error",
          },
        ],
      },
      {
        assert: { textFormat: {} },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-format.invalid-shape",
            message: 'textFormat.format must be "isoDate".',
            severity: "error",
          },
        ],
      },
      {
        assert: {
          textFormat: { format: "rfc3339" },
        } as unknown as ValidationProfile["rules"][number]["assert"],
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "text-format.invalid-shape",
            message: 'textFormat.format must be "isoDate".',
            severity: "error",
          },
        ],
      },
      {
        assert: {
          textFormat: { format: "isoDate", regex: "\\d+" },
        } as unknown as ValidationProfile["rules"][number]["assert"],
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "regex".',
            severity: "error",
          },
        ],
      },
    ];

    for (const { assert, diagnostics } of invalidTextFormatAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "text-format.invalid-shape",
            select: { target: "heading", depth: 2 },
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
    }
  });

  it("rejects typed v2 ids count assertions with invalid bounds before execution", () => {
    const invalidIdCountAssertions = [
      {
        assert: { ids: { unique: true, minCount: -1 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "ids.invalid-count",
            message: "ids.minCount must be a non-negative integer when provided.",
            severity: "error",
          },
        ],
      },
      {
        assert: { ids: { unique: true, maxCount: 2.5 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "ids.invalid-count",
            message: "ids.maxCount must be a non-negative integer when provided.",
            severity: "error",
          },
        ],
      },
      {
        assert: { ids: { unique: true, minCount: 10, maxCount: 3 } },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            ruleId: "ids.invalid-count",
            message: "ids.minCount must be less than or equal to ids.maxCount.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"];
      diagnostics: unknown[];
    }[];

    for (const { assert, diagnostics } of invalidIdCountAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "ids.invalid-count",
            select: { target: "tableCell", column: "ID" },
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
    }
  });

  it("rejects typed v1 ids count assertions as unsupported before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "ids.v1-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { unique: true, minCount: 1 } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "minCount".',
        severity: "error",
      },
    ]);
  });

  it("rejects ids assertions without explicit unique true before execution", () => {
    const invalidIdAssertions = [
      { ids: {}, select: { target: "document" } },
      { ids: { unique: false }, select: { target: "document" } },
      { ids: { prefix: "REQ" }, select: { target: "document" } },
    ] satisfies {
      ids: ValidationProfile["rules"][number]["assert"]["ids"];
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { ids, select } of invalidIdAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "ids.invalid",
            select,
            assert: { ids },
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "ids.invalid",
          message: "ids.unique must be true.",
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed assertions with parser-invalid empty string fields before execution", () => {
    const invalidStringAssertions = [
      {
        assert: { text: { contains: "" } },
        message: "contains must be a non-empty string when provided.",
        select: { target: "section", title: "Objective" },
      },
      {
        assert: { ids: { unique: true, prefix: "" } },
        message: "prefix must be a non-empty string when provided.",
        select: { target: "document" },
      },
      {
        assert: {
          textLength: { min: "short" },
        } as unknown as ValidationProfile["rules"][number]["assert"],
        message: "textLength.min must be a number when provided.",
        select: { target: "section", title: "Objective" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidStringAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.empty-string",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.empty-string",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed assertions with unsupported keys before execution", () => {
    const invalidUnsupportedKeyAssertions = [
      {
        assert: {
          text: { contains: "Mission", callback: "isMissionReady" },
        },
        message: 'Unsupported validation profile key "callback".',
        select: { target: "section", title: "Objective" },
      },
      {
        assert: {
          text: { containsExactlyOne: "Mission" },
        },
        message: 'Unsupported validation profile key "containsExactlyOne".',
        select: { target: "section", title: "Objective" },
      },
      {
        assert: {
          matches: "REQ",
          text: { contains: "Mission" },
        },
        message: 'Unsupported validation profile key "matches".',
        select: { target: "section", title: "Objective" },
      },
      {
        assert: {
          references: {
            idsFrom: { section: "Requirements", regexp: "REQ-.*" },
            mustAppearIn: ["Verification"],
          },
        },
        message: 'Unsupported validation profile key "regexp".',
        select: { target: "document" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"] & Record<string, unknown>;
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidUnsupportedKeyAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.unsupported-key",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.unsupportedKey",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects removed direct typed assertion column modifiers before execution", () => {
    const removedColumnAssertions = [
      {
        assert: { ids: { unique: true, column: "ID" } },
        select: { target: "tableCell", column: "ID" },
      },
      {
        assert: { text: { column: "Statement", contains: "shall" } },
        select: { target: "tableCell", column: "Statement" },
      },
      {
        assert: {
          textOccurrenceCount: {
            text: "shall",
            count: 1,
            column: "Statement",
          },
        },
        select: { target: "tableCell", column: "Statement" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"] &
        Record<string, unknown>;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, select } of removedColumnAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.removed-column",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "column".',
          severity: "error",
        },
      ]);
    }
  });

  it("reports removed ids column modifiers before missing unique diagnostics", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "ids.removed-column-without-unique",
          select: { target: "tableCell", column: "ID" },
          assert: {
            ids: { column: "ID" },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "column".',
        severity: "error",
      },
      {
        code: "profile.config.invalidShape",
        ruleId: "ids.removed-column-without-unique",
        message: "ids.unique must be true.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed non-object assertion payloads before execution", () => {
    const invalidObjectAssertions = [
      {
        assert: { sectionsRequired: null },
        message: "sectionsRequired must be an object.",
      },
      {
        assert: { ids: null },
        message: "ids must be an object.",
      },
      {
        assert: { frontmatterRequired: null },
        message: "frontmatterRequired must be an object.",
      },
    ];

    for (const { assert, message } of invalidObjectAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.non-object",
            select: { target: "document" },
            assert: assert as unknown as ValidationProfile["rules"][number]["assert"],
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.non-object",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed non-object rule assert payloads before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "assert.non-object",
          select: { target: "document" },
          assert: null as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "assert.non-object",
        message: "Rule assert must be an object.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed frontmatterShape payloads before execution", () => {
    const invalidFrontmatterShapeAssertions = [
      {
        frontmatterShape: null,
        message: "frontmatterShape must be an object.",
      },
      {
        frontmatterShape: {},
        message: "frontmatterShape must include presence or fields.",
      },
      {
        frontmatterShape: { presence: "optional" },
        message:
          'frontmatterShape.presence must be "required" or "forbidden" when provided.',
      },
      {
        frontmatterShape: { fields: [] },
        message:
          "frontmatterShape.fields must be a non-empty array when provided.",
      },
      {
        frontmatterShape: { fields: [{ field: "type" }] },
        message:
          "frontmatterShape.fields[0] must include required, valueType, or nonEmpty.",
      },
      {
        frontmatterShape: { fields: [{ field: "type", required: false }] },
        message:
          "frontmatterShape.fields[0].required must be true when provided.",
      },
      {
        frontmatterShape: { fields: [{ field: "type", valueType: "date" }] },
        message:
          'frontmatterShape.fields[0].valueType must be "string", "number", "boolean", "array", "object", or "null" when provided.',
      },
      {
        frontmatterShape: { fields: [{ field: "type", nonEmpty: false }] },
        message:
          "frontmatterShape.fields[0].nonEmpty must be true when provided.",
      },
      {
        frontmatterShape: {
          fields: [{ field: "tags", valueType: "array", nonEmpty: true }],
        },
        message:
          'frontmatterShape.fields[0].nonEmpty can be combined only with valueType "string".',
      },
      {
        frontmatterShape: {
          presence: "forbidden",
          fields: [{ field: "type", required: true }],
        },
        message:
          "frontmatterShape.fields cannot be provided when presence is forbidden.",
      },
      {
        frontmatterShape: {
          fields: [
            { field: "type", required: true },
            { field: "type", valueType: "string" },
          ],
        },
        message: 'frontmatterShape.fields[1].field duplicates field "type".',
      },
    ] satisfies {
      frontmatterShape: unknown;
      message: string;
    }[];

    for (const { frontmatterShape, message } of invalidFrontmatterShapeAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "frontmatter.invalid-shape",
            select: { target: "document" },
            assert: {
              frontmatterShape,
            } as unknown as ValidationProfile["rules"][number]["assert"],
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "frontmatter.invalid-shape",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed references assertions without idsFrom before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "references.missing-ids-from",
          select: { target: "document" },
          assert: {
            references: { mustAppearIn: ["Verification"] },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "references.missing-ids-from",
        message: "references.idsFrom must be an object.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed ids assertions with non-boolean caseSensitive before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "ids.invalid-case-sensitive",
          select: { target: "document" },
          assert: {
            ids: { unique: true, caseSensitive: "no" },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "ids.invalid-case-sensitive",
        message: "caseSensitive must be a boolean when provided.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed assertions with parser-invalid empty string arrays before execution", () => {
    const invalidArrayAssertions = [
      {
        assert: { sectionsRequired: { headings: [] } },
        message:
          "sectionsRequired.headings must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { tableColumnsRequired: { columns: [] } },
        message:
          "tableColumnsRequired.columns must be an array of non-empty strings.",
        select: { target: "table" },
      },
      {
        assert: { references: { idsFrom: {}, mustAppearIn: [] } },
        message: "references.mustAppearIn must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { frontmatterRequired: { fields: [] } },
        message:
          "frontmatterRequired.fields must be an array of non-empty strings.",
        select: { target: "document" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidArrayAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.empty-array",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.empty-array",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("compiles direct v2 tableColumnsExact assertions only for table selectors", () => {
    const passing = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.columns",
          select: { target: "table", header: ["Contract state"] },
          assert: {
            tableColumnsExact: {
              columns: ["Contract state", "Execution route", "State rationale"],
            },
          },
        },
      ],
    });

    expect(passing.diagnostics).toEqual([]);
    expect(passing.plan?.rules[0]).toMatchObject({
      selector: { target: "table", header: ["Contract state"] },
      assertions: [
        {
          kind: "tableColumnsExact",
          columns: ["Contract state", "Execution route", "State rationale"],
        },
      ],
    });

    const incompatible = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.columns.incompatible",
          select: { target: "document" },
          assert: { tableColumnsExact: { columns: ["Contract state"] } },
        },
      ],
    });

    expect(incompatible.plan).toBeUndefined();
    expect(incompatible.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "task-control.columns.incompatible",
        message:
          'Assertion "tableColumnsExact" is compatible only with table selectors.',
        severity: "error",
      },
    ]);
  });

  it("rejects invalid direct v2 tableColumnsExact payloads before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.columns.invalid",
          select: { target: "table" },
          assert: {
            tableColumnsExact: { columns: [] },
          },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "task-control.columns.invalid",
        message:
          "tableColumnsExact.columns must be an array of non-empty strings.",
        severity: "error",
      },
    ]);

    const unsupported = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.columns.unsupported-key",
          select: { target: "table" },
          assert: {
            tableColumnsExact: {
              columns: ["Contract state"],
              order: "strict",
            },
          },
        },
      ],
    } as unknown as ValidationProfile);

    expect(unsupported.plan).toBeUndefined();
    expect(unsupported.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "order".',
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed v1 tableColumnsExact assertions before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "task-control.columns.v1",
          select: { target: "table" },
          assert: { tableColumnsExact: { columns: ["Contract state"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "tableColumnsExact".',
        severity: "error",
      },
    ]);
  });

  it("rejects removed sectionOrder assertions before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "section-order.removed",
          select: { target: "document" },
          assert: {
            sectionOrder: { headings: ["Objective"] },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "sectionOrder".',
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed empty assertion objects before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "assert.empty",
          select: { target: "document" },
          assert: {},
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "assert.empty",
        message: "Rule assert must include at least one supported assertion.",
        severity: "error",
      },
    ]);
  });
});
