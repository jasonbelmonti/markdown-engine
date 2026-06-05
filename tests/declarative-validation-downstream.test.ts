import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import {
  normalize,
  parse,
  parseValidationProfile,
  serialize,
  validateWithProfile,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

interface ConditionalHarnessSuite {
  harness: ConditionalHarnessMetadata;
  cases: ConditionalHarnessCase[];
}

interface ConditionalHarnessMetadata {
  id: string;
  issue: string;
  directory: string;
  scope: string;
  naming: {
    caseNamePattern: string;
    ruleIdPattern: string;
  };
  expectedOutput: string[];
  includes: string[];
  excludes: string[];
}

interface ConditionalHarnessCase {
  name: string;
  contract: string;
  markdown: string;
  profile: Parameters<typeof parseValidationProfile>[0];
  expected: {
    valid: boolean;
    profile: ExpectedProfileCounts;
    diagnostics?: ExpectedDiagnostic[];
    ruleResults: ExpectedRuleResult[];
  };
}

interface ExpectedProfileCounts {
  ruleCount: number;
  evaluatedRuleCount: number;
  skippedRuleCount: number;
}

interface ExpectedRuleResult {
  ruleId: string;
  status: "passed" | "failed" | "skipped";
  passed: boolean;
  diagnostics?: ExpectedDiagnostic[];
  evaluation: ExpectedEvaluation;
}

type ExpectedEvaluation = ExpectedAssertionsEvaluation | ExpectedGroupEvaluation;

interface ExpectedAssertionsEvaluation {
  kind: "assertions";
  diagnostics?: ExpectedDiagnostic[];
}

interface ExpectedGroupEvaluation {
  kind: "anyOf" | "allOf";
  selectedBranch?: ExpectedBranchReference;
  branches: ExpectedBranchResult[];
}

interface ExpectedBranchReference {
  branchIndex: number;
  label?: string;
}

interface ExpectedBranchResult extends ExpectedBranchReference {
  status: "passed" | "failed";
  diagnostics?: ExpectedDiagnostic[];
}

interface ExpectedDiagnostic {
  code: string;
  ruleId: string;
  message: string;
  sourceLine?: number;
}

const fixturePath =
  "fixtures/declarative-validation/downstream/operational-design-spec.md";
const profilePath =
  "fixtures/declarative-validation/downstream/operational-design-spec-profile.yaml";
const conditionalsHarnessPath =
  "fixtures/declarative-validation/conditionals/harness.yaml";
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
const conditionalHarness = parseYaml(
  readFileSync(
    new URL("../fixtures/declarative-validation/conditionals/harness.yaml", import.meta.url),
    "utf8",
  ),
) as ConditionalHarnessSuite;

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

const expectedConditionalHarnessCaseNames = [
  "l8a-table-column-coverage-pass",
  "l8a-table-column-coverage-fail",
  "l8b-section4-table-pass",
  "l8b-section4-none-pass",
  "l8b-section4-neither-fail",
  "l8c-section15-table-pass",
  "l8c-section15-na-pass",
  "l8c-section15-neither-fail",
  "l8d-r1-traceability-standard-pass",
  "l8d-r1-traceability-replacement-pass",
  "l8d-r1-traceability-neither-fail",
  "l8e-mixed-id-count-pass",
  "l8e-mixed-id-count-fail",
  "l8e-section11-target-column-pass",
  "l8e-section11-target-column-fail",
  "l8e-section17-replacement-target-column-pass",
  "l8e-section17-replacement-target-column-fail",
  "l8f-section4-decoy-none-fail",
  "l8f-section15-decoy-rationale-fail",
  "l8f-r1-traceability-dual-decoy-fail",
  "l8f-mixed-id-count-decoy-fail",
];

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

describe("conditional v2 downstream fixture harness", () => {
  it("documents fixture naming and expected-output conventions", () => {
    expect(conditionalHarness.harness).toEqual({
      id: "conditional-v2-downstream-fixture-harness",
      issue: "BEL-1115",
      directory: "fixtures/declarative-validation/conditionals",
      scope: "incremental-downstream-fixtures",
      naming: {
        caseNamePattern: "l8<leaf>-<capability>-<expectation>",
        ruleIdPattern: "conditionals.downstream.<capability>.<expectation>",
      },
      expectedOutput: [
        "expected.valid records aggregate validation outcome.",
        "expected.profile records v2 rule, evaluated, and skipped counts.",
        "expected.diagnostics records top-level diagnostics in deterministic order.",
        "expected.ruleResults records rule status, compatibility passed value, diagnostics, and evaluation shape.",
      ],
      includes: [
        "A representative Conditional V2 downstream subset that proves durable fixture loading and false-acceptance protection.",
        "Section 4 table-or-none fixtures for a valid constraints table branch, an authorized explicit none/N/A branch, and a neither-branch failure.",
        "Section 15 table-or-N/A fixtures for a valid controls table branch, an authorized N/A rationale branch, and a neither-branch failure.",
        "R1 standard-or-replacement traceability fixtures for a valid standard matrix branch, a valid replacement matrix branch, and a neither-branch failure.",
        "Mixed ID-family count fixtures for prefix-filtered downstream ID count pass/fail behavior.",
        "Section 11 and Section 17 target-column coverage fixtures for standard and replacement matrix downstream scenarios.",
        "L8-F false-acceptance negatives for decoy none/N/A text, decoy rationale text, dual target-column decoys, and mixed ID-family decoys.",
      ],
      excludes: [
        "Non-R1 applicability skip fixture breadth.",
        "Release-readiness and rollback content.",
      ],
    });
    expect(conditionalHarness.cases.map((fixtureCase) => fixtureCase.name)).toEqual(
      expectedConditionalHarnessCaseNames,
    );
  });

  for (const fixtureCase of conditionalHarness.cases) {
    it(`${fixtureCase.name}: ${fixtureCase.contract}`, () => {
      const { result } = validateConditionalHarnessCase(fixtureCase);

      expect(fixtureCase.name).toMatch(/^l8[a-z]-[a-z0-9]+(?:-[a-z0-9]+)*-(pass|fail)$/);
      expect(fixtureCase.expected.ruleResults.map(({ ruleId }) => ruleId)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^conditionals\.downstream\.[a-z0-9.-]+\.(pass|fail)$/),
        ]),
      );
      expect(result.valid).toBe(fixtureCase.expected.valid);
      expect(result.diagnostics).toEqual(
        expectedDiagnostics(fixtureCase.expected.diagnostics ?? []),
      );
      expect(result.profile).toEqual({
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ...fixtureCase.expected.profile,
      });
      expect(result.ruleResults).toEqual(
        fixtureCase.expected.ruleResults.map(expectedRuleResult),
      );
    });
  }
});

