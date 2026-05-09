import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
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

  it("does not silently pass compiled text predicates outside the evaluator proof path", () => {
    const sectionDocument = normalize(
      parse("# Objective\n\nalpha beta beta forbidden\n").parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;

    for (const assert of [
      { text: { containsExactlyOne: "beta" } },
      { text: { excludes: ["forbidden"] } },
    ] satisfies ValidationProfile["rules"][number]["assert"][]) {
      const result = validateWithProfile(sectionDocument, {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "text.unsupported-evaluator-path",
            select: { target: "section", title: "Objective" },
            assert,
          },
        ],
      });

      expect(result.valid).toBe(false);
      expect(result.diagnostics).toEqual([
        {
          code: "profile.validation.assertionUnsupported",
          ruleId: "text.unsupported-evaluator-path",
          message:
            'Assertion "text" is compiled but only text.contains without a column is implemented by the assertion evaluator yet.',
          severity: "error",
        },
      ]);
    }

    const tableDocument = normalize(
      parse([
        "# Status",
        "",
        "| Step | State |",
        "| --- | --- |",
        "| Ready elsewhere | blocked |",
      ].join("\n")).parsed,
      {
        documentVersion: "1.0.0",
      },
    ).document;
    const result = validateWithProfile(tableDocument, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "text.unsupported-evaluator-path",
          select: { target: "table" },
          assert: { text: { column: "State", contains: "ready" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.assertionUnsupported",
        ruleId: "text.unsupported-evaluator-path",
        message:
          'Assertion "text" is compiled but only text.contains without a column is implemented by the assertion evaluator yet.',
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

  it("treats unsupported evaluator paths as errors regardless of rule severity", () => {
    const document = normalize(parse("# Objective\n\nReady.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "section-order.unsupported-evaluator-path",
          severity: "warning",
          select: { target: "document" },
          assert: { sectionOrder: { headings: ["Objective"] } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.assertionUnsupported",
        ruleId: "section-order.unsupported-evaluator-path",
        message:
          'Assertion "sectionOrder" is compiled but not implemented by the assertion evaluator yet.',
        severity: "error",
      },
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "section-order.unsupported-evaluator-path",
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
