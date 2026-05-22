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
const columnCoverageSubsetFixturePath =
  "fixtures/declarative-validation/downstream/table-column-coverage-subset.md";
const columnCoverageSubsetProfilePath =
  "fixtures/declarative-validation/downstream/table-column-coverage-subset-profile.yaml";
const fixture = readFileSync(
  new URL(
    "../fixtures/declarative-validation/downstream/operational-design-spec.md",
    import.meta.url,
  ),
  "utf8",
);
const columnCoverageSubsetFixture = `# Functional Requirements

| ID | Statement |
| --- | --- |
| ODS-REQ-1 | The downstream profile SHALL trace source requirements. |
| ODS-REQ-2 | The downstream profile SHALL reject non-column mentions. |

# Traceability

ODS-REQ-2 appears in traceability narrative text for false-acceptance coverage.

| Requirement | Evidence |
| --- | --- |
| ODS-REQ-1 | Design record |
| ODS-REQ-2 | Test plan |
`;
const columnCoverageSubsetProfile = `syntaxVersion: markdown-engine.validation@v2
documentVersion: "1.0.0"
rules:
  - id: downstream.traceability.column-coverage
    select:
      target: document
    assert:
      tableColumnCoverage:
        source:
          section: Functional Requirements
          column: ID
          prefix: ODS-REQ
        target:
          section: Traceability
          tableHeader:
            - Requirement
            - Evidence
          column: Requirement
        require: everySourceId
`;
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

  it("covers the Conditional V2 table-column coverage downstream subset", () => {
    const { result: passResult } = validateMarkdownWithProfile(
      columnCoverageSubsetFixture,
      columnCoverageSubsetProfile,
      columnCoverageSubsetFixturePath,
      columnCoverageSubsetProfilePath,
    );

    expect(passResult.valid).toBe(true);
    expect(passResult.diagnostics).toEqual([]);
    expect(passResult.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      ruleCount: 1,
      evaluatedRuleCount: 1,
      skippedRuleCount: 0,
    });
    expect(passResult.ruleResults).toEqual([
      expect.objectContaining({
        ruleId: "downstream.traceability.column-coverage",
        status: "passed",
        passed: true,
        diagnostics: [],
        evaluation: {
          kind: "assertions",
          diagnostics: [],
        },
      }),
    ]);

    const falseAcceptanceFixture = columnCoverageSubsetFixture.replace(
      "| ODS-REQ-2 | Test plan |",
      "| Design note | ODS-REQ-2 appears in non-target evidence text |",
    );
    const { result: failResult } = validateMarkdownWithProfile(
      falseAcceptanceFixture,
      columnCoverageSubsetProfile,
      columnCoverageSubsetFixturePath,
      columnCoverageSubsetProfilePath,
    );

    expect(failResult.valid).toBe(false);
    expect(failResult.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.tableColumnCoverageIdMissing",
        ruleId: "downstream.traceability.column-coverage",
        message:
          'ID "ODS-REQ-2" must appear in target table column "Requirement" of section "Traceability".',
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 6 }),
        }),
      }),
    ]);
    expect(failResult.ruleResults).toEqual([
      expect.objectContaining({
        ruleId: "downstream.traceability.column-coverage",
        status: "failed",
        passed: false,
      }),
    ]);
  });
});

function validateFixture(markdown: string) {
  return validateMarkdownWithProfile(markdown, profileYaml, fixturePath, profilePath);
}

function validateMarkdownWithProfile(
  markdown: string,
  profileSource: string,
  markdownPath: string,
  validationProfilePath: string,
) {
  const profile = requireProfile(
    parseValidationProfile(profileSource, { path: validationProfilePath }),
  );
  const document = normalize(parse(markdown, { path: markdownPath }).parsed, {
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
