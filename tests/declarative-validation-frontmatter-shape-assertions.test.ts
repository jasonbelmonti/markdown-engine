import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  validateWithProfile,
  type DeclarativeFrontmatterShape,
  type ValidationProfile,
} from "../src/index.js";

function profileForFrontmatterShape(
  frontmatterShape: DeclarativeFrontmatterShape,
): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    documentVersion: "1.0.0",
    rules: [
      {
        id: "frontmatter.shape",
        select: { target: "document" },
        assert: { frontmatterShape },
      },
    ],
  };
}

describe("declarative validation frontmatterShape assertions", () => {
  it("evaluates required presence and typed fields", () => {
    const document = normalize(
      parse(
        [
          "---",
          "type: concept",
          "count: 2",
          "enabled: false",
          "tags:",
          "  - alpha",
          "metadata:",
          "  owner: docs",
          "empty: null",
          "---",
          "# Body",
        ].join("\n"),
      ).parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const result = validateWithProfile(
      document,
      profileForFrontmatterShape({
        presence: "required",
        fields: [
          {
            field: "type",
            required: true,
            valueType: "string",
            nonEmpty: true,
          },
          { field: "count", valueType: "number" },
          { field: "enabled", valueType: "boolean" },
          { field: "tags", valueType: "array" },
          { field: "metadata", valueType: "object" },
          { field: "empty", valueType: "null" },
        ],
      }),
    );

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "frontmatter.shape",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("reports presence failures", () => {
    const missingDocument = normalize(parse("# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const presentDocument = normalize(parse("---\n---\n# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(
        missingDocument,
        profileForFrontmatterShape({ presence: "required" }),
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.frontmatterMissing",
        ruleId: "frontmatter.shape",
        message: "Frontmatter is required.",
        severity: "error",
      },
    ]);
    expect(
      validateWithProfile(
        presentDocument,
        profileForFrontmatterShape({ presence: "forbidden" }),
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.frontmatterForbidden",
        ruleId: "frontmatter.shape",
        message: "Frontmatter is forbidden.",
        severity: "error",
      },
    ]);
  });

  it("reports missing, wrong-type, and empty string fields", () => {
    const document = normalize(
      parse(
        [
          "---",
          'type: ""',
          'count: "2"',
          "metadata:",
          "  - owner",
          "---",
          "# Body",
        ].join("\n"),
      ).parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const result = validateWithProfile(
      document,
      profileForFrontmatterShape({
        fields: [
          { field: "type", valueType: "string", nonEmpty: true },
          { field: "count", valueType: "number" },
          { field: "enabled", required: true },
          { field: "metadata", valueType: "object" },
        ],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.frontmatterFieldEmpty",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "type" must be a non-empty string.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldTypeMismatch",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "count" must be number.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldMissing",
        ruleId: "frontmatter.shape",
        message: 'Required frontmatter field "enabled" is missing.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldTypeMismatch",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "metadata" must be object.',
        severity: "error",
      },
    ]);
  });

  it("reports only required fields when frontmatter is not an object", () => {
    const document = normalize(parse("---\nfrontmatter\n---\n# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(
      document,
      profileForFrontmatterShape({
        fields: [
          { field: "title", required: true },
          { field: "owner", valueType: "string" },
        ],
      }),
    );

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.frontmatterFieldMissing",
        ruleId: "frontmatter.shape",
        message: 'Required frontmatter field "title" is missing.',
        severity: "error",
      },
    ]);
  });

  it("allows empty string fields unless nonEmpty is configured", () => {
    const document = normalize(parse('---\ntype: ""\n---\n# Body\n').parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(
        document,
        profileForFrontmatterShape({
          fields: [{ field: "type", valueType: "string" }],
        }),
      ).valid,
    ).toBe(true);
    expect(
      validateWithProfile(
        document,
        profileForFrontmatterShape({
          fields: [{ field: "type", nonEmpty: true }],
        }),
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.frontmatterFieldEmpty",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "type" must be a non-empty string.',
        severity: "error",
      },
    ]);
  });

  it("avoids duplicate empty diagnostics for non-string values", () => {
    const document = normalize(parse("---\ntype: 2\n---\n# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(
        document,
        profileForFrontmatterShape({
          fields: [{ field: "type", valueType: "string", nonEmpty: true }],
        }),
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.frontmatterFieldTypeMismatch",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "type" must be string.',
        severity: "error",
      },
    ]);
  });

  it("evaluates exact, non-blank, and forbidden fields without coercion", () => {
    const passingDocument = normalize(
      parse(
        [
          "---",
          "type: TaskDefinition",
          "title: Frontmatter predicate fixture",
          "id: TD-FRONTMATTER-PREDICATES",
          "producer_extension: enabled",
          "producer_metadata:",
          "  owner: flight",
          "producer_labels:",
          "  - validation",
          "---",
          "# Body",
        ].join("\n"),
      ).parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const profile = profileForFrontmatterShape({
      presence: "required",
      fields: [
        {
          field: "type",
          required: true,
          valueType: "string",
          equals: "TaskDefinition",
          nonBlank: true,
        },
        { field: "title", required: true, nonBlank: true },
        { field: "id", required: true, nonBlank: true },
        { field: "optional_exact", equals: "unused" },
        { field: "optional_non_blank", nonBlank: true },
        { field: "mode", forbidden: true },
      ],
    });

    expect(validateWithProfile(passingDocument, profile).valid).toBe(true);

    const failingDocument = normalize(
      parse(
        [
          "---",
          "type: taskdefinition",
          'title: "   "',
          "id: 7",
          "mode: AUTHOR",
          "producer_extension: enabled",
          "---",
          "# Body",
        ].join("\n"),
      ).parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const result = validateWithProfile(failingDocument, profile);

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.frontmatterFieldValueMismatch",
        ruleId: "frontmatter.shape",
        message:
          'Frontmatter field "type" must match its configured string value.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldBlank",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "title" must be a non-blank string.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldBlank",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "id" must be a non-blank string.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldForbidden",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "mode" is forbidden.',
        severity: "error",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("taskdefinition");
    expect(JSON.stringify(result)).not.toContain("AUTHOR");
  });

  it("suppresses equality and blank diagnostics after a string type mismatch", () => {
    const document = normalize(parse("---\ntype: 2\n---\n# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(
      document,
      profileForFrontmatterShape({
        fields: [
          {
            field: "type",
            valueType: "string",
            equals: "TaskDefinition",
            nonBlank: true,
          },
        ],
      }),
    );

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.frontmatterFieldTypeMismatch",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "type" must be string.',
        severity: "error",
      },
    ]);
  });

  it("does not coerce equality and treats any present forbidden field as invalid", () => {
    const document = normalize(
      parse("---\ntype: 7\nmode: null\n---\n# Body\n").parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const result = validateWithProfile(
      document,
      profileForFrontmatterShape({
        fields: [
          { field: "type", equals: "7" },
          { field: "optional_non_blank", nonBlank: true },
          { field: "mode", forbidden: true },
        ],
      }),
    );

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.frontmatterFieldValueMismatch",
        ruleId: "frontmatter.shape",
        message:
          'Frontmatter field "type" must match its configured string value.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldForbidden",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "mode" is forbidden.',
        severity: "error",
      },
    ]);
  });
});
