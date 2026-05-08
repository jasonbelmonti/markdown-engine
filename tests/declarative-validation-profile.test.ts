import { describe, expect, it } from "vitest";

import { parseValidationProfile } from "@jasonbelmonti/markdown-engine";

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
            'Profile syntaxVersion must be "markdown-engine.validation@v1".',
        },
      ],
    },
    {
      name: "unsupported syntaxVersion",
      input: {
        syntaxVersion: "markdown-engine.validation@v2",
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
            'Profile syntaxVersion must be "markdown-engine.validation@v1".',
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
      name: "text assertion without effective predicate",
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
          code: "profile.config.invalidShape",
          message:
            "text must include contains, containsExactlyOne, or a non-empty excludes array.",
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
});
