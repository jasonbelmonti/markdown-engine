import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type DeclarativeAssertion,
  type DeclarativeIdSource,
  type DeclarativeValidationResultV2,
  type DeclarativeValidationRuleResultV2,
  type DeclarativeSelector,
  type DeclarativeTableCellPredicate,
  type EngineDocument,
  type MarkdownDiagnostic,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
// @ts-expect-error Compiled rule plans must not be package-root exports.
import type { CompiledDeclarativeValidationPlan } from "@jasonbelmonti/markdown-engine";
// @ts-expect-error Compile results must remain internal to declarative validation.
import type { DeclarativeValidationCompileResult } from "@jasonbelmonti/markdown-engine";
import { createDeclarativeValidationResult } from "../src/declarative-validation/results/index.js";

const requiredScriptNames = [
  "test:validation:proving",
  "test:validation:contract",
  "test:validation:profile",
  "test:validation:compiler",
  "test:validation:selectors",
  "test:validation:assertions",
  "test:validation:diagnostics",
  "test:validation:cli",
  "test:validation:examples",
  "test:validation:repeatability",
  "test:validation:downstream",
  "audit:declarative-validation-boundary",
  "docs:declarative-validation-contract",
  "release:verify",
] as const;
const forbiddenPublicApiTerms = [
  "mdast",
  "unified",
] as const;
const packageJsonPath = join(process.cwd(), "package.json");
const packagedExampleFixturePaths = [
  "fixtures/declarative-validation/examples/operational-spec/fail.md",
  "fixtures/declarative-validation/examples/operational-spec/pass.md",
  "fixtures/declarative-validation/examples/operational-spec/profile.yaml",
  "fixtures/declarative-validation/examples/release-checklist/fail.md",
  "fixtures/declarative-validation/examples/release-checklist/pass.md",
  "fixtures/declarative-validation/examples/release-checklist/profile.yaml",
  "fixtures/declarative-validation/examples/requirements-traceability/fail.md",
  "fixtures/declarative-validation/examples/requirements-traceability/pass.md",
  "fixtures/declarative-validation/examples/requirements-traceability/profile.yaml",
] as const;
const document = {
  kind: "markdown-document",
  version: "1.0.0",
  children: [],
} satisfies EngineDocument;
const profile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [],
} satisfies ValidationProfile;
const v2Profile = {
  syntaxVersion: "markdown-engine.validation@v2",
  documentVersion: "1.0.0",
  rules: [],
} satisfies ValidationProfile;
const representativeV2ResultProfile = {
  syntaxVersion: "markdown-engine.validation@v2",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "mission.anyof.passed",
      anyOf: [
        {
          label: "table",
          select: { target: "table", section: "Mission" },
          assert: { tableColumnsRequired: { columns: ["Owner"] } },
        },
        {
          label: "explicit-none",
          select: { target: "section", title: "Mission" },
          assert: { text: { contains: "None" } },
        },
      ],
    },
    {
      id: "mission.anyof.failed",
      anyOf: [
        {
          label: "table",
          select: { target: "table", section: "Mission" },
          assert: { tableColumnsRequired: { columns: ["Owner"] } },
        },
        {
          label: "explicit-none",
          select: { target: "section", title: "Mission" },
          assert: { text: { contains: "None" } },
        },
      ],
    },
    {
      id: "mission.allof.failed",
      allOf: [
        {
          label: "heading",
          select: { target: "document" },
          assert: { sectionsRequired: { headings: ["Mission"] } },
        },
        {
          label: "table",
          select: { target: "table", section: "Mission" },
          assert: { tableColumnsRequired: { columns: ["Owner"] } },
        },
      ],
    },
    {
      id: "mission.when.deferred",
      select: { target: "section", title: "Mission" },
      assert: { exists: true },
    },
  ],
} satisfies ValidationProfile;
const supportedRuleProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "sections.required",
      severity: "error",
      select: { target: "document" },
      assert: {
        sectionsRequired: {
          headings: ["Objective", "Context"],
          order: "strict",
        },
      },
    },
  ],
} satisfies ValidationProfile;
const supportedRuleProfileYaml = `
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: sections.required
    severity: error
    select:
      target: document
    assert:
      sectionsRequired:
        headings:
          - Objective
          - Context
        order: strict
`;
const duplicateRuleProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "sections.required",
      select: { target: "document" },
      assert: { sectionsRequired: { headings: ["Objective"] } },
    },
    {
      id: "sections.required",
      select: { target: "document" },
      assert: { sectionsRequired: { headings: ["Context"] } },
    },
  ],
} satisfies ValidationProfile;
const missingSelectorTargetProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "sections.required",
      select: {},
      assert: { sectionsRequired: { headings: ["Objective"] } },
    },
  ],
} as const;
const unsupportedSelector = { target: "section" } satisfies DeclarativeSelector;
const publicAssertion = { ids: { unique: true } } satisfies DeclarativeAssertion;
const idCountAssertion = {
  ids: { minCount: 1, maxCount: 3 },
} satisfies DeclarativeAssertion;
const existsAssertion = { exists: true } satisfies DeclarativeAssertion;
const exactOneTextAssertion = {
  textOccurrenceCount: {
    text: "shall",
    count: 1,
  },
} satisfies DeclarativeAssertion;
const textLengthAssertion = {
  textLength: {
    min: 1,
    max: 140,
  },
} satisfies DeclarativeAssertion;
const removedTextAssertion = {
  text: {
    // @ts-expect-error containsExactlyOne was removed from public text assertion syntax.
    containsExactlyOne: "shall",
  },
} satisfies DeclarativeAssertion;
const removedIdsColumnAssertion = {
  ids: {
    unique: true,
    // @ts-expect-error ids.column was removed from public assertion syntax.
    column: "ID",
  },
} satisfies DeclarativeAssertion;
const removedTextColumnAssertion = {
  text: {
    contains: "shall",
    // @ts-expect-error text.column was removed from public assertion syntax.
    column: "Requirement statement",
  },
} satisfies DeclarativeAssertion;
const removedOccurrenceColumnAssertion = {
  textOccurrenceCount: {
    text: "shall",
    count: 1,
    // @ts-expect-error textOccurrenceCount.column was removed from public assertion syntax.
    column: "Requirement statement",
  },
} satisfies DeclarativeAssertion;
const idSource = { section: "Records", column: "ID" } satisfies DeclarativeIdSource;
const tableCellPredicate = {
  column: "Status",
  equals: "Open",
} satisfies DeclarativeTableCellPredicate;
const removedFrontmatterSelector = {
  // @ts-expect-error frontmatter selectors are deferred from v1.
  target: "frontmatter",
  field: "title",
} satisfies DeclarativeSelector;

