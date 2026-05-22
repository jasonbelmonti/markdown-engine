import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type EngineDocument,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
import {
  groupRequirementFailedDiagnostic,
  noAlternativeMatchedDiagnostic,
} from "../src/declarative-validation/assertions/diagnostics.js";
import type {
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationAnyOfRuleV2,
} from "../src/declarative-validation/compiler/plan.js";

const fixturePath = "fixtures/declarative-validation/assertions/diagnostics.md";
const fixture = readFixture("diagnostics.md");
const profileText = readFixture("diagnostics-profile.yaml");

describe("declarative validation diagnostics", () => {
  it("emits deterministic source-targeted diagnostics for WP-4 assertion failures", () => {
    const result = validateWithProfile(normalizedFixtureDocument(), parsedProfile());

    expect(result.valid).toBe(false);
    expect(result.ruleResults.map((ruleResult) => ruleResult.ruleId)).toEqual([
      "a.empty-selection",
      "b.missing-column",
      "c.duplicate-id",
      "d.missing-reference",
      "e.source-targeted",
    ]);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.emptySelection",
        ruleId: "a.empty-selection",
        message: "Rule selector did not match any document targets.",
        severity: "error",
      },
      expect.objectContaining({
        code: "profile.validation.assertionFailed",
        ruleId: "b.missing-column",
        message: 'Selected table must include column "Owner".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 7 }),
        }),
      }),
      expect.objectContaining({
        code: "profile.validation.duplicateId",
        ruleId: "c.duplicate-id",
        message: 'ID "REQ-1" duplicates earlier ID "REQ-1".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 10 }),
        }),
      }),
      expect.objectContaining({
        code: "profile.validation.referenceMissing",
        ruleId: "d.missing-reference",
        message: 'ID "REQ-2" must appear in section "Verification".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 11 }),
        }),
      }),
      expect.objectContaining({
        code: "profile.validation.textMissing",
        ruleId: "e.source-targeted",
        message: 'Selected section text must contain "complete".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 17 }),
        }),
      }),
    ]);
  });

  it("omits unavailable source ranges instead of fabricating diagnostic locations", () => {
    const result = validateWithProfile(
      withoutSourceEvidence(normalizedFixtureDocument()),
      parsedProfile(),
    );

    expect(result.valid).toBe(false);
    expect(result.diagnostics.map((diagnostic) => diagnostic.ruleId)).toEqual([
      "a.empty-selection",
      "b.missing-column",
      "c.duplicate-id",
      "d.missing-reference",
      "e.source-targeted",
    ]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.sourceRange)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("keeps validation diagnostics and evidence diagnostics in the same order", () => {
    const result = validateWithProfile(normalizedFixtureDocument(), parsedProfile(), {
      includeEvidence: true,
    });

    expect(result.evidence?.diagnostics).toEqual(result.diagnostics);
    expect(result.evidence?.ruleResults).toEqual(result.ruleResults);
  });

  it("creates deterministic grouped summary diagnostics before runtime promotion uses them", () => {
    expect(noAlternativeMatchedDiagnostic(anyOfRule)).toEqual({
      code: "profile.validation.noAlternativeMatched",
      ruleId: "group.anyof",
      message: "No anyOf branch matched the grouped rule.",
      severity: "warning",
    });
    expect(groupRequirementFailedDiagnostic(allOfRule)).toEqual({
      code: "profile.validation.groupRequirementFailed",
      ruleId: "group.allof",
      message: "One or more allOf branches failed the grouped rule.",
      severity: "error",
    });
  });
});

const anyOfRule = {
  kind: "anyOf",
  syntaxVersion: "markdown-engine.validation@v2",
  ruleId: "group.anyof",
  severity: "warning",
  branches: [],
} satisfies CompiledDeclarativeValidationAnyOfRuleV2;

const allOfRule = {
  kind: "allOf",
  syntaxVersion: "markdown-engine.validation@v2",
  ruleId: "group.allof",
  severity: "error",
  branches: [],
} satisfies CompiledDeclarativeValidationAllOfRuleV2;

function normalizedFixtureDocument(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0",
  }).document;
}

function parsedProfile(): ValidationProfile {
  const result = parseValidationProfile(profileText);

  if (result.diagnostics.length > 0 || result.profile === undefined) {
    throw new Error(
      `Unexpected invalid diagnostics profile: ${result.diagnostics[0]?.message}`,
    );
  }

  return result.profile;
}

function withoutSourceEvidence(document: EngineDocument): EngineDocument {
  const copy = structuredClone(document);
  stripSourceEvidence(copy);
  return copy;
}

function stripSourceEvidence(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(stripSourceEvidence);
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  delete record.source;
  delete record.sourceRange;
  Object.values(record).forEach(stripSourceEvidence);
}

function readFixture(name: string): string {
  return readFileSync(
    new URL(`../fixtures/declarative-validation/assertions/${name}`, import.meta.url),
    "utf8",
  );
}
