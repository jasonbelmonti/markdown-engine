import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/declarative-validation/proving/representative.md";
const fixture = readFileSync(
  new URL("../fixtures/declarative-validation/proving/representative.md", import.meta.url),
  "utf8",
);

describe("declarative validation assertion proof", () => {
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
      plugin: () => "mission-control",
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
              notes: () => "not part of the public profile contract",
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
