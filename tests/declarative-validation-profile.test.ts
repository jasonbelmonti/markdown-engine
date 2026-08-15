import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "../src/index.js";

type ProfileInput = Parameters<typeof parseValidationProfile>[0];

interface InvalidProfileCase {
  name: string;
  input: ProfileInput;
  diagnostics: readonly {
    code: string;
    message?: string;
  }[];
}

describe("declarative validation profile parser", () => {
  it("parses YAML strings with nested rules", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: table-requirements
    severity: warning
    select:
      target: tableCell
      section: Requirements
      tableHeader:
        - ID
        - Statement
      column: Statement
    assert:
      text:
        contains: shall
        excludes:
          - maybe
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "table-requirements",
            severity: "warning",
            select: {
              target: "tableCell",
              section: "Requirements",
              tableHeader: ["ID", "Statement"],
              column: "Statement",
            },
            assert: {
              text: {
                contains: "shall",
                excludes: ["maybe"],
              },
            },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("parses textLength assertions with min, max, or both", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: text-length-min
    select:
      target: textSpan
    assert:
      textLength:
        min: 5
  - id: text-length-max
    select:
      target: textSpan
    assert:
      textLength:
        max: 20
  - id: text-length-range
    select:
      target: textSpan
    assert:
      textLength:
        min: 5
        max: 20
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "text-length-min",
            select: { target: "textSpan" },
            assert: { textLength: { min: 5 } },
          },
          {
            id: "text-length-max",
            select: { target: "textSpan" },
            assert: { textLength: { max: 20 } },
          },
          {
            id: "text-length-range",
            select: { target: "textSpan" },
            assert: { textLength: { min: 5, max: 20 } },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("parses v2 ids count bounds", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.min-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { prefix: "OBJ", minCount: 1 } },
        },
        {
          id: "ids.max-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { unique: true, maxCount: 3 } },
        },
        {
          id: "ids.count-range",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { unique: true, minCount: 1, maxCount: 3 } },
        },
      ],
    });

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "ids.min-count",
            select: { target: "tableCell", column: "ID" },
            assert: { ids: { prefix: "OBJ", minCount: 1 } },
          },
          {
            id: "ids.max-count",
            select: { target: "tableCell", column: "ID" },
            assert: { ids: { unique: true, maxCount: 3 } },
          },
          {
            id: "ids.count-range",
            select: { target: "tableCell", column: "ID" },
            assert: { ids: { unique: true, minCount: 1, maxCount: 3 } },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("parses v2 tableColumnCoverage assertions", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "traceability.coverage",
          select: { target: "document" },
          assert: {
            tableColumnCoverage: {
              source: {
                section: "5. Requirements",
                column: "ID",
                prefix: "REQ",
                caseSensitive: false,
              },
              target: {
                section: "11. Requirements-to-Behavior Traceability",
                tableHeader: ["Requirement", "Behavior"],
                column: "Requirement",
              },
              require: "everySourceId",
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.profile?.rules[0]?.assert).toEqual({
      tableColumnCoverage: {
        source: {
          section: "5. Requirements",
          column: "ID",
          prefix: "REQ",
          caseSensitive: false,
        },
        target: {
          section: "11. Requirements-to-Behavior Traceability",
          tableHeader: ["Requirement", "Behavior"],
          column: "Requirement",
        },
        require: "everySourceId",
      },
    });
  });

  it("parses v2 tableColumnsExact assertions from YAML and JSON-safe input", () => {
    const yaml = parseValidationProfile(`
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
    const json = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.columns",
          select: { target: "table" },
          assert: {
            tableColumnsExact: {
              columns: [
                "Contract state",
                "Execution route",
                "State rationale",
              ],
            },
          },
        },
      ],
    });

    for (const result of [yaml, json]) {
      expect(result.diagnostics).toEqual([]);
      expect(result.profile?.rules[0]?.assert).toEqual({
        tableColumnsExact: {
          columns: [
            "Contract state",
            "Execution route",
            "State rationale",
          ],
        },
      });
    }
  });

  it.each([
    [null, "tableColumnsExact must be an object."],
    [{}, "tableColumnsExact.columns must be an array of non-empty strings."],
    [
      { columns: [] },
      "tableColumnsExact.columns must be an array of non-empty strings.",
    ],
    [
      { columns: ["Contract state", ""] },
      "tableColumnsExact.columns must be an array of non-empty strings.",
    ],
  ])(
    "rejects invalid v2 tableColumnsExact payloads: %j",
    (tableColumnsExact, message) => {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "task-control.invalid-columns",
            select: { target: "table" },
            assert: { tableColumnsExact },
          },
        ],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          message,
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ]);
    },
  );

  it("rejects unsupported nested v2 tableColumnsExact keys", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "task-control.unsupported-columns-key",
          select: { target: "table" },
          assert: {
            tableColumnsExact: {
              columns: ["Contract state"],
              order: "strict",
            },
          },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "order".',
        severity: "error",
      },
    ]);
  });

  it("keeps tableColumnsExact invalid for v1 profiles", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "v1.table-columns-exact",
          select: { target: "table" },
          assert: { tableColumnsExact: { columns: ["Contract state"] } },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "tableColumnsExact".',
        severity: "error",
      },
    ]);
  });

  it("parses v2 frontmatterShape assertions", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
documentVersion: 1.0.0
rules:
  - id: frontmatter.required
    select:
      target: document
    assert:
      frontmatterShape:
        presence: required
  - id: frontmatter.forbidden
    select:
      target: document
    assert:
      frontmatterShape:
        presence: forbidden
  - id: frontmatter.fields
    select:
      target: document
    assert:
      frontmatterShape:
        fields:
          - field: type
            required: true
            valueType: string
            nonEmpty: true
          - field: tags
            valueType: array
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "frontmatter.required",
            select: { target: "document" },
            assert: { frontmatterShape: { presence: "required" } },
          },
          {
            id: "frontmatter.forbidden",
            select: { target: "document" },
            assert: { frontmatterShape: { presence: "forbidden" } },
          },
          {
            id: "frontmatter.fields",
            select: { target: "document" },
            assert: {
              frontmatterShape: {
                fields: [
                  {
                    field: "type",
                    required: true,
                    valueType: "string",
                    nonEmpty: true,
                  },
                  { field: "tags", valueType: "array" },
                ],
              },
            },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("parses v2 textFormat assertions", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
documentVersion: 1.0.0
rules:
  - id: log.date-heading
    select:
      target: heading
      depth: 2
    assert:
      textFormat:
        format: isoDate
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "log.date-heading",
            select: { target: "heading", depth: 2 },
            assert: { textFormat: { format: "isoDate" } },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("rejects invalid parsed YAML textLength assertions", () => {
    const invalidTextLengthProfiles = [
      {
        name: "missing bounds",
        textLength: "{}",
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength must include min, max, or both.",
          },
        ],
      },
      {
        name: "negative min",
        textLength: "min: -1",
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.min must be a non-negative integer when provided.",
          },
        ],
      },
      {
        name: "fractional max",
        textLength: "max: 2.5",
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.max must be a non-negative integer when provided.",
          },
        ],
      },
      {
        name: "reversed range",
        textLength: "min: 10\n        max: 3",
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.min must be less than or equal to textLength.max.",
          },
        ],
      },
      {
        name: "unsupported nested key",
        textLength: "min: 1\n        unit: words",
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "unit".',
          },
        ],
      },
    ];

    for (const { diagnostics, name, textLength } of invalidTextLengthProfiles) {
      const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: text-length-${name.replaceAll(" ", "-")}
    select:
      target: textSpan
    assert:
      textLength:
        ${textLength}
`);

      expect(result.profile).toBeUndefined();
      for (const diagnostic of diagnostics) {
        expect(result.diagnostics).toContainEqual(
          expect.objectContaining({
            ...diagnostic,
            severity: "error",
          }),
        );
      }
    }
  });

  it("rejects invalid v2 ids count bounds with deterministic diagnostics", () => {
    const invalidIdCountAssertions = [
      {
        ids: { unique: true, minCount: -1 },
        message: "ids.minCount must be a non-negative integer when provided.",
      },
      {
        ids: { unique: true, maxCount: 2.5 },
        message: "ids.maxCount must be a non-negative integer when provided.",
      },
      {
        ids: { unique: true, minCount: 4, maxCount: 2 },
        message: "ids.minCount must be less than or equal to ids.maxCount.",
      },
    ];

    for (const { ids, message } of invalidIdCountAssertions) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "ids.invalid-count",
            select: { target: "tableCell", column: "ID" },
            assert: { ids },
          },
        ],
      });

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          message,
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ]);
    }
  });

  it("rejects invalid v2 tableColumnCoverage shapes with deterministic diagnostics", () => {
    const source = { section: "5. Requirements", column: "ID", prefix: "REQ" };
    const target = {
      section: "11. Requirements-to-Behavior Traceability",
      column: "Requirement",
    };
    const validCoverage = { source, target, require: "everySourceId" };
    const invalidCoverageAssertions = [
      [
        { ...validCoverage, source: null },
        "tableColumnCoverage.source must be an object.",
      ],
      [
        { ...validCoverage, target: null },
        "tableColumnCoverage.target must be an object.",
      ],
      [
        { ...validCoverage, source: { ...source, column: "" } },
        "tableColumnCoverage.source.column must be a non-empty string.",
      ],
      [
        { ...validCoverage, source: { ...source, prefix: "" } },
        "tableColumnCoverage.source.prefix must be a non-empty string when provided.",
      ],
      [
        { ...validCoverage, target: { ...target, column: "" } },
        "tableColumnCoverage.target.column must be a non-empty string.",
      ],
      [
        { ...validCoverage, require: "anySourceId" },
        'tableColumnCoverage.require must be "everySourceId".',
      ],
    ];

    for (const [tableColumnCoverage, message] of invalidCoverageAssertions) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "traceability.invalid-coverage",
            select: { target: "document" },
            assert: { tableColumnCoverage },
          },
        ],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          message,
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ]);
    }
  });

  it("rejects invalid v2 frontmatterShape payloads with deterministic diagnostics", () => {
    const invalidFrontmatterShapeAssertions = [
      [
        { presence: "optional" },
        'frontmatterShape.presence must be "required" or "forbidden" when provided.',
      ],
      [
        { fields: [] },
        "frontmatterShape.fields must be a non-empty array when provided.",
      ],
      [
        { fields: [{ field: "type" }] },
        "frontmatterShape.fields[0] must include required, valueType, or nonEmpty.",
      ],
      [
        { fields: [{ field: "", required: true }] },
        "frontmatterShape.fields[0].field must be a non-empty string.",
      ],
      [
        { fields: [{ field: "type", required: false }] },
        "frontmatterShape.fields[0].required must be true when provided.",
      ],
      [
        { fields: [{ field: "type", valueType: "date" }] },
        'frontmatterShape.fields[0].valueType must be "string", "number", "boolean", "array", "object", or "null" when provided.',
      ],
      [
        { fields: [{ field: "type", nonEmpty: false }] },
        "frontmatterShape.fields[0].nonEmpty must be true when provided.",
      ],
      [
        { fields: [{ field: "tags", valueType: "array", nonEmpty: true }] },
        'frontmatterShape.fields[0].nonEmpty can be combined only with valueType "string".',
      ],
      [
        {
          presence: "forbidden",
          fields: [{ field: "type", required: true }],
        },
        "frontmatterShape.fields cannot be provided when presence is forbidden.",
      ],
      [
        {
          fields: [
            { field: "type", required: true },
            { field: "type", valueType: "string" },
          ],
        },
        'frontmatterShape.fields[1].field duplicates field "type".',
      ],
    ] as const;

    for (const [
      frontmatterShape,
      message,
    ] of invalidFrontmatterShapeAssertions) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "frontmatter.invalid-shape",
            select: { target: "document" },
            assert: { frontmatterShape },
          },
        ],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          message,
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ]);
    }
  });

  it("rejects invalid v2 textFormat payloads with deterministic diagnostics", () => {
    const invalidTextFormatAssertions = [
      {
        textFormat: null,
        diagnostic: {
          code: "profile.config.invalidShape",
          message: "textFormat must be an object.",
        },
      },
      {
        textFormat: {},
        diagnostic: {
          code: "profile.config.invalidShape",
          message: 'textFormat.format must be "isoDate".',
        },
      },
      {
        textFormat: { format: "rfc3339" },
        diagnostic: {
          code: "profile.config.invalidShape",
          message: 'textFormat.format must be "isoDate".',
        },
      },
      {
        textFormat: { format: "isoDate", locale: "en-US" },
        diagnostic: {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "locale".',
        },
      },
    ] as const;

    for (const { textFormat, diagnostic } of invalidTextFormatAssertions) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [
          {
            id: "log.invalid-date-heading",
            select: { target: "heading", depth: 2 },
            assert: { textFormat },
          },
        ],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: diagnostic.code,
          message: diagnostic.message,
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ]);
    }
  });

  it("keeps ids count bounds invalid for v1 profiles", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "v1.ids-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { unique: true, minCount: 1 } },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "minCount".',
        severity: "error",
      },
    ]);
  });

  it("keeps tableColumnCoverage invalid for v1 profiles", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "v1.table-column-coverage",
          select: { target: "document" },
          assert: {
            tableColumnCoverage: {
              source: { section: "Requirements", column: "ID" },
              target: { section: "Traceability", column: "Requirement" },
              require: "everySourceId",
            },
          },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "tableColumnCoverage".',
        severity: "error",
      },
    ]);
  });

  it("keeps frontmatterShape invalid for v1 profiles", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "v1.frontmatter-shape",
          select: { target: "document" },
          assert: {
            frontmatterShape: {
              presence: "required",
              fields: [{ field: "type", required: true }],
            },
          },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "frontmatterShape".',
        severity: "error",
      },
    ]);
  });

  it("keeps textFormat invalid for v1 profiles", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "v1.text-format",
          select: { target: "heading", depth: 2 },
          assert: {
            textFormat: {
              format: "isoDate",
            },
          },
        },
      ],
    } as ProfileInput);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "textFormat".',
        severity: "error",
      },
    ]);
  });

  it("rejects non-finite parsed YAML textLength bounds before schema traversal", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: text-length-non-finite
    select:
      target: textSpan
    assert:
      textLength:
        min: .nan
`);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        message:
          "Validation profile YAML contains non-finite numbers, which are not JSON-safe.",
        severity: "error",
      }),
    ]);
  });

  it("rejects invalid direct profile textLength assertions", () => {
    const invalidTextLengthProfiles = [
      {
        name: "negative-min",
        textLength: { min: -1 },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.min must be a non-negative integer when provided.",
          },
        ],
      },
      {
        name: "fractional-max",
        textLength: { max: 2.5 },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.max must be a non-negative integer when provided.",
          },
        ],
      },
      {
        name: "reversed-range",
        textLength: { min: 10, max: 3 },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "textLength.min must be less than or equal to textLength.max.",
          },
        ],
      },
      {
        name: "unsupported-nested-key",
        textLength: { min: 1, unit: "words" },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "unit".',
          },
        ],
      },
      {
        name: "non-finite-min",
        textLength: { min: Number.POSITIVE_INFINITY },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].assert.textLength.min must contain only JSON-safe data properties.",
          },
        ],
      },
    ];

    for (const { diagnostics, name, textLength } of invalidTextLengthProfiles) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: `text-length-${name}`,
            select: { target: "textSpan" },
            assert: {
              textLength,
            },
          },
        ],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      for (const diagnostic of diagnostics) {
        expect(result.diagnostics).toContainEqual(
          expect.objectContaining({
            ...diagnostic,
            severity: "error",
          }),
        );
      }
    }
  });

  it("parses exists assertions", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: rollback-link.exists
    select:
      target: link
      section: Escalation
      text: rollback guide
      url: ./rollback-guide.md
    assert:
      exists: true
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "rollback-link.exists",
            select: {
              target: "link",
              section: "Escalation",
              text: "rollback guide",
              url: "./rollback-guide.md",
            },
            assert: { exists: true },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("accepts v2 flat-rule YAML profiles through the admission path", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
documentVersion: 1.0.0
rules:
  - id: v2-flat-rule
    severity: info
    select:
      target: document
    assert:
      text:
        contains: Mission
`);

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "v2-flat-rule",
            severity: "info",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("accepts v2 flat-rule direct profile objects through the admission path", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "v2-direct-flat-rule",
          select: { target: "document" },
          assert: { exists: true },
        },
      ],
    });

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "v2-direct-flat-rule",
            select: { target: "document" },
            assert: { exists: true },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("accepts v2 non-recursive anyOf and allOf groups through the admission path", () => {
    const branch = {
      label: "mission-text",
      select: { target: "document" },
      assert: { text: { contains: "Mission" } },
    } as const;
    const rules = [
      { id: "v2-anyof-rule", anyOf: [branch] },
      { id: "v2-allof-rule", severity: "warning", allOf: [branch] },
    ] as const;

    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules,
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.profile?.rules).toEqual(rules);
  });

  it("accepts v2 rule-level when on flat and grouped rules", () => {
    const when = {
      select: { target: "document" },
      assert: { text: { contains: "Mission" } },
    } as const;
    const branch = {
      label: "mission-text",
      select: { target: "document" },
      assert: { exists: true },
    } as const;
    const rules = [
      {
        id: "v2-flat-with-when",
        when,
        select: { target: "document" },
        assert: { exists: true },
      },
      { id: "v2-anyof-with-when", when, anyOf: [branch] },
      { id: "v2-allof-with-when", when, allOf: [branch] },
    ] as const;

    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules,
    });

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        rules,
      },
      diagnostics: [],
    });
  });

  it("rejects invalid v2 group shapes with deterministic diagnostics", () => {
    const branch = {
      select: { target: "document" },
      assert: { text: { contains: "Mission" } },
    };
    const invalidGroupProfiles = [
      [
        { id: "v2-empty-anyof", anyOf: [] },
        "profile.config.invalidShape",
        "V2 rule at index 0 anyOf must be a non-empty array.",
      ],
      [
        {
          id: "v2-ambiguous-anyof",
          select: branch.select,
          assert: branch.assert,
          anyOf: [branch],
        },
        "profile.config.invalidShape",
        "V2 rule at index 0 must declare exactly one of select/assert, anyOf, or allOf.",
      ],
      [
        { id: "v2-recursive-group", anyOf: [{ ...branch, allOf: [branch] }] },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "allOf".',
      ],
      [
        {
          id: "v2-duplicate-labels",
          anyOf: [
            { ...branch, label: "primary" },
            { ...branch, label: "primary" },
          ],
        },
        "profile.config.invalidShape",
        'V2 rule at index 0 anyOf branch label "primary" must be unique.',
      ],
      [
        { id: "v2-branch-callback", anyOf: [{ ...branch, callback: "isReady" }] },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "callback".',
      ],
      [
        {
          id: "v2-branch-nested-when",
          anyOf: [
            {
              ...branch,
              when: {
                select: { target: "document" },
                assert: { exists: true },
              },
            },
          ],
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "when".',
      ],
    ] as const;

    for (const [rule, code, message] of invalidGroupProfiles) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [rule],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code, message, severity: "error" }),
      );
    }
  });

  it("returns invalidYaml diagnostics for invalid YAML strings", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: invalid-yaml
    select: [
`);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        severity: "error",
      }),
    );
  });

  it("uses profile-specific YAML materialization diagnostics", () => {
    const result = parseValidationProfile(`
? [not, a, string, key]
: value
`);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        message: "Validation profile YAML mapping keys must be strings.",
      }),
    );
    expect(result.diagnostics.map((diagnostic) => diagnostic.message).join("\n")).not.toContain(
      "frontmatter",
    );
  });

  it("rejects unsafe direct profile objects before schema traversal", () => {
    let accessorRead = false;
    const accessorProfile = {
      syntaxVersion: "markdown-engine.validation@v1",
    };
    Object.defineProperty(accessorProfile, "rules", {
      enumerable: true,
      get() {
        accessorRead = true;
        throw new Error("profile accessor must not execute");
      },
    });

    let proxyTrapExecuted = false;
    const proxyProfile = new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          proxyTrapExecuted = true;
          throw new Error("profile proxy trap must not execute");
        },
        ownKeys() {
          proxyTrapExecuted = true;
          throw new Error("profile proxy trap must not execute");
        },
      },
    );

    const sparseRules = [];
    sparseRules.length = 1;

    const cyclicProfile: Record<string, unknown> = {
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [],
    };
    cyclicProfile.self = cyclicProfile;

    const protoPayload = {
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [],
    };
    Object.defineProperty(protoPayload, "__proto__", {
      enumerable: true,
      value: {},
    });

    const cases: readonly {
      input: unknown;
      message: string;
    }[] = [
      {
        input: accessorProfile,
        message: "Profile.rules must contain only JSON-safe data properties.",
      },
      {
        input: proxyProfile,
        message: "Profile must contain only JSON-safe data properties.",
      },
      {
        input: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: undefined,
          rules: [],
        },
        message:
          "Profile.documentVersion must contain only JSON-safe data properties.",
      },
      {
        input: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: sparseRules,
        },
        message: "Profile.rules[0] must contain only JSON-safe data properties.",
      },
      {
        input: cyclicProfile,
        message: "Profile.self must contain only JSON-safe data properties.",
      },
      {
        input: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "function-payload",
              select: { target: "document" },
              assert: { text: { contains: () => "Mission" } },
            },
          ],
        },
        message:
          "Profile.rules[0].assert.text.contains must contain only JSON-safe data properties.",
      },
      {
        input: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "nan-payload",
              select: { target: "section", depth: Number.NaN },
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
        message:
          "Profile.rules[0].select.depth must contain only JSON-safe data properties.",
      },
      {
        input: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "infinite-payload",
              select: { target: "section", depth: Number.POSITIVE_INFINITY },
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
        message:
          "Profile.rules[0].select.depth must contain only JSON-safe data properties.",
      },
      {
        input: protoPayload,
        message: "Profile.__proto__ must contain only JSON-safe data properties.",
      },
    ];

    for (const { input, message } of cases) {
      const result = parseValidationProfile(input as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message,
          severity: "error",
        }),
      );
    }

    expect(accessorRead).toBe(false);
    expect(proxyTrapExecuted).toBe(false);
  });

  it("does not use caller-owned array iteration for direct profile inputs", () => {
    let iteratorRead = false;
    const rules = [
      {
        id: "safe-rule",
        select: { target: "document" },
        assert: { text: { contains: "Mission" } },
      },
    ];
    Object.defineProperty(rules, Symbol.iterator, {
      get() {
        iteratorRead = true;
        throw new Error("profile array iterator must not execute");
      },
    });

    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules,
    } as ProfileInput);

    expect(result.diagnostics).toEqual([]);
    expect(result.profile?.rules).toHaveLength(1);
    expect(iteratorRead).toBe(false);
  });

  it("accepts every public selector target", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "select-document",
          select: { target: "document" },
          assert: { text: { contains: "Mission" } },
        },
        {
          id: "select-section",
          select: { target: "section", title: "Requirements", depth: 2 },
          assert: { text: { contains: "shall" } },
        },
        {
          id: "select-heading",
          select: { target: "heading", text: "Scope", depth: 1 },
          assert: { text: { contains: "Scope" } },
        },
        {
          id: "select-table",
          select: {
            target: "table",
            section: "Requirements",
            header: ["ID", "Statement"],
          },
          assert: { tableColumnsRequired: { columns: ["ID", "Statement"] } },
        },
        {
          id: "select-table-row",
          select: {
            target: "tableRow",
            section: "Requirements",
            tableHeader: ["ID", "Statement"],
            where: { column: "Type", equals: "Functional" },
          },
          assert: { text: { contains: "shall" } },
        },
        {
          id: "select-table-cell",
          select: {
            target: "tableCell",
            section: "Requirements",
            tableHeader: ["ID", "Statement"],
            column: "Statement",
            rowWhere: { column: "ID", includes: "REQ" },
          },
          assert: { text: { contains: "shall" } },
        },
        {
          id: "select-text-span",
          select: {
            target: "textSpan",
            section: "Requirements",
            nodeType: "paragraph",
            textIncludes: "shall",
          },
          assert: { text: { contains: "shall" } },
        },
        {
          id: "select-link",
          select: {
            target: "link",
            section: "References",
            text: "Design spec",
            url: "https://example.com/spec",
          },
          assert: { text: { contains: "Design" } },
        },
        {
          id: "select-list",
          select: {
            target: "list",
            section: "Checklist",
            ordered: false,
            depth: 1,
          },
          assert: { text: { contains: "Done" } },
        },
      ],
    });

    expect(result.profile?.rules.map((rule) => rule.select.target)).toEqual([
      "document",
      "section",
      "heading",
      "table",
      "tableRow",
      "tableCell",
      "textSpan",
      "link",
      "list",
    ]);
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects deferred frontmatter selectors", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "select-frontmatter",
          select: { target: "frontmatter", field: "title" },
          assert: { frontmatterRequired: { fields: ["title"] } },
        },
      ],
    });

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "field".',
        severity: "error",
      },
      {
        code: "profile.compile.unsupportedSelector",
        message: 'Unsupported selector target "frontmatter".',
        severity: "error",
      },
    ]);
  });

  it("rejects table selector predicates without a comparison", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "missing-row-predicate-comparison",
          select: {
            target: "tableRow",
            where: { column: "Status" },
          },
          assert: { text: { contains: "Open" } },
        },
        {
          id: "missing-cell-predicate-comparison",
          select: {
            target: "tableCell",
            column: "Summary",
            rowWhere: { column: "Status" },
          },
          assert: { text: { contains: "Open" } },
        },
      ],
    });

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message:
            "Selector where must include at least one of equals or includes.",
        }),
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message:
            "Selector rowWhere must include at least one of equals or includes.",
        }),
      ]),
    );
  });

  it("accepts every public assertion member", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "public-assertions",
          select: { target: "document" },
          assert: {
            exists: true,
            sectionsRequired: {
              headings: ["Objective", "Evidence"],
              order: "strict",
            },
            tableColumnsRequired: {
              columns: ["ID", "Requirement statement"],
            },
            ids: {
              prefix: "REQ",
              unique: true,
              caseSensitive: false,
            },
            references: {
              idsFrom: {
                section: "Requirements",
                column: "ID",
                prefix: "REQ",
              },
              mustAppearIn: ["Traceability", "Verification"],
            },
            text: {
              excludes: ["and/or"],
            },
            textOccurrenceCount: {
              text: "shall",
              count: 1,
            },
            frontmatterRequired: {
              fields: ["title", "owner"],
            },
          },
        },
      ],
    });

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "public-assertions",
            select: { target: "document" },
            assert: {
              exists: true,
              sectionsRequired: {
                headings: ["Objective", "Evidence"],
                order: "strict",
              },
              tableColumnsRequired: {
                columns: ["ID", "Requirement statement"],
              },
              ids: {
                prefix: "REQ",
                unique: true,
                caseSensitive: false,
              },
              references: {
                idsFrom: {
                  section: "Requirements",
                  column: "ID",
                  prefix: "REQ",
                },
                mustAppearIn: ["Traceability", "Verification"],
              },
              text: {
                excludes: ["and/or"],
              },
              textOccurrenceCount: {
                text: "shall",
                count: 1,
              },
              frontmatterRequired: {
                fields: ["title", "owner"],
              },
            },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("rejects exists assertions with values other than true", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "exists.false",
          select: { target: "document" },
          assert: { exists: false },
        },
      ],
    });

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.config.invalidShape",
        message: "exists must be true.",
      }),
    );
  });

  it("rejects ineffective id assertion payloads", () => {
    const ineffectiveIdsAssertions = [
      {},
      { prefix: "REQ" },
      { unique: false },
    ];

    for (const [index, ids] of ineffectiveIdsAssertions.entries()) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: `ineffective-ids-${index}`,
            select: { target: "document" },
            assert: { ids },
          },
        ],
      });

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message: "ids.unique must be true.",
        }),
      );
    }
  });

  it("classifies unsupported-only assertion vocabulary without missing-assertion noise", () => {
    expect(
      parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "regex-like-assertion",
            select: { target: "document" },
            assert: { matches: "REQ" },
          },
        ],
      }),
    ).toEqual({
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "matches".',
          severity: "error",
        },
      ],
    });

    expect(
      parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "removed-assertion",
            select: { target: "document" },
            assert: { sectionOrder: { headings: ["Objective"] } },
          },
        ],
      }),
    ).toEqual({
      diagnostics: [
        {
          code: "profile.compile.unsupportedAssertion",
          message: 'Unsupported assertion "sectionOrder".',
          severity: "error",
        },
      ],
    });

    expect(
      parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unknown-assertion",
            select: { target: "document" },
            assert: { unknown: true },
          },
        ],
      }),
    ).toEqual({
      diagnostics: [
        {
          code: "profile.compile.unsupportedAssertion",
          message: 'Unsupported assertion "unknown".',
          severity: "error",
        },
      ],
    });
  });

  it("rejects unsupported profile and v1 nested rule keys", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      owner: "mission-control",
      rules: [
        {
          id: "unsupported-nested-key",
          anyOf: [],
          select: { target: "document" },
          assert: { sectionsRequired: { headings: ["Objective"] } },
        },
      ],
    });

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "owner".',
        }),
        expect.objectContaining({
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "anyOf".',
        }),
      ]),
    );
  });

  it("rejects malformed profile and nested rule shapes", () => {
    expect(parseValidationProfile("not-an-object")).toEqual({
      diagnostics: [
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message: "Profile must be an object.",
        }),
      ],
    });

    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "",
          select: "document",
          assert: { tableColumnsRequired: { columns: [] } },
        },
      ],
    });

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message: "Profile rule at index 0 must have a non-empty id.",
        }),
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message: "Rule select must be an object.",
        }),
        expect.objectContaining({
          code: "profile.config.invalidShape",
          message:
            "tableColumnsRequired.columns must be an array of non-empty strings.",
        }),
      ]),
    );
  });

  it.each<InvalidProfileCase>([
    {
      name: "missing syntaxVersion",
      input: {
        rules: [
          {
            id: "missing-syntax-version",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedSyntaxVersion",
          message:
            'Profile syntaxVersion must be "markdown-engine.validation@v1" or "markdown-engine.validation@v2".',
        },
      ],
    },
    {
      name: "unsupported syntaxVersion",
      input: {
        syntaxVersion: "markdown-engine.validation@v3",
        rules: [
          {
            id: "unsupported-syntax-version",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedSyntaxVersion",
          message:
            'Profile syntaxVersion must be "markdown-engine.validation@v1" or "markdown-engine.validation@v2".',
        },
      ],
    },
    {
      name: "invalid documentVersion",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0-draft",
        rules: [
          {
            id: "invalid-document-version",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message:
            'Profile documentVersion must be "0.0.0" or "1.0.0" when provided.',
        },
      ],
    },
    {
      name: "invalid severity",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "invalid-severity",
            severity: "critical",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message:
            'Rule severity must be "error", "warning", or "info" when provided.',
        },
      ],
    },
    {
      name: "duplicate rule IDs",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "duplicate-rule",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
          {
            id: "duplicate-rule",
            select: { target: "document" },
            assert: { text: { contains: "Control" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message: 'Profile rule at index 1 duplicates rule id "duplicate-rule".',
        },
      ],
    },
    {
      name: "unsupported selector target",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsupported-selector",
            select: { target: "blockQuote" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.compile.unsupportedSelector",
          message: 'Unsupported selector target "blockQuote".',
        },
      ],
    },
    {
      name: "unsupported selector key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsupported-selector-key",
            select: { target: "document", owner: "mission-control" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "owner".',
        },
      ],
    },
    {
      name: "unsupported first-level assertion member",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsupported-assertion",
            select: { target: "document" },
            assert: { semanticQuality: "approved" },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.compile.unsupportedAssertion",
          message: 'Unsupported assertion "semanticQuality".',
        },
      ],
    },
    {
      name: "unsafe selector key without target",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsafe-selector-key-without-target",
            select: { script: "return true" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "script".',
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule select.target must be provided.",
        },
      ],
    },
    {
      name: "unsupported nested assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsupported-nested-assertion-key",
            select: { target: "document" },
            assert: {
              sectionsRequired: {
                headings: ["Objective"],
                owner: "mission-control",
              },
            },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "owner".',
        },
      ],
    },
    {
      name: "regex-like top-level key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        pattern: "^(a+)+$",
        rules: [
          {
            id: "regex-top-level",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "pattern".',
        },
      ],
    },
    {
      name: "regex-like selector predicate key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "regex-predicate",
            select: {
              target: "tableRow",
              where: {
                column: "Status",
                equals: "Open",
                regex: "^(a+)+$",
              },
            },
            assert: { text: { contains: "Open" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "regex".',
        },
      ],
    },
    {
      name: "unsafe tableCell rowWhere key with missing selector column",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsafe-table-cell-row-where",
            select: {
              target: "tableCell",
              rowWhere: {
                script: "return true",
              },
            },
            assert: { text: { contains: "Open" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "script".',
        },
        {
          code: "profile.config.invalidShape",
          message: "Selector column must be a non-empty string.",
        },
      ],
    },
    {
      name: "regex-like tableCell rowWhere key with missing selector column",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "regex-table-cell-row-where",
            select: {
              target: "tableCell",
              rowWhere: {
                column: "Status",
                regex: ".*",
              },
            },
            assert: { text: { contains: "Open" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "regex".',
        },
        {
          code: "profile.config.invalidShape",
          message: "Selector column must be a non-empty string.",
        },
      ],
    },
    {
      name: "regex-like first-level assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "regex-assertion",
            select: { target: "document" },
            assert: { matches: "^(a+)+$" },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "matches".',
        },
      ],
    },
    {
      name: "regex-like nested assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "regex-nested-assertion",
            select: { target: "document" },
            assert: {
              text: {
                contains: "Mission",
                regexp: "^(a+)+$",
              },
            },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "regexp".',
        },
      ],
    },
    {
      name: "unsafe executable-like assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsafe-assertion",
            select: { target: "document" },
            assert: { script: "return true" },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "script".',
        },
      ],
    },
    {
      name: "unsafe nested assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "unsafe-nested-assertion",
            select: { target: "document" },
            assert: {
              text: {
                contains: "Mission",
                callback: "isMissionReady",
              },
            },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "callback".',
        },
      ],
    },
    {
      name: "removed containsExactlyOne text assertion key",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "removed-text-assertion",
            select: { target: "document" },
            assert: {
              text: {
                containsExactlyOne: "Mission",
              },
            },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "containsExactlyOne".',
        },
        {
          code: "profile.config.invalidShape",
          message: "text must include contains or a non-empty excludes array.",
        },
      ],
    },
    {
      name: "removed text assertion column modifier",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "ineffective-text",
            select: { target: "document" },
            assert: { text: { column: "Summary" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "column".',
        },
        {
          code: "profile.config.invalidShape",
          message: "text must include contains or a non-empty excludes array.",
        },
      ],
    },
    {
      name: "removed ids assertion column modifier",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "removed-ids-column",
            select: { target: "tableCell", column: "ID" },
            assert: { ids: { unique: true, column: "ID" } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "column".',
        },
      ],
    },
    {
      name: "removed occurrence assertion column modifier",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "removed-occurrence-column",
            select: { target: "tableCell", column: "Statement" },
            assert: {
              textOccurrenceCount: {
                text: "shall",
                count: 1,
                column: "Statement",
              },
            },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "column".',
        },
      ],
    },
    {
      name: "empty required array",
      input: {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "empty-required-array",
            select: { target: "document" },
            assert: { sectionsRequired: { headings: [] } },
          },
        ],
      },
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message:
            "sectionsRequired.headings must be an array of non-empty strings.",
        },
      ],
    },
  ])("rejects invalid declaration: $name", ({ input, diagnostics }) => {
    const result = parseValidationProfile(input);

    expect(result.profile).toBeUndefined();

    for (const diagnostic of diagnostics) {
      expect(result.diagnostics).toContainEqual(expect.objectContaining(diagnostic));
    }
  });

  it("keeps omitted documentVersion out of the parsed profile", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "document-version-defaults-at-validation",
          select: { target: "document" },
          assert: { text: { contains: "Mission" } },
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "document-version-defaults-at-validation",
          select: { target: "document" },
          assert: { text: { contains: "Mission" } },
        },
      ],
    });
  });

  it("rejects invalid v2 rule-level when shapes with deterministic diagnostics", () => {
    const invalidWhenProfiles = [
      [
        {
          id: "v2-when-not-object",
          when: "document",
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.invalidShape",
        "Rule when must be an object.",
      ],
      [
        {
          id: "v2-when-extra-key",
          when: {
            select: { target: "document" },
            assert: { exists: true },
            callback: "isApplicable",
          },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "callback".',
      ],
      [
        {
          id: "v2-when-missing-assert",
          when: { select: { target: "document" } },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.invalidShape",
        "Rule assert must be an object.",
      ],
      [
        {
          id: "v2-when-expression-predicate",
          when: {
            select: { target: "document" },
            assert: { expression: "document.title === 'Mission'" },
          },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "expression".',
      ],
    ] as const;

    for (const [rule, code, message] of invalidWhenProfiles) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [rule],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code, message, severity: "error" }),
      );
    }
  });

  it("rejects regex-like and executable-like keys at v2 nested boundaries", () => {
    const branch = {
      select: { target: "document" },
      assert: { exists: true },
    };
    const invalidNestedBoundaryProfiles = [
      [
        {
          id: "v2-when-regex-key",
          when: {
            select: { target: "document" },
            assert: { exists: true },
            regex: "^(a+)+$",
          },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "regex".',
      ],
      [
        {
          id: "v2-when-script-key",
          when: {
            select: { target: "document" },
            assert: { exists: true },
            script: "return true",
          },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "script".',
      ],
      [
        {
          id: "v2-when-assertion-regexp-key",
          when: {
            select: { target: "document" },
            assert: {
              text: {
                contains: "Mission",
                regexp: "^(a+)+$",
              },
            },
          },
          select: { target: "document" },
          assert: { exists: true },
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "regexp".',
      ],
      [
        { id: "v2-branch-regexp-key", anyOf: [{ ...branch, regexp: "^(a+)+$" }] },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "regexp".',
      ],
      [
        { id: "v2-branch-script-key", anyOf: [{ ...branch, script: "return true" }] },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "script".',
      ],
      [
        {
          id: "v2-branch-selector-pattern-key",
          anyOf: [
            {
              select: {
                target: "tableRow",
                where: {
                  column: "Status",
                  equals: "Ready",
                  pattern: "^(a+)+$",
                },
              },
              assert: { exists: true },
            },
          ],
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "pattern".',
      ],
      [
        {
          id: "v2-branch-selector-plugin-key",
          anyOf: [
            {
              select: {
                target: "tableRow",
                where: {
                  column: "Status",
                  equals: "Ready",
                  plugin: "mission-control",
                },
              },
              assert: { exists: true },
            },
          ],
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "plugin".',
      ],
      [
        {
          id: "v2-branch-assertion-matches-key",
          anyOf: [
            {
              select: { target: "document" },
              assert: {
                text: {
                  contains: "Mission",
                  matches: "^(a+)+$",
                },
              },
            },
          ],
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "matches".',
      ],
      [
        {
          id: "v2-branch-assertion-callback-key",
          anyOf: [
            {
              select: { target: "document" },
              assert: {
                text: {
                  contains: "Mission",
                  callback: "isMissionReady",
                },
              },
            },
          ],
        },
        "profile.config.unsupportedKey",
        'Unsupported validation profile key "callback".',
      ],
    ] as const;

    for (const [rule, code, message] of invalidNestedBoundaryProfiles) {
      const result = parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v2",
        rules: [rule],
      } as ProfileInput);

      expect(result.profile).toBeUndefined();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code, message, severity: "error" }),
      );
    }
  });

  it("rejects invalid typed validation profiles before compiler execution", () => {
    const document = normalize(parse("# Typed Profile\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const cases = [
      {
        profile: null,
        expected: {
          code: "profile.config.invalidShape",
          message: "Profile must be an object.",
        },
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@future",
          rules: [],
        },
        expected: {
          code: "profile.config.unsupportedSyntaxVersion",
          message:
            'Profile syntaxVersion must be "markdown-engine.validation@v1" or "markdown-engine.validation@v2".',
        },
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: "2.0.0",
          rules: [],
        },
        expected: {
          code: "profile.config.invalidShape",
          message:
            'Profile documentVersion must be "0.0.0" or "1.0.0" when provided.',
        },
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: {},
        },
        expected: {
          code: "profile.config.invalidShape",
          message: "Profile rules must be an array.",
        },
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [null],
        },
        expected: {
          code: "profile.config.invalidShape",
          message: "Profile rule at index 0 must be an object.",
        },
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            validExistsRule("duplicate.rule"),
            { ...validExistsRule("non-string-rule-id"), id: 42 },
            validExistsRule("duplicate.rule"),
          ],
        },
        expected: {
          code: "profile.config.invalidShape",
          message: 'Profile rule at index 2 duplicates rule id "duplicate.rule".',
        },
      },
    ];

    for (const { expected, profile } of cases) {
      const result = validateWithProfile(
        document,
        profile as unknown as ValidationProfile,
      );

      expect(result.valid).toBe(false);
      expect(result.ruleResults).toEqual([]);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ ...expected, severity: "error" }),
      );
    }
  });
});

function validExistsRule(id: string): ValidationProfile["rules"][number] {
  return {
    id,
    select: { target: "document" },
    assert: { exists: true },
  };
}
