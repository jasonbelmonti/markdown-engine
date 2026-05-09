import { describe, expect, it } from "vitest";

import type { ValidationProfile } from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

describe("declarative validation compiler proof", () => {
  it("compiles supported profiles into private data-only rule records", () => {
    const result = compileValidationProfile(supportedProfile);

    expect(result.diagnostics).toEqual([]);
    expect(result.plan).toMatchObject({
      rules: [
        {
          ruleId: "objective.contains",
          severity: "error",
          selector: { target: "section", title: "Objective" },
          assertions: [{ kind: "text", contains: "architecture viable" }],
        },
        {
          ruleId: "document.required-sections",
          selector: { target: "document" },
          assertions: [
            {
              kind: "sectionsRequired",
              headings: ["Objective", "Verification"],
              order: "strict",
            },
            {
              kind: "sectionOrder",
              headings: ["Objective", "Verification"],
            },
          ],
        },
        {
          ruleId: "table.columns",
          selector: { target: "table", header: ["Step", "State"] },
          assertions: [{ kind: "tableColumnsRequired", columns: ["Owner"] }],
        },
        {
          ruleId: "table.ids",
          selector: { target: "tableRow", tableHeader: ["ID"], where: { column: "State", equals: "ready" } },
          assertions: [
            {
              kind: "ids",
              unique: true,
              caseSensitive: false,
              column: "ID",
              prefix: "REQ",
            },
          ],
        },
        {
          ruleId: "references.required",
          selector: { target: "document" },
          assertions: [
            {
              kind: "references",
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          ],
        },
        {
          ruleId: "occurrences",
          selector: { target: "textSpan", nodeType: "paragraph" },
          assertions: [{ kind: "textOccurrenceCount", text: "MUST", count: 1 }],
        },
        {
          ruleId: "frontmatter.required",
          selector: { target: "frontmatter" },
          assertions: [{ kind: "frontmatterRequired", fields: ["title", "owner"] }],
        },
      ],
    });
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("rejects incompatible selector and assertion pairs before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "section.requires.sections",
          select: { target: "section", title: "Objective" },
          assert: { sectionsRequired: { headings: ["Objective"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "section.requires.sections",
        message: 'Assertion "sectionsRequired" is compatible only with document selectors.',
        severity: "error",
      },
    ]);
  });

  it("rejects column-scoped assertions outside table selector targets", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "section.column-text",
          select: { target: "section", title: "Objective" },
          assert: { text: { column: "State", contains: "ready" } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "section.column-text",
        message:
          'Assertion "text" with a column option is compatible only with table or tableRow selectors.',
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
        message:
          "text must include contains, containsExactlyOne, or a non-empty excludes array.",
        severity: "error",
      },
    ]);
  });

  it("rejects ids assertions without explicit unique true before execution", () => {
    const invalidIdAssertions = [
      { ids: {}, select: { target: "document" } },
      { ids: { unique: false }, select: { target: "document" } },
      { ids: { column: "ID" }, select: { target: "tableRow" } },
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
        assert: { text: { column: "", contains: "ready" } },
        message: "column must be a non-empty string when provided.",
        select: { target: "table" },
      },
      {
        assert: { ids: { unique: true, column: "" } },
        message: "column must be a non-empty string when provided.",
        select: { target: "tableRow" },
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

  it("rejects direct typed assertions with parser-invalid empty string arrays before execution", () => {
    const invalidArrayAssertions = [
      {
        assert: { sectionsRequired: { headings: [] } },
        message:
          "sectionsRequired.headings must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { sectionOrder: { headings: [] } },
        message: "sectionOrder.headings must be an array of non-empty strings.",
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
        select: { target: "frontmatter" },
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

const supportedProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "objective.contains",
      select: { target: "section", title: "Objective" },
      assert: { text: { contains: "architecture viable" } },
    },
    {
      id: "document.required-sections",
      select: { target: "document" },
      assert: {
        sectionsRequired: {
          headings: ["Objective", "Verification"],
          order: "strict",
        },
        sectionOrder: {
          headings: ["Objective", "Verification"],
        },
      },
    },
    {
      id: "table.columns",
      select: { target: "table", header: ["Step", "State"] },
      assert: { tableColumnsRequired: { columns: ["Owner"] } },
    },
    {
      id: "table.ids",
      select: {
        target: "tableRow",
        tableHeader: ["ID"],
        where: { column: "State", equals: "ready" },
      },
      assert: {
        ids: {
          column: "ID",
          prefix: "REQ",
          unique: true,
          caseSensitive: false,
        },
      },
    },
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
    {
      id: "occurrences",
      select: { target: "textSpan", nodeType: "paragraph" },
      assert: { textOccurrenceCount: { text: "MUST", count: 1 } },
    },
    {
      id: "frontmatter.required",
      select: { target: "frontmatter" },
      assert: { frontmatterRequired: { fields: ["title", "owner"] } },
    },
  ],
} satisfies ValidationProfile;

function containsFunction(value: unknown): boolean {
  if (typeof value === "function") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsFunction(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).some((item) => containsFunction(item));
  }

  return false;
}
