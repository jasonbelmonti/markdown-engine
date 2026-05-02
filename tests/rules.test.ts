import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { normalize, parse, serialize, validate } from "@jasonbelmonti/markdown-engine";
import type { ValidationConfig } from "@jasonbelmonti/markdown-engine";

import { snapshotRoot, stableJson } from "./support/parser-fixture-support.js";

const compliantMarkdown = `---
title: Rule-compliant document
owner: markdown-engine
---

# Mission Brief

\`\`\`ts
export const phase = "wp-4";
\`\`\`

[Safe](https://example.com)
`;
const diagnosticsFixturePath = "fixtures/rules/wp-4-diagnostics.md";
const diagnosticsMarkdown = readFileSync(
  new URL("../fixtures/rules/wp-4-diagnostics.md", import.meta.url),
  "utf8",
);
const fiveFamilyConfig = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
    "headings.required": {
      headings: ["Mission Brief"],
    },
    "codeFences.languages": {
      allowed: ["ts"],
      requireLanguage: true,
    },
    "links.allowedSchemes": {
      schemes: ["https"],
    },
    "rawHtml.policy": {
      policy: "deny",
    },
  },
} satisfies ValidationConfig;

describe("WP-4 deterministic rule families", () => {
  it("VAL-4: evaluates five supported deterministic rule families through the public API", () => {
    const document = normalize(parse(compliantMarkdown).parsed).document;
    const validationResult = validate(document, fiveFamilyConfig);

    expect(validationResult).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "frontmatter.required",
          passed: true,
          diagnostics: [],
        },
        {
          ruleId: "headings.required",
          passed: true,
          diagnostics: [],
        },
        {
          ruleId: "codeFences.languages",
          passed: true,
          diagnostics: [],
        },
        {
          ruleId: "links.allowedSchemes",
          passed: true,
          diagnostics: [],
        },
        {
          ruleId: "rawHtml.policy",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("VAL-4: ignores indented code blocks for code fence language rules", () => {
    const document = normalize(parse("    const x = 1;\n").parsed).document;
    const validationResult = validate(document, {
      rules: {
        "codeFences.languages": {
          requireLanguage: true,
        },
      },
    });

    expect(validationResult).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "codeFences.languages",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("VAL-4: applies code fence language rules inside Markdown containers", () => {
    const fenced = normalize(
      parse("> ```js\n> const x = 1;\n> ```\n").parsed,
    ).document;
    const indented = normalize(parse(">     const x = 1;\n").parsed).document;
    const config = {
      rules: {
        "codeFences.languages": {
          allowed: ["ts"],
          requireLanguage: true,
        },
      },
    } satisfies ValidationConfig;

    expect(validate(fenced, config)).toMatchObject({
      valid: false,
      diagnostics: [
        {
          code: "codeFences.languages.unsupported",
          ruleId: "codeFences.languages",
          severity: "error",
        },
      ],
    });
    expect(validate(indented, config)).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "codeFences.languages",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("VAL-4/VAL-6: emits source-located diagnostics for deterministic rule failures", async () => {
    const document = normalize(
      parse(diagnosticsMarkdown, { path: diagnosticsFixturePath }).parsed,
    ).document;
    const validationResult = validate(document, {
      rules: {
        ...fiveFamilyConfig.rules,
        "headings.required": {
          headings: ["Mission Brief", "Validation Gates"],
        },
        "semantic.summaryQuality": {
          threshold: "high",
        },
      },
    });

    expect(validationResult.valid).toBe(false);
    expect(validationResult.ruleResults.map((result) => result.ruleId)).toEqual([
      "frontmatter.required",
      "headings.required",
      "codeFences.languages",
      "links.allowedSchemes",
      "rawHtml.policy",
    ]);
    expect(
      validationResult.diagnostics.map((diagnostic) => [
        diagnostic.code,
        diagnostic.ruleId,
        diagnostic.severity,
        diagnostic.sourceRange !== undefined,
      ]),
    ).toEqual([
      ["config.rule.unsupported", "semantic.summaryQuality", "error", false],
      ["headings.required.missing", "headings.required", "error", false],
      ["codeFences.languages.missing", "codeFences.languages", "error", true],
      [
        "codeFences.languages.unsupported",
        "codeFences.languages",
        "error",
        true,
      ],
      ["links.allowedSchemes.disallowed", "links.allowedSchemes", "error", true],
      ["rawHtml.policy.denied", "rawHtml.policy", "error", true],
    ]);
    await expect(stableJson(validationResult)).toMatchFileSnapshot(
      join(snapshotRoot, "diagnostics/wp-4-rules.json"),
    );
  });

  it("VAL-4: rejects invalid supported rule configuration without rule execution", () => {
    const document = normalize(parse(compliantMarkdown).parsed).document;

    expect(
      validate(document, {
        rules: {
          "rawHtml.policy": {
            policy: "sanitize",
          },
        },
      }),
    ).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "config.rule.invalid",
          ruleId: "rawHtml.policy",
          message: "Rule rawHtml.policy policy must be allow, warn, or deny.",
          severity: "error",
        },
      ],
      ruleResults: [],
    });
  });

  it("VAL-6: serializes raw HTML warning diagnostics without invalidating the result", () => {
    const document = normalize(
      parse("<div>Review me</div>\n").parsed,
    ).document;
    const validationResult = validate(document, {
      rules: {
        "rawHtml.policy": {
          policy: "warn",
        },
      },
    });

    expect(validationResult.valid).toBe(true);
    expect(validationResult.ruleResults).toMatchObject([
      {
        ruleId: "rawHtml.policy",
        passed: false,
        diagnostics: [
          {
            code: "rawHtml.policy.warned",
            ruleId: "rawHtml.policy",
            message: "Raw HTML is present.",
            severity: "warning",
          },
        ],
      },
    ]);
    expect(serialize(validationResult)).toContain("rawHtml.policy.warned");
  });
});
