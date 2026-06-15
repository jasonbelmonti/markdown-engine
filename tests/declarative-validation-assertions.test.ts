import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type EngineDocument,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
import { classifyCompiledDeclarativeRuleApplicability } from "../src/declarative-validation/applicability/index.js";
import { resolveTableColumnIdTokens } from "../src/declarative-validation/assertions/id-targets.js";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

const fixturePath = "fixtures/declarative-validation/proving/representative.md";
const fixture = readFileSync(
  new URL("../fixtures/declarative-validation/proving/representative.md", import.meta.url),
  "utf8",
);

function withoutFirstDataCellSourceEvidence(document: EngineDocument): EngineDocument {
  const copy = structuredClone(document);
  const firstDataCell = copy.tables?.[0]?.cells.find((cell) => !cell.header);

  if (firstDataCell !== undefined) {
    delete firstDataCell.sourceRange;
  }

  return copy;
}

function withoutSourceEvidence(document: EngineDocument): EngineDocument {
  const copy = structuredClone(document);
  stripSourceEvidence(copy);
  return copy;
}

function stripSourceEvidence(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(stripSourceEvidence);
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  delete record.source;
  delete record.sourceRange;
  Object.values(record).forEach(stripSourceEvidence);
}

describe("declarative validation assertion proof", () => {
  it("evaluates tableColumnCoverage against configured target column IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Requirement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Traceability",
          "",
          "| Requirement | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Unit test |",
        ].join("\n"),
      ).parsed,
      { documentVersion: "1.0.0" },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "traceability.coverage",
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
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "traceability.coverage",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("evaluates the minimal text assertion path and emits source-targeted diagnostics", () => {
    const document = normalize(parse(fixture, { path: fixturePath }).parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, profile);

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "objective.contains",
        passed: true,
        diagnostics: [],
      },
      {
        ruleId: "verification.diagnostic",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.textMissing",
            ruleId: "verification.diagnostic",
            severity: "error",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 14, column: 1 }),
            }),
          }),
        ],
      },
    ]);
  });

  it("evaluates section text assertions against normalized markdown text", () => {
    const document = normalize(
      parse("# Objective\n\nProve the **architecture** viable.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "objective.contains",
          select: { target: "section", title: "Objective" },
          assert: { text: { contains: "architecture viable" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "objective.contains",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("emits empty-selection diagnostics without fabricated source ranges", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "missing-section.empty-selection",
          select: { target: "section", title: "Verification" },
          assert: { text: { contains: "complete" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: "missing-section.empty-selection",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "missing-section.empty-selection",
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("emits empty-selection diagnostics for table assertions with no table targets", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const rule = {
      id: "empty-selection.table-columns",
      severity: "warning",
      select: { target: "table" },
      assert: { tableColumnsRequired: { columns: ["Status"] } },
    } satisfies ValidationProfile["rules"][number];
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [rule],
    });

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: rule.id,
        message: "Rule selector did not match any document targets.",
        severity: "warning",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: rule.id,
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("evaluates exists assertions against selector resolution", () => {
    const document = normalize(
      parse("# Escalation\n\nSee the [rollback guide](./rollback-guide.md).\n")
        .parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
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
        {
          id: "missing-link.exists",
          select: {
            target: "link",
            section: "Escalation",
            text: "release notes",
            url: "./release-notes.md",
          },
          assert: { exists: true },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: "missing-link.exists",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "missing-link.exists",
        passed: false,
        diagnostics: result.diagnostics,
      },
      {
        ruleId: "rollback-link.exists",
        passed: true,
        diagnostics: [],
      },
    ]);
  });

  it("sorts rule results and diagnostics deterministically by rule id", () => {
    const document = normalize(
      parse("# Bravo\n\nReady.\n\n# Alpha\n\nReady.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "zeta.rule",
          select: { target: "section", title: "Bravo" },
          assert: { text: { contains: "complete" } },
        },
        {
          id: "alpha.rule",
          select: { target: "section", title: "Alpha" },
          assert: { text: { contains: "complete" } },
        },
      ],
    });

    expect(result.ruleResults.map((ruleResult) => ruleResult.ruleId)).toEqual([
      "alpha.rule",
      "zeta.rule",
    ]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual([
      "alpha.rule",
      "zeta.rule",
    ]);
  });

  it("sorts diagnostics within a rule by source evidence", () => {
    const document = normalize(
      parse("# Alpha\n\nReady.\n\n# Bravo\n\nReady.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "sections.text",
          select: { target: "section" },
          assert: { text: { contains: "complete" } },
        },
      ],
    });

    expect(
      result.diagnostics.map((diagnostic) => diagnostic.sourceRange?.start.line),
    ).toEqual([1, 5]);
  });

  it("preserves declared order for source-less assertion diagnostics", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "sections.required",
          select: { target: "document" },
          assert: {
            sectionsRequired: {
              headings: ["Zeta", "Alpha"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.sectionMissing",
        ruleId: "sections.required",
        message: 'Required section "Zeta" is missing.',
        severity: "error",
      },
      {
        code: "profile.validation.sectionMissing",
        ruleId: "sections.required",
        message: 'Required section "Alpha" is missing.',
        severity: "error",
      },
    ]);
  });

  it("evaluates text excludes predicates without silently passing violations", () => {
    const sectionDocument = normalize(
      parse("# Objective\n\nalpha beta beta forbidden\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;

    const result = validateWithProfile(sectionDocument, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "text.excludes",
          select: { target: "section", title: "Objective" },
          assert: { text: { excludes: ["forbidden", "missing"] } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.textExcluded",
        ruleId: "text.excludes",
        message: 'Selected section text must not contain "forbidden".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 1 }),
        }),
      }),
    ]);
  });

  it("validates exact non-overlapping text occurrence counts per selected target", () => {
    const document = normalize(
      parse("# Objective\n\nMUST ready. shall shall. aaaa\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "occurrence.exact-one",
          select: { target: "section", title: "Objective" },
          assert: { textOccurrenceCount: { text: "MUST", count: 1 } },
        },
        {
          id: "occurrence.non-overlapping",
          select: { target: "section", title: "Objective" },
          assert: { textOccurrenceCount: { text: "aa", count: 2 } },
        },
        {
          id: "occurrence.duplicate",
          select: { target: "section", title: "Objective" },
          assert: { textOccurrenceCount: { text: "shall", count: 1 } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "occurrence.duplicate",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "occurrence.duplicate",
            message:
              'Selected section text must contain "shall" exactly 1 time(s); found 2.',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 1 }),
            }),
          }),
        ],
      },
      {
        ruleId: "occurrence.exact-one",
        passed: true,
        diagnostics: [],
      },
      {
        ruleId: "occurrence.non-overlapping",
        passed: true,
        diagnostics: [],
      },
    ]);
    expect(result.diagnostics).toEqual(result.ruleResults[0]?.diagnostics);
  });

  it("validates text length bounds per selected target", () => {
    const document = normalize(
      parse("# Short\n\nbody\n\n# LongerText!\n\nbody\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "length.max.fail",
          select: { target: "heading", text: "LongerText!" },
          assert: { textLength: { max: 10 } },
        },
        {
          id: "length.max.pass",
          select: { target: "heading", text: "Short" },
          assert: { textLength: { max: 5 } },
        },
        {
          id: "length.min.fail",
          select: { target: "heading", text: "Short" },
          assert: { textLength: { min: 6 } },
        },
        {
          id: "length.min.pass",
          select: { target: "heading", text: "Short" },
          assert: { textLength: { min: 5 } },
        },
        {
          id: "length.range.fail",
          select: { target: "heading", text: "Short" },
          assert: { textLength: { min: 6, max: 10 } },
        },
        {
          id: "length.range.pass",
          select: { target: "heading", text: "Short" },
          assert: { textLength: { min: 2, max: 5 } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "length.max.fail",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "length.max.fail",
            message:
              "Selected heading text length must be at most 10; found 11.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 5 }),
            }),
          }),
        ],
      },
      {
        ruleId: "length.max.pass",
        passed: true,
        diagnostics: [],
      },
      {
        ruleId: "length.min.fail",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "length.min.fail",
            message:
              "Selected heading text length must be at least 6; found 5.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 1 }),
            }),
          }),
        ],
      },
      {
        ruleId: "length.min.pass",
        passed: true,
        diagnostics: [],
      },
      {
        ruleId: "length.range.fail",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "length.range.fail",
            message:
              "Selected heading text length must be between 6 and 10; found 5.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 1 }),
            }),
          }),
        ],
      },
      {
        ruleId: "length.range.pass",
        passed: true,
        diagnostics: [],
      },
    ]);
    expect(result.diagnostics).toEqual([
      ...(result.ruleResults[0]?.diagnostics ?? []),
      ...(result.ruleResults[2]?.diagnostics ?? []),
      ...(result.ruleResults[4]?.diagnostics ?? []),
    ]);
  });

  it("evaluates textFormat isoDate headings with exact calendar semantics", () => {
    const document = normalize(
      parse(
        [
          "# 2026-06-14",
          "",
          "body",
          "",
          "# 2024-02-29",
          "",
          "body",
          "",
          "# 2026-04-31",
          "",
          "body",
          "",
          "# 2023-02-29",
          "",
          "body",
          "",
          "# 2026-13-01",
          "",
          "body",
          "",
          "# not-a-date",
          "",
          "body",
          "",
          "# 2026-06-14T00:00:00Z",
          "",
          "body",
          "",
          "# 2026-06",
          "",
          "body",
          "",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "date.valid",
          select: { target: "heading", text: "2026-06-14" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.leap-valid",
          select: { target: "heading", text: "2024-02-29" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.day-invalid",
          select: { target: "heading", text: "2026-04-31" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.leap-invalid",
          select: { target: "heading", text: "2023-02-29" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.month-invalid",
          select: { target: "heading", text: "2026-13-01" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.non-date",
          select: { target: "heading", text: "not-a-date" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.timestamp",
          select: { target: "heading", text: "2026-06-14T00:00:00Z" },
          assert: { textFormat: { format: "isoDate" } },
        },
        {
          id: "date.partial",
          select: { target: "heading", text: "2026-06" },
          assert: { textFormat: { format: "isoDate" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([
      expect.objectContaining({
        ruleId: "date.day-invalid",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.day-invalid",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 9 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.leap-invalid",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.leap-invalid",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 13 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.leap-valid",
        passed: true,
        diagnostics: [],
      }),
      expect.objectContaining({
        ruleId: "date.month-invalid",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.month-invalid",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 17 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.non-date",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.non-date",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 21 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.partial",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.partial",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 29 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.timestamp",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.assertionFailed",
            ruleId: "date.timestamp",
            message:
              "Selected heading text must be an exact ISO date in YYYY-MM-DD form.",
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 25 }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        ruleId: "date.valid",
        passed: true,
        diagnostics: [],
      }),
    ]);
    expect(result.diagnostics).toEqual([
      ...(result.ruleResults[0]?.diagnostics ?? []),
      ...(result.ruleResults[1]?.diagnostics ?? []),
      ...(result.ruleResults[3]?.diagnostics ?? []),
      ...(result.ruleResults[4]?.diagnostics ?? []),
      ...(result.ruleResults[5]?.diagnostics ?? []),
      ...(result.ruleResults[6]?.diagnostics ?? []),
    ]);
  });

  it("fails textFormat isoDate when heading selection is empty", () => {
    const document = normalize(parse("# 2026-06-14\n\nbody\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "date.empty-selection",
          select: { target: "heading", text: "2099-01-01" },
          assert: { textFormat: { format: "isoDate" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([
      expect.objectContaining({
        ruleId: "date.empty-selection",
        passed: false,
        diagnostics: [
          {
            code: "profile.validation.emptySelection",
            ruleId: "date.empty-selection",
            message: "Rule selector did not match any document targets.",
            severity: "error",
          },
        ],
      }),
    ]);
  });

  it("validates strict section order for reordered and duplicate-heading cases", () => {
    const document = normalize(
      parse("# Alpha\n\nReady.\n\n# Beta\n\nDone.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "sections.present",
          select: { target: "document" },
          assert: {
            sectionsRequired: { headings: ["Alpha", "Beta"], order: "strict" },
          },
        },
        {
          id: "sections.reordered",
          select: { target: "document" },
          assert: {
            sectionsRequired: { headings: ["Beta", "Alpha"], order: "strict" },
          },
        },
        {
          id: "sections.duplicate",
          select: { target: "document" },
          assert: {
            sectionsRequired: { headings: ["Alpha", "Alpha"], order: "strict" },
          },
        },
      ],
    });

    expect(result.ruleResults).toEqual([
      {
        ruleId: "sections.duplicate",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.sectionOrder",
            message:
              'Required section "Alpha" is not present after the previous required section.',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 1 }),
            }),
          }),
        ],
      },
      {
        ruleId: "sections.present",
        passed: true,
        diagnostics: [],
      },
      {
        ruleId: "sections.reordered",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.sectionOrder",
            message:
              'Required section "Alpha" is not present after the previous required section.',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 1 }),
            }),
          }),
        ],
      },
    ]);
  });

  it("evaluates frontmatter required fields for present, empty, and non-object frontmatter", () => {
    const presentDocument = normalize(
      parse("---\ntitle: \"\"\nowner: docs\n---\n# Body\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const emptyDocument = normalize(parse("---\n---\n# Body\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const nonObjectDocument = {
      ...normalize(parse("# Body\n").parsed, {
        documentVersion: "1.0.0",
      }).document,
      frontmatter: "title",
    };
    const profileForFields = (fields: readonly string[]): ValidationProfile => ({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "frontmatter.required",
          select: { target: "document" },
          assert: { frontmatterRequired: { fields } },
        },
      ],
    });

    expect(
      validateWithProfile(presentDocument, profileForFields(["title"])),
    ).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "frontmatter.required",
          passed: true,
          diagnostics: [],
        },
      ],
    });
    expect(
      validateWithProfile(emptyDocument, profileForFields(["title"])),
    ).toMatchObject({
      valid: false,
      diagnostics: [
        {
          code: "profile.validation.frontmatterFieldMissing",
          ruleId: "frontmatter.required",
          message: 'Required frontmatter field "title" is missing.',
          severity: "error",
        },
      ],
    });
    expect(
      validateWithProfile(nonObjectDocument, profileForFields(["title", "owner"])),
    ).toMatchObject({
      valid: false,
      diagnostics: [
        {
          code: "profile.validation.frontmatterFieldMissing",
          ruleId: "frontmatter.required",
          message: 'Required frontmatter field "title" is missing.',
          severity: "error",
        },
        {
          code: "profile.validation.frontmatterFieldMissing",
          ruleId: "frontmatter.required",
          message: 'Required frontmatter field "owner" is missing.',
          severity: "error",
        },
      ],
    });
  });

  it("omits source ranges when selected text targets have no source evidence", () => {
    const document = normalize(
      parse(
        [
          "# Status",
          "",
          "| Step | Owner |",
          "| --- | --- |",
          "| Build | engine |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "row.excludes",
          select: { target: "tableRow" },
          assert: { text: { excludes: ["engine"] } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.textExcluded",
        ruleId: "row.excludes",
        message: 'Selected tableRow text must not contain "engine".',
        severity: "error",
      },
    ]);
  });

  it("rejects removed containsExactlyOne text assertions before rule evaluation", () => {
    const document = normalize(parse("# Objective\n\nMission ready.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "text.removed-exact-one",
            select: { target: "section", title: "Objective" },
            assert: { text: { containsExactlyOne: "Mission" } },
          },
        ],
      } as unknown as ValidationProfile,
    );

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "containsExactlyOne".',
        severity: "error",
      },
    ]);
  });

  it("rejects removed assertion column modifiers before rule evaluation", () => {
    const document = normalize(
      parse([
        "# Status",
        "",
        "| ID | Statement |",
        "| --- | --- |",
        "| REQ-1 | system shall pass |",
      ].join("\n")).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "ids.removed-column",
            select: { target: "tableCell", column: "ID" },
            assert: { ids: { column: "ID" } },
          },
          {
            id: "text.removed-column",
            select: { target: "tableCell", column: "Statement" },
            assert: { text: { contains: "shall", column: "Statement" } },
          },
          {
            id: "occurrence.removed-column",
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
      } as unknown as ValidationProfile,
    );

    expect(result.valid).toBe(false);
    expect(result.ruleResults).toEqual([]);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "column".',
        severity: "error",
      },
      {
        code: "profile.config.invalidShape",
        ruleId: "ids.removed-column",
        message: "ids.unique must be true.",
        severity: "error",
      },
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "column".',
        severity: "error",
      },
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "column".',
        severity: "error",
      },
    ]);
  });

  it("emits source-targeted diagnostics for table cell text assertions", () => {
    const document = normalize(
      parse(
        [
          "# Status",
          "",
          "| Step | Owner |",
          "| --- | --- |",
          "| Build | engine |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "owner.contains",
          select: {
            target: "tableCell",
            column: "Owner",
            rowWhere: { column: "Step", equals: "Build" },
          },
          assert: { text: { contains: "docs" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.textMissing",
        ruleId: "owner.contains",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("detects missing required table columns with table source evidence", () => {
    const document = normalize(
      parse(
        [
          "# Status",
          "",
          "| Step | State |",
          "| --- | --- |",
          "| Build | ready |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "table-columns.required",
          select: { target: "table" },
          assert: { tableColumnsRequired: { columns: ["Owner", "State"] } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        ruleId: "table-columns.required",
        message: 'Selected table must include column "Owner".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 3 }),
        }),
      }),
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "table-columns.required",
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("preserves declared missing table column order when source ranges match", () => {
    const document = normalize(
      parse("| Step |\n| --- |\n| Build |\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "table-columns.order",
          select: { target: "table" },
          assert: {
            tableColumnsRequired: {
              columns: [
                "Column 01",
                "Column 02",
                "Column 03",
                "Column 04",
                "Column 05",
                "Column 06",
                "Column 07",
                "Column 08",
                "Column 09",
                "Column 10",
                "Column 11",
              ],
            },
          },
        },
      ],
    });

    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      'Selected table must include column "Column 01".',
      'Selected table must include column "Column 02".',
      'Selected table must include column "Column 03".',
      'Selected table must include column "Column 04".',
      'Selected table must include column "Column 05".',
      'Selected table must include column "Column 06".',
      'Selected table must include column "Column 07".',
      'Selected table must include column "Column 08".',
      'Selected table must include column "Column 09".',
      'Selected table must include column "Column 10".',
      'Selected table must include column "Column 11".',
    ]);
  });

  it("omits source ranges for table column diagnostics without table source evidence", () => {
    const sourceDocument = normalize(
      parse("| Step | State |\n| --- | --- |\n| Build | ready |\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(
      {
        ...sourceDocument,
        children: [],
      },
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "table-columns.sourceless",
            select: { target: "table" },
            assert: { tableColumnsRequired: { columns: ["Owner"] } },
          },
        ],
      },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.assertionFailed",
        ruleId: "table-columns.sourceless",
        message: 'Selected table must include column "Owner".',
        severity: "error",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "table-columns.sourceless",
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("detects duplicate prefixed IDs in table cells with source evidence", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| SYS-1 | Ignore non-requirement IDs |",
          "| REQ-1 | Launch safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.table-cells",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.duplicateId",
        ruleId: "ids.table-cells",
        message: 'ID "REQ-1" duplicates earlier ID "REQ-1".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 7 }),
        }),
      }),
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.table-cells",
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("fails v2 ids minCount after prefix filtering and repeated comparison values are collapsed", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| OBJ-1 | Build safely |",
          "| SYS-1 | Ignore non-objective IDs |",
          "| OBJ-1 | Repeated objective occurrence |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.min-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { prefix: "OBJ", minCount: 2 } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.idCountTooLow",
        ruleId: "ids.min-count",
        message:
          'Expected at least 2 unique IDs matching prefix "OBJ" but found 1.',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.min-count",
        status: "failed",
        passed: false,
        diagnostics: result.diagnostics,
        evaluation: {
          kind: "assertions",
          diagnostics: result.diagnostics,
        },
      },
    ]);
  });

  it("fails v2 ids maxCount at the first excess unique ID after prefix filtering", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| OBJ-1 | Build safely |",
          "| SYS-1 | Ignore non-objective IDs |",
          "| OBJ-2 | Launch safely |",
          "| OBJ-3 | Recover safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.max-count",
          select: { target: "tableCell", column: "ID" },
          assert: { ids: { prefix: "OBJ", maxCount: 2 } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.idCountTooHigh",
        ruleId: "ids.max-count",
        message:
          'Expected at most 2 unique IDs matching prefix "OBJ" but found 3.',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 8 }),
        }),
      }),
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.max-count",
        status: "failed",
        passed: false,
        diagnostics: result.diagnostics,
        evaluation: {
          kind: "assertions",
          diagnostics: result.diagnostics,
        },
      },
    ]);
  });

  it("counts overlapping ID occurrences once for v2 ids bounds", () => {
    const document = normalize(
      parse("# Parent\n\n## Child\n\nREQ-1 is defined here.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.overlapping-count",
          select: { target: "section" },
          assert: { ids: { prefix: "REQ", minCount: 1, maxCount: 1 } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.overlapping-count",
          status: "passed",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "assertions",
            diagnostics: [],
          },
        },
      ],
    });
  });

  it("counts case-insensitive comparison values once for v2 ids bounds", () => {
    const document = normalize(
      parse("# Requirements\n\nREQ-1 is ready.\n\nreq-1 repeats.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.case-insensitive-count",
          select: { target: "section", title: "Requirements" },
          assert: {
            ids: {
              prefix: "req",
              caseSensitive: false,
              minCount: 1,
              maxCount: 1,
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.case-insensitive-count",
          status: "passed",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "assertions",
            diagnostics: [],
          },
        },
      ],
    });
  });

  it("passes v2 allOf only when every branch passes", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.allof.passes",
          severity: "warning",
          allOf: [
            {
              label: "document-exists",
              select: { target: "document" },
              assert: { exists: true },
            },
            {
              label: "mission-ready",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Ready" } },
            },
          ],
        },
      ],
    });

    expect(result).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "mission.allof.passes",
          status: "passed",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "allOf",
            branches: [
              {
                branchIndex: 0,
                label: "document-exists",
                status: "passed",
                diagnostics: [],
              },
              {
                branchIndex: 1,
                label: "mission-ready",
                status: "passed",
                diagnostics: [],
              },
            ],
          },
        },
      ],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 1,
        skippedRuleCount: 0,
      },
    });
  });

  it("fails v2 allOf with one top-level summary diagnostic and nested branch diagnostics", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const summaryDiagnostic = {
      code: "profile.validation.groupRequirementFailed",
      ruleId: "mission.allof.fails",
      message: "One or more allOf branches failed the grouped rule.",
      severity: "error" as const,
    };
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.allof.fails",
          allOf: [
            {
              label: "document-exists",
              select: { target: "document" },
              assert: { exists: true },
            },
            {
              label: "mission-complete",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Complete" } },
            },
            {
              label: "verification-section",
              select: { target: "section", title: "Verification" },
              assert: { exists: true },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([summaryDiagnostic]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.allof.fails",
        status: "failed",
        passed: false,
        diagnostics: [summaryDiagnostic],
        evaluation: {
          kind: "allOf",
          branches: [
            {
              branchIndex: 0,
              label: "document-exists",
              status: "passed",
              diagnostics: [],
            },
            {
              branchIndex: 1,
              label: "mission-complete",
              status: "failed",
              diagnostics: [
                expect.objectContaining({
                  code: "profile.validation.textMissing",
                  ruleId: "mission.allof.fails",
                  message: 'Selected section text must contain "Complete".',
                  severity: "error",
                  sourceRange: expect.objectContaining({
                    start: expect.objectContaining({ line: 1, column: 1 }),
                  }),
                }),
              ],
            },
            {
              branchIndex: 2,
              label: "verification-section",
              status: "failed",
              diagnostics: [
                {
                  code: "profile.validation.emptySelection",
                  ruleId: "mission.allof.fails",
                  message: "Rule selector did not match any document targets.",
                  severity: "error",
                },
              ],
            },
          ],
        },
      },
    ]);
  });

  it("keeps v2 allOf branch results stable across repeated evidence runs", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.allof.repeatable",
          allOf: [
            {
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Ready" } },
            },
            {
              label: "missing-table",
              select: { target: "table", section: "Mission" },
              assert: { tableColumnsRequired: { columns: ["ID"] } },
            },
          ],
        },
      ],
    } satisfies ValidationProfile;
    const firstResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });
    const secondResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });

    expect(secondResult).toEqual(firstResult);
    expect(firstResult.diagnostics).toEqual([
      {
        code: "profile.validation.groupRequirementFailed",
        ruleId: "mission.allof.repeatable",
        message: "One or more allOf branches failed the grouped rule.",
        severity: "error",
      },
    ]);
    expect(firstResult.ruleResults[0]).toMatchObject({
      ruleId: "mission.allof.repeatable",
      status: "failed",
      evaluation: {
        kind: "allOf",
        branches: [
          {
            branchIndex: 0,
            status: "passed",
            diagnostics: [],
          },
          {
            branchIndex: 1,
            label: "missing-table",
            status: "failed",
            diagnostics: [
              {
                code: "profile.validation.emptySelection",
                ruleId: "mission.allof.repeatable",
                message: "Rule selector did not match any document targets.",
                severity: "error",
              },
            ],
          },
        ],
      },
    });
    expect(firstResult.evidence?.ruleResults).toEqual(firstResult.ruleResults);
    expect(firstResult.evidence?.diagnostics).toEqual(firstResult.diagnostics);
  });

  it("passes v2 anyOf when a branch passes and keeps failed branch diagnostics nested", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.anyof.passes",
          anyOf: [
            {
              label: "verification-section",
              select: { target: "section", title: "Verification" },
              assert: { exists: true },
            },
            {
              label: "mission-ready",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Ready" } },
            },
            {
              label: "mission-complete",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Complete" } },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.anyof.passes",
        status: "passed",
        passed: true,
        diagnostics: [],
        evaluation: {
          kind: "anyOf",
          selectedBranch: {
            branchIndex: 1,
            label: "mission-ready",
          },
          branches: [
            {
              branchIndex: 0,
              label: "verification-section",
              status: "failed",
              diagnostics: [
                {
                  code: "profile.validation.emptySelection",
                  ruleId: "mission.anyof.passes",
                  message: "Rule selector did not match any document targets.",
                  severity: "error",
                },
              ],
            },
            {
              branchIndex: 1,
              label: "mission-ready",
              status: "passed",
              diagnostics: [],
            },
            {
              branchIndex: 2,
              label: "mission-complete",
              status: "failed",
              diagnostics: [
                expect.objectContaining({
                  code: "profile.validation.textMissing",
                  ruleId: "mission.anyof.passes",
                  message: 'Selected section text must contain "Complete".',
                  severity: "error",
                  sourceRange: expect.objectContaining({
                    start: expect.objectContaining({ line: 1, column: 1 }),
                  }),
                }),
              ],
            },
          ],
        },
      },
    ]);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      ruleCount: 1,
      evaluatedRuleCount: 1,
      skippedRuleCount: 0,
    });
  });

  it("fails v2 anyOf with one top-level summary diagnostic and nested branch diagnostics", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const summaryDiagnostic = {
      code: "profile.validation.noAlternativeMatched",
      ruleId: "mission.anyof.fails",
      message: "No anyOf branch matched the grouped rule.",
      severity: "error" as const,
    };
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.anyof.fails",
          anyOf: [
            {
              label: "verification-section",
              select: { target: "section", title: "Verification" },
              assert: { exists: true },
            },
            {
              label: "mission-complete",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Complete" } },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([summaryDiagnostic]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.anyof.fails",
        status: "failed",
        passed: false,
        diagnostics: [summaryDiagnostic],
        evaluation: {
          kind: "anyOf",
          branches: [
            {
              branchIndex: 0,
              label: "verification-section",
              status: "failed",
              diagnostics: [
                {
                  code: "profile.validation.emptySelection",
                  ruleId: "mission.anyof.fails",
                  message: "Rule selector did not match any document targets.",
                  severity: "error",
                },
              ],
            },
            {
              branchIndex: 1,
              label: "mission-complete",
              status: "failed",
              diagnostics: [
                expect.objectContaining({
                  code: "profile.validation.textMissing",
                  ruleId: "mission.anyof.fails",
                  message: 'Selected section text must contain "Complete".',
                  severity: "error",
                  sourceRange: expect.objectContaining({
                    start: expect.objectContaining({ line: 1, column: 1 }),
                  }),
                }),
              ],
            },
          ],
        },
      },
    ]);
  });

  it("keeps v2 anyOf branch results stable across repeated evidence runs", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.anyof.repeatable",
          anyOf: [
            {
              select: { target: "section", title: "Missing" },
              assert: { exists: true },
            },
            {
              label: "mission-ready",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Ready" } },
            },
          ],
        },
      ],
    } satisfies ValidationProfile;
    const firstResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });
    const secondResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });

    expect(secondResult).toEqual(firstResult);
    expect(firstResult.diagnostics).toEqual([]);
    expect(firstResult.ruleResults[0]).toMatchObject({
      ruleId: "mission.anyof.repeatable",
      status: "passed",
      evaluation: {
        kind: "anyOf",
        selectedBranch: {
          branchIndex: 1,
          label: "mission-ready",
        },
        branches: [
          {
            branchIndex: 0,
            status: "failed",
          },
          {
            branchIndex: 1,
            label: "mission-ready",
            status: "passed",
            diagnostics: [],
          },
        ],
      },
    });
    expect(firstResult.evidence?.ruleResults).toEqual(firstResult.ruleResults);
    expect(firstResult.evidence?.diagnostics).toEqual(firstResult.diagnostics);
  });

  it("evaluates matched v2 applicability before flat rule evaluation", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.when.matched",
          when: {
            select: { target: "section", title: "Mission" },
            assert: { text: { contains: "Ready" } },
          },
          select: { target: "section", title: "Mission" },
          assert: { text: { contains: "launch" } },
        },
      ],
    } satisfies ValidationProfile;

    const result = validateWithProfile(document, profile);

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "mission.when.matched",
          status: "passed",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "assertions",
            diagnostics: [],
          },
        },
      ],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 1,
        skippedRuleCount: 0,
      },
    });
  });

  it("returns deterministic skipped output for non-matching v2 applicability", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.when.not-matched",
          when: {
            select: { target: "section", title: "Verification" },
            assert: { exists: true },
          },
          select: { target: "section", title: "Mission" },
          assert: { text: { contains: "DO NOT EVALUATE" } },
        },
      ],
    } satisfies ValidationProfile;
    const compileResult = compileValidationProfile(profile);
    const compiledRule = compileResult.plan?.rules[0];

    if (compiledRule === undefined) {
      throw new Error("Expected applicability rule to compile.");
    }

    const expectedWhenDiagnostics = [
      {
        code: "profile.validation.emptySelection",
        ruleId: "mission.when.not-matched",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
    ];
    const expectedRuleResults = [
      {
        ruleId: "mission.when.not-matched",
        status: "skipped",
        passed: true,
        diagnostics: [],
        when: {
          status: "notMatched",
          diagnostics: expectedWhenDiagnostics,
        },
        evaluation: {
          kind: "skipped",
          reason: "whenNotMatched",
        },
      },
    ];

    expect(
      classifyCompiledDeclarativeRuleApplicability(compiledRule, document),
    ).toEqual({
      status: "notMatched",
      result: {
        status: "notMatched",
        diagnostics: expectedWhenDiagnostics,
      },
    });

    const firstResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });
    const secondResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });

    expect(secondResult).toEqual(firstResult);
    expect(firstResult).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: expectedRuleResults,
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 0,
        skippedRuleCount: 1,
      },
    });
    expect(firstResult.evidence).toMatchObject({
      engineVersion: "3.0.0",
      runtimeVersion: process.version,
      ruleResults: expectedRuleResults,
      diagnostics: [],
    });
    expect(firstResult.evidence?.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstResult.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstResult.evidence?.ruleResults).toEqual(firstResult.ruleResults);
    expect(firstResult.evidence?.diagnostics).toEqual(firstResult.diagnostics);
  });

  it("continues matched v2 applicability into grouped rule evaluation", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.when.grouped",
          when: {
            select: { target: "document" },
            assert: { sectionsRequired: { headings: ["Mission"] } },
          },
          anyOf: [
            {
              label: "verification",
              select: { target: "section", title: "Verification" },
              assert: { exists: true },
            },
            {
              label: "mission-ready",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Ready" } },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.when.grouped",
        status: "passed",
        passed: true,
        diagnostics: [],
        evaluation: {
          kind: "anyOf",
          selectedBranch: {
            branchIndex: 1,
            label: "mission-ready",
          },
          branches: [
            {
              branchIndex: 0,
              label: "verification",
              status: "failed",
              diagnostics: [
                {
                  code: "profile.validation.emptySelection",
                  ruleId: "mission.when.grouped",
                  message: "Rule selector did not match any document targets.",
                  severity: "error",
                },
              ],
            },
            {
              branchIndex: 1,
              label: "mission-ready",
              status: "passed",
              diagnostics: [],
            },
          ],
        },
      },
    ]);
  });

  it("rejects invalid v2 applicability input before matcher execution", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(document, {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "mission.when.invalid",
            when: {
              select: { target: "document" },
              assert: { expression: "document.ready === true" },
            },
            select: { target: "document" },
            assert: { exists: true },
          },
        ],
      } as unknown as ValidationProfile),
    ).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "expression".',
          severity: "error",
        },
      ],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 0,
        skippedRuleCount: 0,
      },
    });
  });

  it("honors case-sensitive and case-insensitive ID policies", () => {
    const document = normalize(
      parse("# Requirements\n\nREQ-1 is ready.\n\nreq-1 repeats.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.case-insensitive",
          select: { target: "section", title: "Requirements" },
          assert: { ids: { unique: true, prefix: "req", caseSensitive: false } },
        },
        {
          id: "ids.case-sensitive",
          select: { target: "section", title: "Requirements" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.case-insensitive",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.duplicateId",
            message: 'ID "req-1" duplicates earlier ID "REQ-1".',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 5 }),
            }),
          }),
        ],
      },
      {
        ruleId: "ids.case-sensitive",
        passed: true,
        diagnostics: [],
      },
    ]);
    expect(result.diagnostics).toEqual(result.ruleResults[0]?.diagnostics);
  });

  it("emits empty-selection diagnostics for ID assertions", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.empty-selection",
          select: { target: "section", title: "Requirements" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: "ids.empty-selection",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.empty-selection",
        passed: false,
        diagnostics: result.diagnostics,
      },
    ]);
  });

  it("does not duplicate child section IDs through overlapping section targets", () => {
    const document = normalize(
      parse("# Parent\n\n## Child\n\nREQ-1 is defined here.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.section-overlap",
          select: { target: "section" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.section-overlap",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not duplicate IDs across overlapping textSpan projections", () => {
    const document = normalize(
      parse("# Requirements\n\nIntro **REQ-1** is ready.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.text-span-overlap",
          select: { target: "textSpan" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.text-span-overlap",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not duplicate IDs across source-less overlapping textSpan projections", () => {
    const document = withoutSourceEvidence(
      normalize(
        parse("# Requirements\n\nIntro **REQ-1** is ready.\n").parsed,
        {
          documentVersion: "1.0.0",
        },
      ).document,
    );
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.text-span-overlap-sourceless",
          select: { target: "textSpan" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.text-span-overlap-sourceless",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not duplicate escaped IDs across overlapping textSpan projections", () => {
    const document = normalize(
      parse("# Requirements\n\nIntro **REQ\\-1** is ready.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.text-span-overlap-escaped",
          select: { target: "textSpan" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.text-span-overlap-escaped",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not bind escaped link text IDs to matching URL source syntax", () => {
    const document = normalize(
      parse("# Requirements\n\nSee [REQ\\-1](REQ-1.md).\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.escaped-link-text-overlap",
          select: { target: "textSpan" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "ids.escaped-link-text-overlap",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("detects IDs split across inline formatting boundaries", () => {
    const document = normalize(
      parse("# Requirements\n\nREQ-**1** is ready.\n\nREQ-1 is repeated.\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.inline-boundary",
          select: { target: "section", title: "Requirements" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.duplicateId",
        ruleId: "ids.inline-boundary",
        message: 'ID "REQ-1" duplicates earlier ID "REQ-1".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("evaluates IDs across document, list, and link structural targets", () => {
    const document = normalize(
      parse(
        [
          "# REQ-1",
          "",
          "Document repeats REQ-1.",
          "",
          "- ITEM-1",
          "- ITEM-1",
          "",
          "[LINK-1](https://example.com/a)",
          "[LINK-1](https://example.com/b)",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "ids.document",
          select: { target: "document" },
          assert: { ids: { unique: true, prefix: "REQ" } },
        },
        {
          id: "ids.links",
          select: { target: "link" },
          assert: { ids: { unique: true, prefix: "LINK" } },
        },
        {
          id: "ids.lists",
          select: { target: "list" },
          assert: { ids: { unique: true, prefix: "ITEM" } },
        },
      ],
    });

    expect(result.ruleResults).toEqual([
      {
        ruleId: "ids.document",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.duplicateId",
            message: 'ID "REQ-1" duplicates earlier ID "REQ-1".',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 3 }),
            }),
          }),
        ],
      },
      {
        ruleId: "ids.links",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.duplicateId",
            message: 'ID "LINK-1" duplicates earlier ID "LINK-1".',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 9 }),
            }),
          }),
        ],
      },
      {
        ruleId: "ids.lists",
        passed: false,
        diagnostics: [
          expect.objectContaining({
            code: "profile.validation.duplicateId",
            message: 'ID "ITEM-1" duplicates earlier ID "ITEM-1".',
            sourceRange: expect.objectContaining({
              start: expect.objectContaining({ line: 6 }),
            }),
          }),
        ],
      },
    ]);
  });

  it("reports missing references from required table-column source IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-2 | Launch safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
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
    });

    expect(result.diagnostics).toEqual([
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

  it("collects section column source IDs from child section tables", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "## Details",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-2 | Launch safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-section-column-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-section-column-source",
        message: 'ID "REQ-2" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
    ]);
  });

  it("resolves target table column tokens without section text fallback", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-2 | Launch safely |",
          "",
          "# Traceability",
          "",
          "Narrative mentions REQ-2 but does not cover it.",
          "",
          "| Requirement | Behavior | Notes |",
          "| --- | --- | --- |",
          "| REQ-1 | BEH-1 | - |",
          "| - | BEH-2 | REQ-2 appears in the wrong column |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const resolution = resolveTableColumnIdTokens(
      document,
      { section: "Traceability", column: "Requirement" },
      { prefix: "REQ" },
    );

    expect(resolution.status).toBe("resolved");
    expect(resolution.tokens.map((token) => token.value)).toEqual(["REQ-1"]);
    expect(resolution.tokens).toEqual([
      expect.objectContaining({
        definitionColumnHeader: "Requirement",
        sectionTitle: "Traceability",
      }),
    ]);
  });

  it("distinguishes missing target sections from missing target columns", () => {
    const document = normalize(
      parse(
        [
          "# Traceability",
          "",
          "| Behavior | Notes |",
          "| --- | --- |",
          "| BEH-1 | REQ-1 appears in the wrong column |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;

    expect(
      resolveTableColumnIdTokens(document, {
        section: "Missing Traceability",
        column: "Requirement",
      }),
    ).toEqual({
      status: "missingSection",
      source: {
        section: "Missing Traceability",
        column: "Requirement",
      },
      tokens: [],
    });
    expect(
      resolveTableColumnIdTokens(document, {
        section: "Traceability",
        column: "Requirement",
      }),
    ).toEqual({
      status: "missingColumn",
      source: {
        section: "Traceability",
        column: "Requirement",
      },
      tokens: [],
    });
  });

  it("treats an existing target column with no IDs as resolved", () => {
    const document = normalize(
      parse(
        [
          "# Traceability",
          "",
          "| Requirement | Behavior |",
          "| --- | --- |",
          "| TBD | BEH-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const resolution = resolveTableColumnIdTokens(
      document,
      { section: "Traceability", column: "Requirement" },
      { prefix: "REQ" },
    );

    expect(resolution).toEqual({
      status: "resolved",
      source: {
        section: "Traceability",
        column: "Requirement",
      },
      tokens: [],
    });
  });

  it("collects section source IDs from child section tables without a column selector", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "## Details",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-2 | Launch safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-section-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-section-source",
        message: 'ID "REQ-2" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
    ]);
  });

  it("collects source IDs from section table text without a column selector", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.section-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.section-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts non-definition table cells as references for section source IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covers REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.section-table-reference",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.section-table-reference",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts references in child sections of required target sections", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "## Verification",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-section",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.child-section",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not count same-section one-column source tables as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.section-column-same-section-table",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.section-column-same-section-table",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count child-section headings as required references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "## REQ-1",
          "",
          "Heading-only mention is not body evidence.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-heading",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-heading",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count source IDs or duplicate source-definition rows as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-1 | Launch safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-source-rows",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.duplicate-source-rows",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count duplicate document-level table source rows as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-1 | Launch safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-duplicate-source-rows",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.document-duplicate-source-rows",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("counts different target rows when outside definitions exist", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-1 | Launch safely |",
          "",
          "# Other Source",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Archive safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.target-duplicates-with-outside-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.target-duplicates-with-outside-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not count non-source-column tokens in duplicate source rows", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covers REQ-1 |",
          "| REQ-1 | Covers REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-source-row-non-source-token",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.duplicate-source-row-non-source-token",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count non-source-column tokens in duplicate source ID rows with different text", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covers REQ-1 A |",
          "| REQ-1 | Covers REQ-1 B |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-source-id-different-row-text",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.duplicate-source-id-different-row-text",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count current-target one-column source rows when outside definitions exist", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
          "",
          "# Other Source",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Archive safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.one-column-target-with-outside-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.one-column-target-with-outside-source",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
    ]);
  });

  it("does not count nested one-column source rows as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "> | ID |",
          "> | --- |",
          "> | REQ-1 |",
          "",
          "# Other Source",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Archive safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.nested-one-column-source-row",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.nested-one-column-source-row",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
    ]);
  });

  it("does not count a one-column document-level source row as its own reference", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.one-column-source-row",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.one-column-source-row",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count duplicate one-column section source rows as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.one-column-section-duplicates",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.one-column-section-duplicates",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count selected child-section one-column source rows as parent references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "## Details",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-one-column-source-parent-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-one-column-source-parent-target",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 7 }),
        }),
      }),
    ]);
  });

  it("does not count selected child-section source rows when parent definitions exist", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "## Details",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-one-column-with-parent-definition",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-one-column-with-parent-definition",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not let earlier document mentions make duplicate source rows count as references", () => {
    const document = normalize(
      parse(
        [
          "Preface mentions REQ-1 before the definitions.",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "| REQ-1 | Launch safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-mention-before-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.document-mention-before-source",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 7 }),
        }),
      }),
    ]);
  });

  it("counts cross-section alternate-shape table rows as document references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.cross-section-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements A"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.cross-section-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts cross-section alternate-shape table rows as column references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.cross-section-column-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements A"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.cross-section-column-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts later alternate-shape table rows as document references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.later-cross-section-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements B"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.later-cross-section-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts same-family target body references for document-level source IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.same-family-body-reference",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements B"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.same-family-body-reference",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts later same-family target body references for document-level source IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification A",
          "",
          "Covers REQ-1.",
          "",
          "# Verification B",
          "",
          "Covers REQ-1.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.later-same-family-body-reference",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification B"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.later-same-family-body-reference",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("requires references in every duplicate target section", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
          "",
          "# Verification",
          "",
          "No coverage here.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-target-sections",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.duplicate-target-sections",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("counts later alternate-shape table rows as column references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.later-cross-section-column-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements B"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.later-cross-section-column-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts target table references before later document-level source definitions", () => {
    const document = normalize(
      parse(
        [
          "# Verification",
          "",
          "| Covered ID |",
          "| --- |",
          "| REQ-1 |",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-target-before-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.document-target-before-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts target table references before later column source definitions", () => {
    const document = normalize(
      parse(
        [
          "# Verification",
          "",
          "| Covered ID |",
          "| --- |",
          "| REQ-1 |",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.column-target-before-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.column-target-before-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts same-structure target table references before later column source definitions", () => {
    const document = normalize(
      parse(
        [
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered |",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.same-structure-target-before-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.same-structure-target-before-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts multiple target evidence rows before later column source definitions", () => {
    const document = normalize(
      parse(
        [
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered by unit test |",
          "| REQ-1 | Covered by integration test |",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.multiple-target-rows-before-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.multiple-target-rows-before-source",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts later alternate-shape table rows as document references when row content differs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
          "",
          "# Requirements C",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Ground |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.alternate-shape-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements C"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.alternate-shape-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts same-header target table references when the source has multiple shapes", () => {
    const document = normalize(
      parse(
        [
          "# Requirements Source A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements Source B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
          "",
          "# Requirements Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.multi-shape-same-header-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.multi-shape-same-header-target",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts later alternate-shape table rows as column references when row content differs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements B",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.alternate-shape-column-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements B"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.alternate-shape-column-source-tables",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts same-header target table references when source sections are also required targets", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "Covers REQ-1 in source body.",
          "",
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.source-and-target-same-header",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements", "Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.source-and-target-same-header",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not count copied source rows when source sections are also required targets", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "Covers REQ-1 in source body.",
          "",
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.source-target-copied-row",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements", "Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.source-target-copied-row",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not collapse duplicate concrete target sections by title", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "Covers REQ-1.",
          "",
          "# Verification",
          "",
          "No coverage yet.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-title-concrete-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.duplicate-title-concrete-target",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("counts table references in every duplicate concrete target section", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covered by simulation |",
          "",
          "# Verification",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-title-table-references",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.duplicate-title-table-references",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts identical table evidence in duplicate concrete target sections", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
          "",
          "# Verification",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.duplicate-title-identical-table-references",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.duplicate-title-identical-table-references",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not count exact target definition tables as document or column references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-exact-target-definition",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
        {
          id: "references.column-exact-target-definition",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.column-exact-target-definition",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.document-exact-target-definition",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count non-source-column tokens from exact copied definition rows", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Related |",
          "| --- | --- |",
          "| REQ-1 | REQ-1 |",
          "",
          "# Verification",
          "",
          "| ID | Related |",
          "| --- | --- |",
          "| REQ-1 | REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.exact-row-copy-non-source-column",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.exact-row-copy-non-source-column",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count cross-ID tokens from exact copied definition rows", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Related |",
          "| --- | --- |",
          "| REQ-1 | Depends on REQ-2 |",
          "| REQ-2 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Related |",
          "| --- | --- |",
          "| REQ-1 | Depends on REQ-2 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.exact-row-copy-cross-id",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.exact-row-copy-cross-id",
        message: 'ID "REQ-1" must appear in section "Verification".',
      }),
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.exact-row-copy-cross-id",
        message: 'ID "REQ-2" must appear in section "Verification".',
      }),
    ]);
  });

  it("does not count duplicate target definition tables for section column sources", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.section-column-duplicate-target-table",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.section-column-duplicate-target-table",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count child-section duplicate definition tables as parent target references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "## Requirements B",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-duplicate-definition-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-duplicate-definition-target",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count child-section duplicate definition tables as parent column target references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "## Requirements B",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.child-duplicate-definition-column-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.child-duplicate-definition-column-target",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count same-section duplicate source definition tables as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.same-section-duplicate-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.same-section-duplicate-source-tables",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("does not count same-section alternate-shape source definition tables as references", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "| ID | Owner |",
          "| --- | --- |",
          "| REQ-1 | Flight |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.same-section-alternate-source-tables",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Requirements"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.same-section-alternate-source-tables",
        message: 'ID "REQ-1" must appear in section "Requirements".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 5 }),
        }),
      }),
    ]);
  });

  it("counts table references in target sections for document-level source IDs", () => {
    const document = normalize(
      parse(
        [
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| Evidence |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-table-reference",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.document-table-reference",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts same-family target table references outside source definition columns", () => {
    const document = normalize(
      parse(
        [
          "# Requirements Source",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Requirements Verification",
          "",
          "| Evidence |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.same-family-table-reference",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Requirements Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.same-family-table-reference",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("does not count one-column ID target rows for document-level column sources", () => {
    const document = normalize(
      parse(
        [
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.column-table-same-header",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.column-table-same-header",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 3 }),
        }),
      }),
    ]);
  });

  it("counts same-header target table references for section column sources when row content differs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.section-column-same-header-target",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.section-column-same-header-target",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts multiple different target table evidence rows", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID | Evidence |",
          "| --- | --- |",
          "| REQ-1 | Covered by unit test |",
          "| REQ-1 | Covered by integration test |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.multiple-target-evidence-rows",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.multiple-target-evidence-rows",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("counts target table references when source and target columns share a header", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "| ID |",
          "| --- |",
          "| REQ-1 |",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.document-table-same-header",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "references.document-table-same-header",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("collects table-column source IDs from top-level tables", () => {
    const document = normalize(
      parse(
        [
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "No coverage yet.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.top-level-table-column",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.top-level-table-column",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 3 }),
        }),
      }),
    ]);
  });

  it("collects document-level source IDs from top-level tables", () => {
    const document = normalize(
      parse(
        [
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification",
          "",
          "No coverage yet.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.top-level-document-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.top-level-document-source",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 3 }),
        }),
      }),
    ]);
  });

  it("uses escaped link text source ranges for reference source IDs", () => {
    const document = normalize(
      parse(
        [
          "# Requirements",
          "",
          "See [REQ\\-1](REQ-1.md).",
          "",
          "# Verification",
          "",
          "No coverage yet.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.escaped-link-text-source",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.escaped-link-text-source",
        message: 'ID "REQ-1" must appear in section "Verification".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 3, column: 6 }),
          end: expect.objectContaining({ line: 3, column: 12 }),
        }),
      }),
    ]);
  });

  it("omits source-less missing-reference diagnostics instead of borrowing target ranges", () => {
    const document = withoutFirstDataCellSourceEvidence(
      normalize(
        parse(
          [
            "# Requirements",
            "",
            "| ID | Statement |",
            "| --- | --- |",
            "| REQ-1 | Build safely |",
            "",
            "# Verification",
            "",
            "No coverage yet.",
          ].join("\n"),
        ).parsed,
        {
          documentVersion: "1.0.0",
        },
      ).document,
    );
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.source-evidence-only",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.referenceMissing",
        ruleId: "references.source-evidence-only",
        message: 'ID "REQ-1" must appear in section "Verification".',
        severity: "error",
      },
    ]);
  });

  it("does not borrow successful target reference ranges for missing diagnostics", () => {
    const document = withoutFirstDataCellSourceEvidence(
      normalize(
        parse(
          [
            "# Requirements",
            "",
            "| ID | Statement |",
            "| --- | --- |",
            "| REQ-1 | Build safely |",
            "",
            "# Verification A",
            "",
            "| Evidence |",
            "| --- |",
            "| REQ-1 |",
            "",
            "# Verification B",
            "",
            "No coverage yet.",
          ].join("\n"),
        ).parsed,
        {
          documentVersion: "1.0.0",
        },
      ).document,
    );
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.no-target-range-borrow",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { prefix: "REQ" },
              mustAppearIn: ["Verification A", "Verification B"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.referenceMissing",
        ruleId: "references.no-target-range-borrow",
        message: 'ID "REQ-1" must appear in section "Verification B".',
        severity: "error",
      },
    ]);
  });

  it("uses later source ranges instead of earlier target reference ranges", () => {
    const document = normalize(
      parse(
        [
          "# Verification A",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Covered by test |",
          "",
          "# Requirements",
          "",
          "| ID | Statement |",
          "| --- | --- |",
          "| REQ-1 | Build safely |",
          "",
          "# Verification B",
          "",
          "No coverage yet.",
        ].join("\n"),
      ).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "references.later-source-range",
          select: { target: "document" },
          assert: {
            references: {
              idsFrom: { column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification A", "Verification B"],
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "references.later-source-range",
        message: 'ID "REQ-1" must appear in section "Verification B".',
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
    ]);
  });

  it("returns deterministic diagnostics for typed profile accessors", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profileWithRulesAccessor = {
      syntaxVersion: "markdown-engine.validation@v1",
    };
    Object.defineProperty(profileWithRulesAccessor, "rules", {
      enumerable: true,
      get: () => {
        throw new Error("rules getter must not run");
      },
    });
    const result = validateWithProfile(
      document,
      profileWithRulesAccessor as ValidationProfile,
      { includeEvidence: true },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message: "Profile.rules must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      ruleCount: 0,
    });
    expect(result.ruleResults).toEqual([]);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects unsupported typed profile root keys before evidence generation", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [],
      plugin: "mission-control",
    } as const;
    const diagnostics = [
      {
        code: "profile.config.unsupportedKey",
        message: 'Unsupported validation profile key "plugin".',
        severity: "error",
      },
    ];

    expect(parseValidationProfile(profile).diagnostics).toEqual(diagnostics);

    const result = validateWithProfile(
      document,
      profile as unknown as ValidationProfile,
      { includeEvidence: true },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(diagnostics);
    expect(result.profile.ruleCount).toBe(0);
    expect(result.ruleResults).toEqual([]);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects unsupported typed rule keys and duplicate ids before evidence generation", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const invalidProfiles = [
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: "1.0.0",
          rules: [
            {
              id: "rule.notes",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Objective"] } },
              notes: "not part of the public profile contract",
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "notes".',
            severity: "error",
          },
        ],
        ruleCount: 0,
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: "1.0.0",
          rules: [
            {
              id: "duplicate",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Objective"] } },
            },
            {
              id: "duplicate",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Verification"] } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: 'Profile rule at index 1 duplicates rule id "duplicate".',
            severity: "error",
          },
        ],
        ruleCount: 2,
      },
    ] satisfies {
      profile: unknown;
      diagnostics: unknown[];
      ruleCount: number;
    }[];

    for (const { profile, diagnostics, ruleCount } of invalidProfiles) {
      expect(parseValidationProfile(profile).diagnostics).toEqual(diagnostics);

      const result = validateWithProfile(
        document,
        profile as unknown as ValidationProfile,
        { includeEvidence: true },
      );

      expect(result.valid).toBe(false);
      expect(result.diagnostics).toEqual(diagnostics);
      expect(result.profile.ruleCount).toBe(ruleCount);
      expect(result.ruleResults).toEqual([]);
      expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("does not execute nested profile payloads while generating evidence", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    class RulePayload {
      get severity(): string {
        throw new Error("severity getter must not run");
      }
    }

    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [new RulePayload()],
      } as unknown as ValidationProfile,
      { includeEvidence: true },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message: "Profile.rules[0] must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(result.profile.ruleCount).toBe(0);
    expect(result.ruleResults).toEqual([]);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates evidence for invalid JSON-safe typed rule entries", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [null],
      } as unknown as ValidationProfile,
      { includeEvidence: true },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message: "Profile rule at index 0 must be an object.",
        severity: "error",
      },
    ]);
    expect(result.profile.ruleCount).toBe(0);
    expect(result.ruleResults).toEqual([]);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates evidence diagnostics for typed proxy traps and non-finite numbers", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    let proxyTrapExecuted = false;
    let rulesProxyTrapExecuted = false;
    const throwingProxyProfile = new Proxy(
      {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [],
      },
      {
        ownKeys: () => {
          proxyTrapExecuted = true;
          throw new Error("ownKeys trap must not escape");
        },
      },
    );
    const throwingRulesProxy = new Proxy([], {
      get: (target, property, receiver) => {
        if (property === "length") {
          rulesProxyTrapExecuted = true;
          throw new Error("rules length trap must not escape");
        }

        return Reflect.get(target, property, receiver);
      },
    });
    const invalidProfiles = [
      {
        profile: throwingProxyProfile,
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: "1.0.0",
          rules: throwingRulesProxy,
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.rules must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          documentVersion: "1.0.0",
          rules: [
            {
              id: "selector.depth",
              select: { target: "section", depth: Number.POSITIVE_INFINITY },
              assert: { text: { contains: "Objective" } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].select.depth must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      profile: unknown;
      diagnostics: unknown[];
    }[];

    for (const { profile, diagnostics } of invalidProfiles) {
      const result = validateWithProfile(
        document,
        profile as ValidationProfile,
        { includeEvidence: true },
      );

      expect(result.valid).toBe(false);
      expect(result.diagnostics).toEqual(diagnostics);
      expect(result.profile.ruleCount).toBe(0);
      expect(result.ruleResults).toEqual([]);
      expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    }

    expect(proxyTrapExecuted).toBe(false);
    expect(rulesProxyTrapExecuted).toBe(false);
  });

  it("does not preserve profile __proto__ payloads during evidence hashing", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const selector = { target: "document" } as Record<string, unknown>;
    Object.defineProperty(selector, "__proto__", {
      enumerable: true,
      value: {
        toJSON: () => {
          throw new Error("profile prototype toJSON must not run");
        },
      },
    });
    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "proto.selector",
            select: selector,
            assert: { sectionsRequired: { headings: ["Objective"] } },
          },
        ],
      } as unknown as ValidationProfile,
      { includeEvidence: true },
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message:
          "Profile.rules[0].select.__proto__ must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(result.profile.ruleCount).toBe(0);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

const profile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "objective.contains",
      select: { target: "section", title: "Objective" },
      assert: { text: { contains: "architecture viable" } },
    },
    {
      id: "verification.diagnostic",
      select: { target: "section", title: "Verification" },
      assert: { text: { contains: "unresolved selector gap" } },
    },
  ],
} satisfies ValidationProfile;