describe("declarative validation public contract scaffold", () => {
  it("exports the public profile parser and validation execution entry point", () => {
    expect(parseValidationProfile).toEqual(expect.any(Function));
    expect(validateWithProfile).toEqual(expect.any(Function));
    expect(parseValidationProfile(profile)).toEqual({ profile, diagnostics: [] });
    expect(validateWithProfile(document, supportedRuleProfile)).toMatchObject({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        ruleCount: 1,
      },
      ruleResults: [
        {
          ruleId: "sections.required",
          passed: false,
        },
      ],
      valid: false,
    });
  });

  it("admits v2 direct profiles through validation materialization", () => {
    expect(validateWithProfile(document, v2Profile)).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 0,
        evaluatedRuleCount: 0,
        skippedRuleCount: 0,
      },
    });
  });

  it("returns the v2 flat-rule API result shell without changing assertion semantics", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(document, {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "mission.contains",
            severity: "info",
            select: { target: "document" },
            assert: { text: { contains: "Mission" } },
          },
        ],
      }),
    ).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "mission.contains",
          status: "passed",
          passed: true,
          diagnostics: [],
          evaluation: {
            kind: "assertions",
            diagnostics: [],
          },
        },
      ],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 1,
        skippedRuleCount: 0,
      },
    });
  });

  it("evaluates v2 anyOf grouped rules through the public result contract", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.grouped",
          anyOf: [
            {
              label: "document-text",
              select: { target: "document" },
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.grouped",
        status: "passed",
        passed: true,
        diagnostics: [],
        evaluation: {
          kind: "anyOf",
          selectedBranch: {
            branchIndex: 0,
            label: "document-text",
          },
          branches: [
            {
              branchIndex: 0,
              label: "document-text",
              status: "passed",
              diagnostics: [],
            },
          ],
        },
      },
    ]);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      ruleCount: 1,
      evaluatedRuleCount: 1,
      skippedRuleCount: 0,
    });
  });

  it("returns source-grounded v2 flat-rule diagnostics with failed status", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.missing-text",
          select: { target: "section", title: "Mission" },
          assert: { text: { contains: "Complete" } },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      ruleCount: 1,
      evaluatedRuleCount: 1,
      skippedRuleCount: 0,
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "profile.validation.textMissing",
        ruleId: "mission.missing-text",
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({ line: 1, column: 1 }),
        }),
      }),
    ]);
    expect(result.ruleResults).toEqual([
      {
        ruleId: "mission.missing-text",
        status: "failed",
        passed: false,
        diagnostics: result.diagnostics,
        evaluation: {
          kind: "assertions",
          diagnostics: result.diagnostics,
        },
      },
    ]);
  });

  it("records deterministic v2 flat-rule evidence for passing assertions", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "mission.contains",
          severity: "info",
          select: { target: "document" },
          assert: { text: { contains: "Mission" } },
        },
      ],
    } satisfies ValidationProfile;
    const firstResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });
    const secondResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });

    expect(secondResult).toEqual(firstResult);
    expect(firstResult.evidence).toMatchObject({
      engineVersion: "2.0.0",
      runtimeVersion: process.version,
      ruleResults: firstResult.ruleResults,
      diagnostics: firstResult.diagnostics,
    });
    expect(firstResult.evidence?.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstResult.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstResult.evidence?.ruleResults).toEqual([
      {
        ruleId: "mission.contains",
        status: "passed",
        passed: true,
        diagnostics: [],
        evaluation: {
          kind: "assertions",
          diagnostics: [],
        },
      },
    ]);
  });

  it("records deterministic v2 flat-rule evidence for failing assertions", () => {
    const document = normalize(parse("# Mission\n\nReady for launch.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const result = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "mission.missing-text",
            select: { target: "section", title: "Mission" },
            assert: { text: { contains: "Complete" } },
          },
        ],
      },
      { includeEvidence: true },
    );

    expect(result.evidence).toMatchObject({
      engineVersion: "2.0.0",
      runtimeVersion: process.version,
      ruleResults: result.ruleResults,
      diagnostics: result.diagnostics,
    });
    expect(result.evidence?.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.evidence?.profileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.evidence?.ruleResults).toEqual([
      {
        ruleId: "mission.missing-text",
        status: "failed",
        passed: false,
        diagnostics: result.diagnostics,
        evaluation: {
          kind: "assertions",
          diagnostics: result.diagnostics,
        },
      },
    ]);
  });

  it("preserves representative v2 branch result structures through API and evidence cloning", () => {
    const sourceRuleResults = representativeV2RuleResults();
    const expectedRuleResults = representativeV2RuleResults();
    const sourceDiagnostics = [
      ...sourceRuleResults[1]!.diagnostics,
      ...sourceRuleResults[2]!.diagnostics,
    ];
    const result = expectV2Result(
      createDeclarativeValidationResult({
        document,
        profile: representativeV2ResultProfile,
        ruleResults: sourceRuleResults,
        diagnostics: sourceDiagnostics,
        options: { includeEvidence: true },
      }),
    );

    const sourceAnyOfEvaluation = sourceRuleResults[0]!.evaluation;
    if (sourceAnyOfEvaluation.kind !== "anyOf") {
      throw new Error("Expected representative anyOf result.");
    }
    sourceAnyOfEvaluation.branches[0]!.diagnostics[0]!.message =
      "mutated nested branch diagnostic";
    sourceRuleResults[3]!.when!.diagnostics[0]!.message =
      "mutated applicability diagnostic";

    expect(result.valid).toBe(false);
    expect(result.profile).toEqual({
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
      ruleCount: 4,
      evaluatedRuleCount: 3,
      skippedRuleCount: 1,
    });
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "profile.validation.noAlternativeMatched",
      "profile.validation.groupRequirementFailed",
    ]);
    expect(result.ruleResults).toEqual(expectedRuleResults);
    expect(result.evidence?.ruleResults).toEqual(result.ruleResults);
    expect(result.evidence?.diagnostics).toEqual(result.diagnostics);
  });

  it("keeps the v1 API rule result shape unchanged", () => {
    const result = validateWithProfile(document, supportedRuleProfile);
    const resultWithEvidence = validateWithProfile(document, supportedRuleProfile, {
      includeEvidence: true,
    });

    expect(result).toMatchObject({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        ruleCount: 1,
      },
      ruleResults: [
        {
          ruleId: "sections.required",
          passed: false,
        },
      ],
      valid: false,
    });
    expect(result.profile).not.toHaveProperty("evaluatedRuleCount");
    expect(result.profile).not.toHaveProperty("skippedRuleCount");
    expect(result.ruleResults[0]).not.toHaveProperty("status");
    expect(result.ruleResults[0]).not.toHaveProperty("evaluation");
    expect(resultWithEvidence.evidence?.ruleResults).toEqual(
      resultWithEvidence.ruleResults,
    );
    expect(resultWithEvidence.evidence?.ruleResults[0]).not.toHaveProperty(
      "status",
    );
    expect(resultWithEvidence.evidence?.ruleResults[0]).not.toHaveProperty(
      "evaluation",
    );
  });

  it("preserves v2 direct profile metadata when rule-level when reaches deferred runtime support", () => {
    expect(
      validateWithProfile(document, {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "future-when",
            when: {
              select: { target: "document" },
              assert: { exists: true },
            },
            select: { target: "document" },
            assert: { exists: true },
          },
        ],
      } as unknown as ValidationProfile),
    ).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "profile.compile.unsupportedApplicability",
          ruleId: "future-when",
          message:
            "Rule-level when is supported by schema and compiler only; validation runtime applicability evaluation is not implemented.",
          severity: "error",
        },
      ],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 1,
        evaluatedRuleCount: 0,
        skippedRuleCount: 0,
      },
    });
  });

  it("preserves v2 direct profile metadata when JSON-safe closure fails", () => {
    let rulesAccessorRead = false;
    const profileWithAccessorRules = {
      syntaxVersion: "markdown-engine.validation@v2",
      documentVersion: "1.0.0",
    };
    Object.defineProperty(profileWithAccessorRules, "rules", {
      enumerable: true,
      get() {
        rulesAccessorRead = true;
        throw new Error("profile rules accessor must not execute");
      },
    });

    expect(
      validateWithProfile(
        document,
        profileWithAccessorRules as unknown as ValidationProfile,
      ),
    ).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message: "Profile.rules must contain only JSON-safe data properties.",
          severity: "error",
        },
      ],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v2",
        documentVersion: "1.0.0",
        ruleCount: 0,
        evaluatedRuleCount: 0,
        skippedRuleCount: 0,
      },
    });
    expect(rulesAccessorRead).toBe(false);
  });

  it("rejects profile documentVersion mismatches before rule evaluation", () => {
    expect(
      validateWithProfile(document, {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "0.0.0",
        rules: [
          {
            id: "version.mismatch",
            select: { target: "document" },
            assert: { text: { contains: "markdown" } },
          },
        ],
      }),
    ).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "profile.config.documentVersionMismatch",
          message:
            'Profile documentVersion "0.0.0" does not match document version "1.0.0".',
          severity: "error",
        },
      ],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "0.0.0",
        ruleCount: 1,
      },
    });
  });

  it("resolves omitted profile documentVersion to the supplied document version for evidence", () => {
    const omittedVersionResult = validateWithProfile(
      document,
      {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [],
      },
      { includeEvidence: true },
    );
    const explicitVersionResult = validateWithProfile(document, profile, {
      includeEvidence: true,
    });

    expect(omittedVersionResult).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [],
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        ruleCount: 0,
      },
    });
    expect(omittedVersionResult.evidence?.profileHash).toEqual(
      explicitVersionResult.evidence?.profileHash,
    );
  });

  it("materializes a supported non-empty rule from object input", () => {
    expect(parseValidationProfile(supportedRuleProfile)).toEqual({
      profile: supportedRuleProfile,
      diagnostics: [],
    });
  });

  it("materializes a supported non-empty rule from YAML input", () => {
    expect(parseValidationProfile(supportedRuleProfileYaml)).toEqual({
      profile: supportedRuleProfile,
      diagnostics: [],
    });
  });

  it("returns profile YAML diagnostics for invalid YAML input", () => {
    expect(parseValidationProfile("syntaxVersion: [")).toEqual({
      diagnostics: [
        expect.objectContaining({
          code: "profile.config.invalidYaml",
          severity: "error",
        }),
      ],
    });
  });

  it("rejects duplicate rule IDs before validation profile compilation", () => {
    expect(parseValidationProfile(duplicateRuleProfile)).toEqual({
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message:
            'Profile rule at index 1 duplicates rule id "sections.required".',
          severity: "error",
        },
      ],
    });
  });

  it("classifies missing selector targets as invalid profile shape", () => {
    expect(parseValidationProfile(missingSelectorTargetProfile)).toEqual({
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message: "Rule select.target must be provided.",
          severity: "error",
        },
      ],
    });
  });

  it("keeps compiled plans and raw parser internals out of the public API barrel", () => {
    const publicApiSources = [
      readFileSync("src/api/contracts.ts", "utf8"),
      readFileSync("src/api/declarative-validation.ts", "utf8"),
    ].join("\n");

    for (const forbiddenTerm of forbiddenPublicApiTerms) {
      expect(publicApiSources).not.toContain(forbiddenTerm);
    }
  });

  it("accepts the public text assertion shape", () => {
    const result = parseValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "text-contract",
          select: {
            target: "tableCell",
            tableHeader: ["ID", "Requirement statement"],
            column: "Requirement statement",
          },
          assert: {
            text: {
              contains: "shall",
              excludes: ["should", "may"],
            },
          },
        },
      ],
    });

    expect(result).toEqual({
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [
          {
            id: "text-contract",
            select: {
              target: "tableCell",
              tableHeader: ["ID", "Requirement statement"],
              column: "Requirement statement",
            },
            assert: {
              text: {
                contains: "shall",
                excludes: ["should", "may"],
              },
            },
          },
        ],
      },
      diagnostics: [],
    });
  });

  it("accepts the public exists assertion spelling", () => {
    const existsProfile = {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "link-exists-contract",
          select: {
            target: "link",
            text: "rollback guide",
            url: "./rollback-guide.md",
          },
          assert: {
            exists: true,
          },
        },
      ],
    } satisfies ValidationProfile;

    expect(parseValidationProfile(existsProfile)).toEqual({
      profile: existsProfile,
      diagnostics: [],
    });
  });

  it("accepts the public exact-one text occurrence spelling", () => {
    const exactOneProfile = {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "text-exact-one-contract",
          select: {
            target: "tableCell",
            tableHeader: ["ID", "Requirement statement"],
            column: "Requirement statement",
          },
          assert: {
            textOccurrenceCount: {
              text: "shall",
              count: 1,
            },
          },
        },
      ],
    } satisfies ValidationProfile;

    expect(parseValidationProfile(exactOneProfile)).toEqual({
      profile: exactOneProfile,
      diagnostics: [],
    });
  });

  it("accepts the public text length assertion spelling", () => {
    const textLengthProfile = {
      syntaxVersion: "markdown-engine.validation@v1",
      documentVersion: "1.0.0",
      rules: [
        {
          id: "text-length-contract",
          select: {
            target: "textSpan",
            nodeType: "paragraph",
          },
          assert: {
            textLength: {
              min: 1,
              max: 140,
            },
          },
        },
      ],
    } satisfies ValidationProfile;

    expect(parseValidationProfile(textLengthProfile)).toEqual({
      profile: textLengthProfile,
      diagnostics: [],
    });
  });

  it("rejects the removed exact-one text spelling from parsed profiles", () => {
    expect(
      parseValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "removed-exact-one-text-contract",
            select: { target: "document" },
            assert: {
              text: {
                containsExactlyOne: "shall",
              },
            },
          },
        ],
      }),
    ).toEqual({
      diagnostics: [
        {
          code: "profile.config.unsupportedKey",
          message: 'Unsupported validation profile key "containsExactlyOne".',
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "text must include contains or a non-empty excludes array.",
          severity: "error",
        },
        {
          code: "profile.config.invalidShape",
          message: "Rule assert must include at least one supported assertion.",
          severity: "error",
        },
      ],
    });
  });

  it("registers required declarative validation gate script names", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const releaseVerifyScript = packageJson.scripts?.["release:verify"] ?? "";

    for (const scriptName of requiredScriptNames) {
      expect(packageJson.scripts).toHaveProperty(scriptName);
    }

    for (const scriptName of requiredScriptNames) {
      const script = packageJson.scripts?.[scriptName] ?? "";
      if (script.includes("scripts/gate-placeholder.mjs")) {
        expect(releaseVerifyScript).not.toContain(scriptName);
      }
    }
  });

  it("packages the documented declarative validation example fixtures", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      files?: readonly string[];
    };

    expect(packageJson.files).toContain("docs/contracts");
    expect(packageJson.files).toContain("fixtures/declarative-validation/examples");

    for (const fixturePath of packagedExampleFixturePaths) {
      expect(readFileSync(fixturePath, "utf8").length).toBeGreaterThan(0);
    }
  });
});

