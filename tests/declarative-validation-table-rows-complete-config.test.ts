import { describe, expect, it } from "vitest";
import {
  normalize, parse, parseValidationProfile, validateWithProfile,
  type JsonSafeValue, type ValidationProfile,
} from "../src/index.js";

const document = normalize(parse("| A | B |\n| --- | --- |\n| x |\n").parsed).document;
const input = (assertion: unknown, target = "table", version = "v2") => ({
  syntaxVersion: `markdown-engine.validation@${version}`,
  rules: [{ id: "rows.complete", select: { target }, assert: { tableRowsComplete: assertion } }],
});

describe("tableRowsComplete public profile contract", () => {
  it.each([false, null, 1, "true", {}, [], { enabled: true }])("rejects malformed payload %j before execution", (value) => {
    const parsed = parseValidationProfile(input(value) as JsonSafeValue);
    expect(parsed.profile).toBeUndefined();
    expect(parsed.diagnostics).toContainEqual(expect.objectContaining({
      code: "profile.config.invalidShape", message: "tableRowsComplete must be true.",
    }));
    const result = validateWithProfile(document, input(value) as ValidationProfile);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: "profile.config.invalidShape", message: "tableRowsComplete must be true.",
    }));
  });

  it.each(["document", "tableRow", "tableCell", "section"])("rejects incompatible %s selectors", (target) => {
    const value = input(true, target);
    // tableCell requires a column to reach selector/assertion compatibility.
    if (target === "tableCell") Object.assign(value.rules[0]!.select, { column: "A" });
    const parsed = parseValidationProfile(value as JsonSafeValue);
    expect(parsed.diagnostics).toEqual([]);
    for (const profile of [parsed.profile!, value as ValidationProfile]) {
      expect(validateWithProfile(document, profile).diagnostics).toContainEqual(expect.objectContaining({
        code: "profile.compile.incompatibleSelectorAssertion", ruleId: "rows.complete",
        message: 'Assertion "tableRowsComplete" is compatible only with table selectors.',
      }));
    }
  });

  it("preserves v1 admission boundaries", () => {
    expect(parseValidationProfile(input(true, "table", "v1") as JsonSafeValue).diagnostics).toContainEqual(expect.objectContaining({
      code: "profile.compile.unsupportedAssertion", message: 'Unsupported assertion "tableRowsComplete".',
    }));
    expect(validateWithProfile(document, input(true, "table", "v1") as ValidationProfile).diagnostics).toContainEqual(expect.objectContaining({
      code: "profile.config.unsupportedKey", message: 'Unsupported validation profile key "tableRowsComplete".',
    }));
  });

  it("works in grouped branches and applicability without new execution paths", () => {
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [{ id: "group", allOf: [{ select: { target: "table" }, assert: { tableRowsComplete: true } }] }, {
        id: "conditional", when: { select: { target: "table" }, assert: { tableRowsComplete: true } },
        select: { target: "document" }, assert: { text: { contains: "unreachable" } },
      }],
    });
    expect(result.valid).toBe(false);
    expect(result.ruleResults).toContainEqual(expect.objectContaining({ ruleId: "conditional", status: "skipped" }));
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ ruleId: "group", code: "profile.validation.groupRequirementFailed" }));
    expect(result.ruleResults).toContainEqual(expect.objectContaining({
      ruleId: "group", evaluation: expect.objectContaining({ branches: [expect.objectContaining({
        diagnostics: [expect.objectContaining({ code: "profile.validation.assertionFailed" })],
      })] }),
    }));
  });
});
