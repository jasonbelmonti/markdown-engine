import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  parseValidationProfile,
  validateWithProfile,
  type DeclarativeAssertion,
  type DeclarativeSelector,
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
const unsupportedAssertionProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "ids.unique",
      select: { target: "document" },
      assert: { ids: { unique: true } },
    },
  ],
} as const;
// @ts-expect-error Section selectors are reserved for a later parser slice.
const unsupportedSelector = { target: "section" } satisfies DeclarativeSelector;
// @ts-expect-error ID assertions are reserved for a later parser slice.
const unsupportedAssertion = { ids: { unique: true } } satisfies DeclarativeAssertion;

describe("declarative validation public contract scaffold", () => {
  it("exports the public profile parser and keeps validation execution scaffolded", () => {
    expect(parseValidationProfile).toEqual(expect.any(Function));
    expect(validateWithProfile).toEqual(expect.any(Function));
    expect(parseValidationProfile(profile)).toEqual({ profile, diagnostics: [] });
    expect(() => validateWithProfile(document, profile)).toThrow(
      "validateWithProfile is scaffolded",
    );
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

  it("classifies first-level assertion vocabulary errors as unsupported assertions", () => {
    expect(parseValidationProfile(unsupportedAssertionProfile)).toEqual({
      diagnostics: [
        {
          code: "profile.compile.unsupportedAssertion",
          message: 'Unsupported assertion "ids".',
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
});

void (undefined as unknown as CompiledDeclarativeValidationPlan);
void (undefined as unknown as DeclarativeValidationCompileResult);
void unsupportedSelector;
void unsupportedAssertion;
