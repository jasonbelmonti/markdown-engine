import "./declarative-validation-compiler-assertions.js";
import "./declarative-validation-compiler-direct-profile.js";

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
          ],
        },
        {
          ruleId: "table.columns",
          selector: { target: "table", header: ["Step", "State"] },
          assertions: [{ kind: "tableColumnsRequired", columns: ["Owner"] }],
        },
        {
          ruleId: "table.ids",
          selector: {
            target: "tableRow",
            tableHeader: ["ID"],
            where: { column: "State", equals: "ready" },
          },
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
          assertions: [
            { kind: "frontmatterRequired", fields: ["title", "owner"] },
          ],
        },
      ],
    });
    expect(result.plan).not.toHaveProperty("profile");
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
    const invalidColumnAssertions = [
      {
        id: "section.column-text",
        assert: { text: { column: "State", contains: "ready" } },
        message:
          'Assertion "text" with a column option is compatible only with table or tableRow selectors.',
      },
      {
        id: "section.column-ids",
        assert: { ids: { unique: true, column: "ID" } },
        message:
          'Assertion "ids" with a column option is compatible only with table or tableRow selectors.',
      },
      {
        id: "section.column-occurrences",
        assert: {
          textOccurrenceCount: { text: "ready", count: 1, column: "State" },
        },
        message:
          'Assertion "textOccurrenceCount" with a column option is compatible only with table or tableRow selectors.',
      },
    ] satisfies {
      id: string;
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
    }[];

    for (const { id, assert, message } of invalidColumnAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id,
            select: { target: "section", title: "Objective" },
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.compile.incompatibleSelectorAssertion",
          ruleId: id,
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("applies frontmatter selector compatibility before execution", () => {
    for (const select of [
      { target: "document" },
      { target: "frontmatter" },
    ] satisfies ValidationProfile["rules"][number]["select"][]) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "frontmatter.allowed",
            select,
            assert: { frontmatterRequired: { fields: ["title"] } },
          },
        ],
      });

      expect(result.diagnostics).toEqual([]);
      expect(result.plan?.rules).toHaveLength(1);
    }

    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "frontmatter.filtered",
          select: { target: "frontmatter", field: "title" },
          assert: { frontmatterRequired: { fields: ["title"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "frontmatter.filtered",
        message:
          'Assertion "frontmatterRequired" is compatible only with document selectors or unfiltered frontmatter selectors.',
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
