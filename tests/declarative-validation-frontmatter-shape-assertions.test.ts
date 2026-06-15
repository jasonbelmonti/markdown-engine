import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  validateWithProfile,
  type DeclarativeFrontmatterShape,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

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
});