function validateFixture(markdown: string) {
  return validateMarkdownWithProfile(markdown, profileYaml, fixturePath, profilePath);
}

function validateConditionalHarnessCase(fixtureCase: ConditionalHarnessCase) {
  return validateMarkdownWithProfile(
    fixtureCase.markdown,
    fixtureCase.profile,
    `fixtures/declarative-validation/conditionals/${fixtureCase.name}.md`,
    `${conditionalsHarnessPath}#${fixtureCase.name}`,
  );
}

function validateMarkdownWithProfile(
  markdown: string,
  profileSource: Parameters<typeof parseValidationProfile>[0],
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

function expectedRuleResult(expected: ExpectedRuleResult): unknown {
  return {
    ruleId: expected.ruleId,
    status: expected.status,
    passed: expected.passed,
    diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
    evaluation: expectedEvaluation(expected.evaluation),
  };
}

function expectedEvaluation(expected: ExpectedEvaluation): unknown {
  if (expected.kind === "assertions") {
    return {
      kind: expected.kind,
      diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
    };
  }

  return {
    kind: expected.kind,
    ...(expected.selectedBranch !== undefined
      ? { selectedBranch: expected.selectedBranch }
      : {}),
    branches: expected.branches.map(expectedBranchResult),
  };
}

function expectedBranchResult(expected: ExpectedBranchResult): unknown {
  return {
    branchIndex: expected.branchIndex,
    ...(expected.label !== undefined ? { label: expected.label } : {}),
    status: expected.status,
    diagnostics: expectedDiagnostics(expected.diagnostics ?? []),
  };
}

function expectedDiagnostics(diagnostics: ExpectedDiagnostic[]): unknown[] {
  return diagnostics.map((diagnostic) => {
    const expected = {
      code: diagnostic.code,
      ruleId: diagnostic.ruleId,
      message: diagnostic.message,
      severity: "error",
    };

    return diagnostic.sourceLine === undefined
      ? expected
      : expect.objectContaining({
          ...expected,
          sourceRange: expect.objectContaining({
            start: expect.objectContaining({ line: diagnostic.sourceLine }),
          }),
        });
  });
}
