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
