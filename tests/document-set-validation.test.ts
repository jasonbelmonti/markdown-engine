import { describe, expect, it } from "vitest";

import {
  serialize,
  validateDocumentSet,
  type ValidateDocumentSetEntry,
  type ValidateDocumentSetResult,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

const objectiveProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "objective.required",
      select: { target: "document" },
      assert: { sectionsRequired: { headings: ["Objective"] } },
    },
  ],
} satisfies ValidationProfile;

const objectiveProfileYaml = `
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: objective.required
    select:
      target: document
    assert:
      sectionsRequired:
        headings:
          - Objective
`;

const entries = [
  {
    path: "01-pass.md",
    markdown: "# Objective\n\nReady.\n",
    profile: objectiveProfile,
  },
  {
    path: "02-fail.md",
    markdown: "# Context\n\nNo objective section.\n",
    profile: objectiveProfile,
  },
  {
    path: "03-frontmatter-error.md",
    markdown: "---\ntitle: [\n---\n# Objective\n\nReady.\n",
    profile: objectiveProfile,
  },
  {
    path: "04-profile-error.md",
    markdown: "# Objective\n\nReady.\n",
    profile: "syntaxVersion: [",
    profilePath: "profiles/broken.yaml",
  },
  {
    path: "05-later-pass.md",
    markdown: "# Objective\n\nStill processed.\n",
    profile: objectiveProfileYaml,
    profilePath: "profiles/objective.yaml",
  },
] satisfies readonly ValidateDocumentSetEntry[];

describe("document set validation", () => {
  it("returns ordered aggregate results for mixed document and profile outcomes", () => {
    const result = validateDocumentSet(entries, {
      preserveSourceLocations: false,
    }) satisfies ValidateDocumentSetResult;

    expect(result.entries.map((entry) => entry.path)).toEqual([
      "01-pass.md",
      "02-fail.md",
      "03-frontmatter-error.md",
      "04-profile-error.md",
      "05-later-pass.md",
    ]);
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(
      result.entries.flatMap((entry) => entry.diagnostics),
    );

    expect(result.entries[0]).toMatchObject({
      path: "01-pass.md",
      parseDiagnostics: [],
      normalizationDiagnostics: [],
      profileDiagnostics: [],
      validationDiagnostics: [],
      validationResult: {
        valid: true,
      },
    });
    expect(result.entries[1].validationResult?.valid).toBe(false);
    expect(result.entries[1].validationDiagnostics).toEqual([
      expect.objectContaining({
        ruleId: "objective.required",
        severity: "error",
      }),
    ]);
    expect(result.entries[2].parseDiagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
      }),
    ]);
    expect(result.entries[2].normalizationDiagnostics).toEqual(
      result.entries[2].parseDiagnostics,
    );
    expect(result.entries[2].validationResult?.valid).toBe(true);
    expect(result.entries[3]).toMatchObject({
      path: "04-profile-error.md",
      profilePath: "profiles/broken.yaml",
      parseDiagnostics: [],
      normalizationDiagnostics: [],
      validationDiagnostics: [],
    });
    expect(result.entries[3].profileDiagnostics).toEqual([
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        severity: "error",
      }),
    ]);
    expect(result.entries[3].validationResult).toBeUndefined();
    expect(result.entries[4].validationResult?.valid).toBe(true);
  });

  it("serializes document set validation results through the public serializer", () => {
    const result = validateDocumentSet([entries[0]], {
      preserveSourceLocations: false,
    });

    expect(JSON.parse(serialize(result))).toMatchObject({
      valid: true,
      diagnostics: [],
      entries: [
        {
          path: "01-pass.md",
          diagnostics: [],
          validationResult: {
            valid: true,
          },
        },
      ],
    });
  });
});
