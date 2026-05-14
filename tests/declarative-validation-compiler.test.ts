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
          ruleId: "rollback-link.exists",
          severity: "error",
          selector: {
            target: "link",
            section: "Escalation",
            text: "rollback guide",
            url: "./rollback-guide.md",
          },
          assertions: [{ kind: "exists" }],
        },
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
            target: "tableCell",
            tableHeader: ["ID"],
            column: "ID",
            rowWhere: { column: "State", equals: "ready" },
          },
          assertions: [
            {
              kind: "ids",
              unique: true,
              caseSensitive: false,
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
          ruleId: "text.length",
          selector: { target: "textSpan", nodeType: "paragraph" },
          assertions: [{ kind: "textLength", min: 5, max: 120 }],
        },
        {
          ruleId: "frontmatter.required",
          selector: { target: "document" },
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

  it("rejects removed assertion-level column modifiers before execution", () => {
    const removedColumnAssertions = [
      {
        id: "section.column-text",
        assert: { text: { column: "State", contains: "ready" } },
      },
      {
        id: "section.column-ids",
        assert: { ids: { unique: true, column: "ID" } },
      },
      {
        id: "section.column-occurrences",
        assert: {
          textOccurrenceCount: { text: "ready", count: 1, column: "State" },
        },
      },
    ] satisfies {
      id: string;
      assert: ValidationProfile["rules"][number]["assert"] & Record<string, unknown>;
    }[];

    for (const { id, assert } of removedColumnAssertions) {
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
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "column".',
          severity: "error",
        },
      ]);
    }
  });

  it("keeps frontmatterRequired document-scoped before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "frontmatter.allowed",
          select: { target: "document" },
          assert: { frontmatterRequired: { fields: ["title"] } },
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.plan?.rules).toHaveLength(1);
  });

  it("rejects deferred frontmatter selectors before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "frontmatter.deferred",
          select: {
            target: "frontmatter",
          } as unknown as ValidationProfile["rules"][number]["select"],
          assert: { frontmatterRequired: { fields: ["title"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.unsupportedSelector",
        message: 'Unsupported selector target "frontmatter".',
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
        target: "tableCell",
        tableHeader: ["ID"],
        column: "ID",
        rowWhere: { column: "State", equals: "ready" },
      },
      assert: {
        ids: {
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
      id: "text.length",
      select: { target: "textSpan", nodeType: "paragraph" },
      assert: { textLength: { min: 5, max: 120 } },
    },
    {
      id: "frontmatter.required",
      select: { target: "document" },
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
