import { describe, expect, it } from "vitest";

import { loadValidationConfig } from "../src/config/index.js";

describe("loadValidationConfig", () => {
  it.each([
    ["omitted config", undefined],
    ["empty config", {}],
    ["missing rules", { documentVersion: "1.0.0" }],
  ])("defaults %s to no rules and no diagnostics", (_label, config) => {
    expect(loadValidationConfig(config)).toEqual({
      rules: [],
      diagnostics: [],
    });
  });

  it.each([
    ["null", null],
    ["array", []],
    ["string", "invalid"],
    ["number", 1],
  ])("rejects non-object top-level config values: %s", (_label, config) => {
    expect(loadValidationConfig(config)).toEqual({
      rules: [],
      diagnostics: [
        {
          code: "config.invalid",
          message: "Validation config must be an object.",
          severity: "error",
        },
      ],
    });
  });

  it.each([
    ["null", null],
    ["array", []],
    ["string", "invalid"],
    ["number", 1],
  ])("rejects non-object rules values: %s", (_label, rules) => {
    expect(loadValidationConfig({ rules })).toEqual({
      rules: [],
      diagnostics: [
        {
          code: "config.rules.invalid",
          message: "Validation config rules must be an object.",
          severity: "error",
        },
      ],
    });
  });

  it("loads supported rules and reports unsupported or invalid rule entries", () => {
    expect(
      loadValidationConfig({
        rules: {
          "frontmatter.required": {
            fields: ["title"],
            severity: "warning",
          },
          "semantic.summaryQuality": {
            threshold: "high",
          },
          "rawHtml.policy": {
            policy: "sanitize",
          },
        },
      }),
    ).toEqual({
      rules: [
        {
          ruleId: "frontmatter.required",
          fields: ["title"],
          severity: "warning",
        },
      ],
      diagnostics: [
        {
          code: "config.rule.unsupported",
          ruleId: "semantic.summaryQuality",
          message: 'Unsupported validation rule "semantic.summaryQuality".',
          severity: "error",
        },
        {
          code: "config.rule.invalid",
          ruleId: "rawHtml.policy",
          message: "Rule rawHtml.policy policy must be allow, warn, or deny.",
          severity: "error",
        },
      ],
    });
  });
});
