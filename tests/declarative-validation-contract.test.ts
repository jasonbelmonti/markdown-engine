import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  parseValidationProfile,
  validateWithProfile,
  type DeclarativeAssertion,
  type DeclarativeIdSource,
  type DeclarativeSelector,
  type DeclarativeTableCellPredicate,
  type EngineDocument,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";
// @ts-expect-error Compiled rule plans must not be package-root exports.
import type { CompiledDeclarativeValidationPlan } from "@jasonbelmonti/markdown-engine";
// @ts-expect-error Compile results must remain internal to declarative validation.
import type { DeclarativeValidationCompileResult } from "@jasonbelmonti/markdown-engine";

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
const exactOneTextAssertion = {
  textOccurrenceCount: {
    text: "shall",
    count: 1,
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

void (undefined as unknown as CompiledDeclarativeValidationPlan);
void (undefined as unknown as DeclarativeValidationCompileResult);
void unsupportedSelector;
void publicAssertion;
void exactOneTextAssertion;
void removedTextAssertion;
void removedIdsColumnAssertion;
void removedTextColumnAssertion;
void removedOccurrenceColumnAssertion;
void removedFrontmatterSelector;
void idSource;
void tableCellPredicate;
