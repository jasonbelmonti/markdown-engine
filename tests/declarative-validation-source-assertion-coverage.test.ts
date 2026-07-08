import { describe, expect, it } from "vitest";

import {
  validateWithProfile,
  type ValidationProfile,
} from "../src/api/declarative-validation.js";
import type { EngineDocument } from "../src/api/document.js";
import { normalize } from "../src/api/normalize.js";
import { parse } from "../src/api/parse.js";

describe("declarative validation source assertion coverage", () => {
  it("evaluates required references directly through source assertions", () => {
    const profile: ValidationProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.required",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    };

    expect(
      validateWithProfile(markdownDocument(requirementsWithReferences()), profile),
    ).toMatchObject({
        valid: true,
        diagnostics: [],
        ruleResults: [
          expect.objectContaining({
            ruleId: "references.required",
            passed: true,
            diagnostics: [],
          }),
        ],
      });

    expect(
      validateWithProfile(
        markdownDocument(
          requirementsWithReferences({
            verificationBody: "REQ-1 is covered by unit evidence.",
          }),
        ),
        profile,
      ).diagnostics,
    ).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.required",
        message: 'ID "REQ-2" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 6 }),
        }),
      }),
    ]);
  });

  it("evaluates table column coverage directly through source assertions", () => {
    const profile: ValidationProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "traceability.coverage",
          select: { target: "document" },
          assert: {
            tableColumnCoverage: {
              source: { section: "Requirements", column: "ID", prefix: "REQ" },
              target: { section: "Traceability", column: "Requirement" },
              require: "everySourceId",
            },
          },
        },
      ],
    };

    expect(
      validateWithProfile(markdownDocument(traceabilityTable()), profile),
    ).toMatchObject({
        valid: true,
        diagnostics: [],
      });

    expect(
      validateWithProfile(
        markdownDocument(
          traceabilityTable({ traceabilityRows: "| REQ-1 | Unit |" }),
        ),
        profile,
      ).diagnostics,
    ).toEqual([
      expect.objectContaining({
        code: "profile.validation.tableColumnCoverageIdMissing",
        ruleId: "traceability.coverage",
        message:
          'ID "REQ-2" must appear in target table column "Requirement" of section "Traceability".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 6 }),
        }),
      }),
    ]);

    expect(
      validateWithProfile(
        markdownDocument(
          traceabilityTable({
            traceabilityHeader: "| Evidence |",
            traceabilitySeparator: "| --- |",
            traceabilityRows: "| Unit |",
          }),
        ),
        profile,
      ).diagnostics,
    ).toEqual([
      expect.objectContaining({
        code: "profile.validation.tableColumnCoverageTargetColumnMissing",
        ruleId: "traceability.coverage",
        message:
          'ID "REQ-1" requires target table column "Requirement" in section "Traceability".',
      }),
      expect.objectContaining({
        code: "profile.validation.tableColumnCoverageTargetColumnMissing",
        ruleId: "traceability.coverage",
        message:
          'ID "REQ-2" requires target table column "Requirement" in section "Traceability".',
      }),
    ]);
  });

  it("evaluates frontmatter shape directly through source assertions", () => {
    const profile: ValidationProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "frontmatter.shape",
          select: { target: "document" },
          assert: {
            frontmatterShape: {
              presence: "required",
              fields: [
                { field: "title", required: true, valueType: "string", nonEmpty: true },
                { field: "reviewed", required: true, valueType: "boolean" },
                { field: "owners", valueType: "array" },
              ],
            },
          },
        },
      ],
    };

    expect(
      validateWithProfile(
        markdownDocument(
          [
            "---",
            "title: Coverage Packet",
            "reviewed: true",
            "owners:",
            "  - docs",
            "---",
            "# Body",
          ].join("\n"),
        ),
        profile,
      ),
    ).toMatchObject({
      valid: true,
      diagnostics: [],
    });

    expect(
      validateWithProfile(
        markdownDocument(
          [
            "---",
            'title: ""',
            'reviewed: "yes"',
            "---",
            "# Body",
          ].join("\n"),
        ),
        profile,
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.frontmatterFieldEmpty",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "title" must be a non-empty string.',
        severity: "error",
      },
      {
        code: "profile.validation.frontmatterFieldTypeMismatch",
        ruleId: "frontmatter.shape",
        message: 'Frontmatter field "reviewed" must be boolean.',
        severity: "error",
      },
    ]);
  });

  it("evaluates text format directly through source assertions", () => {
    const profile: ValidationProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "log.dates",
          select: { target: "heading" },
          assert: { textFormat: { format: "isoDate" } },
        },
      ],
    };
    const result = validateWithProfile(
      markdownDocument(
        [
          "# 2024-02-29",
          "",
          "Leap day is valid.",
          "",
          "# 2026-02-29",
          "",
          "Non-leap day is invalid.",
          "",
          "# 2026-06-14T00:00:00Z",
          "",
          "Timestamps are invalid.",
        ].join("\n"),
      ),
      profile,
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        ruleId: "log.dates",
        message:
          "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        ruleId: "log.dates",
        message:
          "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 9 }),
        }),
      }),
    ]);
  });
});

function markdownDocument(markdown: string): EngineDocument {
  return normalize(parse(markdown).parsed, { documentVersion: "1.0.0" }).document;
}

function requirementsWithReferences(
  options: { verificationBody?: string } = {},
): string {
  return [
    "# Requirements",
    "",
    "| ID | Statement |",
    "| --- | --- |",
    "| REQ-1 | Build safely |",
    "| REQ-2 | Launch safely |",
    "",
    "# Verification",
    "",
    options.verificationBody ??
      "REQ-1 is covered by unit evidence. REQ-2 is covered by integration evidence.",
  ].join("\n");
}

function traceabilityTable(
  options: {
    traceabilityHeader?: string;
    traceabilitySeparator?: string;
    traceabilityRows?: string;
  } = {},
): string {
  return [
    "# Requirements",
    "",
    "| ID | Statement |",
    "| --- | --- |",
    "| REQ-1 | Build safely |",
    "| REQ-2 | Launch safely |",
    "",
    "# Traceability",
    "",
    options.traceabilityHeader ?? "| Requirement | Evidence |",
    options.traceabilitySeparator ?? "| --- | --- |",
    options.traceabilityRows ??
      ["| REQ-1 | Unit |", "| REQ-2 | Integration |"].join("\n"),
  ].join("\n");
}