function expectV2Result(
  result: ReturnType<typeof createDeclarativeValidationResult>,
): DeclarativeValidationResultV2 {
  if (result.profile.syntaxVersion !== "markdown-engine.validation@v2") {
    throw new Error("Expected a v2 declarative validation result.");
  }

  return result as DeclarativeValidationResultV2;
}

function representativeV2RuleResults(): DeclarativeValidationRuleResultV2[] {
  const noAlternativeDiagnostic = diagnostic(
    "profile.validation.noAlternativeMatched",
    "mission.anyof.failed",
    "No anyOf branch matched the grouped rule.",
  );
  const groupRequirementDiagnostic = diagnostic(
    "profile.validation.groupRequirementFailed",
    "mission.allof.failed",
    "One or more allOf branches failed the grouped rule.",
  );

  return [
    {
      ruleId: "mission.anyof.passed",
      status: "passed",
      passed: true,
      diagnostics: [],
      evaluation: {
        kind: "anyOf",
        selectedBranch: { branchIndex: 1, label: "explicit-none" },
        branches: [
          {
            branchIndex: 0,
            label: "table",
            status: "failed",
            diagnostics: [
              diagnostic(
                "profile.validation.emptySelection",
                "mission.anyof.passed",
                "Rule selector did not match any document targets.",
              ),
            ],
          },
          {
            branchIndex: 1,
            label: "explicit-none",
            status: "passed",
            diagnostics: [],
          },
        ],
      },
    },
    {
      ruleId: "mission.anyof.failed",
      status: "failed",
      passed: false,
      diagnostics: [noAlternativeDiagnostic],
      evaluation: {
        kind: "anyOf",
        branches: [
          {
            branchIndex: 0,
            label: "table",
            status: "failed",
            diagnostics: [
              diagnostic(
                "profile.validation.emptySelection",
                "mission.anyof.failed",
                "Rule selector did not match any document targets.",
              ),
            ],
          },
          {
            branchIndex: 1,
            label: "explicit-none",
            status: "failed",
            diagnostics: [
              diagnostic(
                "profile.validation.textMissing",
                "mission.anyof.failed",
                'Selected section text must contain "None".',
              ),
            ],
          },
        ],
      },
    },
    {
      ruleId: "mission.allof.failed",
      status: "failed",
      passed: false,
      diagnostics: [groupRequirementDiagnostic],
      evaluation: {
        kind: "allOf",
        branches: [
          {
            branchIndex: 0,
            label: "heading",
            status: "passed",
            diagnostics: [],
          },
          {
            branchIndex: 1,
            label: "table",
            status: "failed",
            diagnostics: [
              diagnostic(
                "profile.validation.assertionFailed",
                "mission.allof.failed",
                'Selected table must include column "Owner".',
              ),
            ],
          },
        ],
      },
    },
    {
      ruleId: "mission.when.deferred",
      status: "skipped",
      passed: true,
      diagnostics: [],
      when: {
        status: "notMatched",
        diagnostics: [
          diagnostic(
            "profile.validation.emptySelection",
            "mission.when.deferred",
            "Rule selector did not match any document targets.",
          ),
        ],
      },
      evaluation: {
        kind: "skipped",
        reason: "whenNotMatched",
      },
    },
  ];
}

function diagnostic(
  code: string,
  ruleId: string,
  message: string,
): MarkdownDiagnostic {
  return {
    code,
    ruleId,
    message,
    severity: "error",
  };
}

void (undefined as unknown as CompiledDeclarativeValidationPlan);
void (undefined as unknown as DeclarativeValidationCompileResult);
void unsupportedSelector;
void publicAssertion;
void idCountAssertion;
void existsAssertion;
void exactOneTextAssertion;
void textLengthAssertion;
void removedTextAssertion;
void removedIdsColumnAssertion;
void removedTextColumnAssertion;
void removedOccurrenceColumnAssertion;
void removedFrontmatterSelector;
void idSource;
void tableCellPredicate;
