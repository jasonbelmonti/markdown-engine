import { describe, expect, it } from "vitest";

import { parseValidationProfile } from "@jasonbelmonti/markdown-engine";

describe("declarative validation profile parser", () => {
  it("parses YAML strings with nested rules", () => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: table-requirements
    severity: warning
    select:
      target: table
      section: Requirements
      header:
        - ID
        - Statement
    assert:
      tableColumnsRequired:
        columns:
          - ID
          - Statement
      text:
        column: Statement
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
              target: "table",
              section: "Requirements",
              header: ["ID", "Statement"],
            },
            assert: {
              tableColumnsRequired: {
                columns: ["ID", "Statement"],
              },
              text: {
                column: "Statement",
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
        {
          id: "select-frontmatter",
          select: { target: "frontmatter", field: "title" },
          assert: { text: { contains: "title" } },
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
      "frontmatter",
    ]);
    expect(result.diagnostics).toEqual([]);
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
            sectionsRequired: {
              headings: ["Objective", "Evidence"],
              order: "strict",
            },
            sectionOrder: {
              headings: ["Objective", "Evidence"],
            },
            tableColumnsRequired: {
              columns: ["ID", "Requirement statement"],
            },
            ids: {
              column: "ID",
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
              column: "Requirement statement",
              containsExactlyOne: "shall",
              excludes: ["and/or"],
            },
            textOccurrenceCount: {
              text: "shall",
              count: 1,
              column: "Requirement statement",
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
              sectionsRequired: {
                headings: ["Objective", "Evidence"],
                order: "strict",
              },
              sectionOrder: {
                headings: ["Objective", "Evidence"],
              },
              tableColumnsRequired: {
                columns: ["ID", "Requirement statement"],
              },
              ids: {
                column: "ID",
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
                column: "Requirement statement",
                containsExactlyOne: "shall",
                excludes: ["and/or"],
              },
              textOccurrenceCount: {
                text: "shall",
                count: 1,
                column: "Requirement statement",
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

  it("rejects ineffective id assertion payloads", () => {
    const ineffectiveIdsAssertions = [
      {},
      { column: "ID" },
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

  it("rejects unsupported profile and nested rule keys", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      owner: "mission-control",
      rules: [
        {
          id: "unsupported-nested-key",
          notes: "not part of the public profile contract",
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
          message: 'Unsupported validation profile key "notes".',
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
});
