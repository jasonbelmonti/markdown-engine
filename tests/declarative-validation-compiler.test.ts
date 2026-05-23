import "./declarative-validation-compiler-assertions.js";
import "./declarative-validation-compiler-direct-profile.js";

import { describe, expect, it } from "vitest";

import type {
  DeclarativeAssertion,
  ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
import type { evaluateCompiledDeclarativeRule } from "../src/declarative-validation/assertions/index.js";
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

  it("compiles v2 flat rules into private evaluator-compatible plan variants", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "v2-flat-rule",
          severity: "info",
          when: {
            select: { target: "document" },
            assert: { exists: true },
          },
          select: { target: "document" },
          assert: { text: { contains: "Mission" } },
        },
        {
          id: "v2-id-count-plan",
          select: { target: "tableCell", column: "ID" },
          assert: {
            ids: {
              prefix: "OBJ",
              caseSensitive: false,
              minCount: 1,
              maxCount: 3,
            },
          },
        },
        {
          id: "v2-table-column-coverage-plan",
          select: { target: "document" },
          assert: {
            tableColumnCoverage: {
              source: {
                section: "5. Requirements",
                column: "ID",
                prefix: "REQ",
              },
              target: {
                section: "11. Requirements-to-Behavior Traceability",
                tableHeader: ["Requirement", "Behavior"],
                column: "Requirement",
              },
              require: "everySourceId",
            },
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.plan).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          kind: "flat",
          syntaxVersion: "markdown-engine.validation@v2",
          ruleId: "v2-flat-rule",
          severity: "info",
          applicability: {
            selector: { target: "document" },
            assertions: [{ kind: "exists" }],
          },
          selector: { target: "document" },
          assertions: [{ kind: "text", contains: "Mission" }],
        },
        {
          kind: "flat",
          syntaxVersion: "markdown-engine.validation@v2",
          ruleId: "v2-id-count-plan",
          severity: "error",
          selector: { target: "tableCell", column: "ID" },
          assertions: [
            {
              kind: "ids",
              caseSensitive: false,
              prefix: "OBJ",
              minCount: 1,
              maxCount: 3,
            },
          ],
        },
        {
          kind: "flat",
          syntaxVersion: "markdown-engine.validation@v2",
          ruleId: "v2-table-column-coverage-plan",
          severity: "error",
          selector: { target: "document" },
          assertions: [
            {
              kind: "tableColumnCoverage",
              source: {
                section: "5. Requirements",
                column: "ID",
                caseSensitive: true,
                prefix: "REQ",
              },
              target: {
                section: "11. Requirements-to-Behavior Traceability",
                tableHeader: ["Requirement", "Behavior"],
                column: "Requirement",
              },
              require: "everySourceId",
            },
          ],
        },
      ],
    });
    const compiledRule = result.plan?.rules[0];
    expect(compiledRule).toBeDefined();
    if (compiledRule === undefined) {
      throw new Error("Expected v2 flat rule to compile.");
    }

    const evaluatorRule: Parameters<typeof evaluateCompiledDeclarativeRule>[0] =
      compiledRule;
    expect(evaluatorRule).toBe(compiledRule);
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("compiles v2 grouped rules into private plan variants with stable branch order", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "v2-anyof-rule",
          severity: "warning",
          when: {
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
          anyOf: [
            {
              label: "document-branch",
              select: { target: "document" },
              assert: { exists: true },
            },
            {
              label: "text-branch",
              select: { target: "section", title: "Mission" },
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
        {
          id: "v2-allof-rule",
          when: {
            select: { target: "document" },
            assert: { exists: true },
          },
          allOf: [
            {
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Mission"] } },
            },
            {
              label: "table-branch",
              select: { target: "table", section: "Mission" },
              assert: { tableColumnsRequired: { columns: ["ID"] } },
            },
          ],
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.plan?.syntaxVersion).toBe("markdown-engine.validation@v2");
    expect(result.plan?.rules).toEqual([
      expect.objectContaining({
        kind: "anyOf",
        ruleId: "v2-anyof-rule",
        severity: "warning",
        applicability: {
          selector: { target: "document" },
          assertions: [{ kind: "text", contains: "Mission" }],
        },
        branches: [
          expect.objectContaining({
            branchIndex: 0,
            label: "document-branch",
            selector: { target: "document" },
            assertions: [{ kind: "exists" }],
          }),
          expect.objectContaining({
            branchIndex: 1,
            label: "text-branch",
            selector: { target: "section", title: "Mission" },
            assertions: [{ kind: "text", contains: "Mission" }],
          }),
        ],
      }),
      expect.objectContaining({
        kind: "allOf",
        ruleId: "v2-allof-rule",
        severity: "error",
        applicability: {
          selector: { target: "document" },
          assertions: [{ kind: "exists" }],
        },
        branches: [
          expect.objectContaining({
            branchIndex: 0,
            assertions: [
              { kind: "sectionsRequired", headings: ["Mission"], order: "none" },
            ],
          }),
          expect.objectContaining({
            branchIndex: 1,
            label: "table-branch",
            selector: { target: "table", section: "Mission" },
            assertions: [{ kind: "tableColumnsRequired", columns: ["ID"] }],
          }),
        ],
      }),
    ]);
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("rejects invalid v2 grouped constructs before plan creation", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "v2-empty-anyof",
          anyOf: [],
        },
        {
          id: "v2-ambiguous-group",
          select: { target: "document" },
          assert: { exists: true },
          allOf: [
            {
              select: { target: "document" },
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
      ],
    } as unknown as ValidationProfile);

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        {
          code: "profile.config.invalidShape",
          ruleId: "v2-empty-anyof",
          message: "Rule anyOf must be a non-empty array.",
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          ruleId: "v2-ambiguous-group",
          message:
            "V2 rule at index 1 must declare exactly one of select/assert, anyOf, or allOf.",
          severity: "error",
        },
      ]),
    );
  });

  it("rejects invalid v2 applicability constructs before plan creation", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "v2-when-not-object",
          when: "document",
          select: { target: "document" },
          assert: { exists: true },
        },
        {
          id: "v2-when-extra-key",
          when: {
            select: { target: "document" },
            assert: { exists: true },
            callback: "isApplicable",
          },
          select: { target: "document" },
          assert: { exists: true },
        },
      ],
    } as unknown as ValidationProfile);

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        {
          code: "profile.config.invalidShape",
          ruleId: "v2-when-not-object",
          message: "Rule when must be an object.",
          severity: "error",
        },
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "callback".',
          severity: "error",
        },
      ]),
    );
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
      assert: DeclarativeAssertion & Record<string, unknown>;
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
