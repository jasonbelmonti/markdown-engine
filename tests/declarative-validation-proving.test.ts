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

const markdownPath = "fixtures/declarative-validation/proving/representative.md";
const profilePath = "fixtures/declarative-validation/proving/profile.yaml";
const markdown = readFileSync(
  new URL("../fixtures/declarative-validation/proving/representative.md", import.meta.url),
  "utf8",
);
const profileYaml = readFileSync(
  new URL("../fixtures/declarative-validation/proving/profile.yaml", import.meta.url),
  "utf8",
);

describe("declarative validation WP-1B proving path", () => {
  it("proves parse, compile, select, assert, diagnose, serialize, and evidence", () => {
    const profile = requireProfile(parseValidationProfile(profileYaml));
    const document = normalize(parse(markdown, { path: markdownPath }).parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, profile, { includeEvidence: true });
    const serialized = serialize(result, { pretty: true });

    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      ruleCount: 2,
    });
    expect(result.ruleResults.map((ruleResult) => ruleResult.ruleId)).toEqual([
      "objective.contains",
      "verification.diagnostic",
    ]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.textMissing",
        ruleId: "verification.diagnostic",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 14, column: 1 }),
        }),
      }),
    ]);
    expect(result.evidence).toMatchObject({
      engineVersion: "1.0.0",
      runtimeVersion: process.version,
      ruleResults: result.ruleResults,
      diagnostics: result.diagnostics,
    });
    expect(result.evidence?.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(serialized).toEqual(serialize(result, { pretty: true }));
    expect(JSON.parse(serialized)).toMatchObject({
      valid: false,
      profile: { ruleCount: 2 },
      evidence: {
        inputHash: result.evidence?.inputHash,
        profileHash: result.evidence?.profileHash,
      },
    });
  });
});

function requireProfile(result: ReturnType<typeof parseValidationProfile>): ValidationProfile {
  expect(result.diagnostics).toEqual([]);
  expect(result.profile).toBeDefined();

  return result.profile ?? missingProfile();
}

function missingProfile(): never {
  throw new Error(`Expected ${profilePath} to parse into a validation profile.`);
}
