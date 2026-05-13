import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  serialize,
  validateWithProfile,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

const fixturePath =
  "fixtures/declarative-validation/downstream/operational-design-spec.md";
const profilePath =
  "fixtures/declarative-validation/downstream/operational-design-spec-profile.yaml";
const fixture = readFileSync(
  new URL(
    "../fixtures/declarative-validation/downstream/operational-design-spec.md",
    import.meta.url,
  ),
  "utf8",
);
const profileYaml = readFileSync(
  new URL(
    "../fixtures/declarative-validation/downstream/operational-design-spec-profile.yaml",
    import.meta.url,
  ),
  "utf8",
);

const expectedRuleIds = [
  "constraints.text",
  "decision.ids.unique",
  "decision.log.columns",
  "frontmatter.required",
  "objective.text",
  "requirements.ids.unique",
  "requirements.table.columns",
  "requirements.text.heading-policy",
  "sections.required",
  "traceability.requirements",
  "traceability.validation",
  "validation.ids.unique",
  "validation.matrix.columns",
].sort();

describe("declarative validation downstream ODS structural exercise", () => {
  it("validates an operational-design-spec fixture with generic declarative syntax", () => {
    const { result } = validateFixture(fixture);

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.ruleResults.map((ruleResult) => ruleResult.ruleId)).toEqual(
      expectedRuleIds,
    );
    expect(result.ruleResults.every((ruleResult) => ruleResult.passed)).toBe(true);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      ruleCount: expectedRuleIds.length,
    });
    expect(result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: result.ruleResults,
    });
    expect(result.evidence?.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.evidence?.profileHash).toMatch(/^[0-9a-f]{64}$/);
    expect(serialize(result, { pretty: true })).toEqual(
      serialize(result, { pretty: true }),
    );
  });

  it("emits source-targeted diagnostics when ODS traceability is incomplete", () => {
    const incompleteFixture = fixture.replace(
      "ODS-REQ-3 appears in the validation matrix through ODS-VAL-3.",
      "ODS-VAL-3 records a validation row without a requirement reference.",
    );
    const { result } = validateFixture(incompleteFixture);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "traceability.requirements",
        message: 'ID "ODS-REQ-3" must appear in section "Traceability".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 24 }),
        }),
      }),
    ]);
  });
});

function validateFixture(markdown: string) {
  const profile = requireProfile(parseValidationProfile(profileYaml, { path: profilePath }));
  const document = normalize(parse(markdown, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0",
  }).document;

  return {
    profile,
    result: validateWithProfile(document, profile, { includeEvidence: true }),
  };
}

function requireProfile(result: ReturnType<typeof parseValidationProfile>): ValidationProfile {
  expect(result.diagnostics).toEqual([]);
  expect(result.profile).toBeDefined();

  return result.profile ?? missingProfile();
}

function missingProfile(): never {
  throw new Error(`Expected ${profilePath} to parse into a validation profile.`);
}
