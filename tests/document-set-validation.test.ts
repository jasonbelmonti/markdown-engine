import { describe, expect, it } from "vitest";

import {
  serialize,
  validateDocumentSet,
  type ValidateDocumentSetEntry,
  type ValidateDocumentSetResult,
  type ValidationProfile,
} from "../src/index.js";

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
  it("returns a valid aggregate for multiple passing entries", () => {
    const result = validateDocumentSet(
      [
        {
          path: "01-pass.md",
          markdown: "# Objective\n\nReady.\n",
          profile: objectiveProfile,
        },
        {
          path: "02-pass-yaml-profile.md",
          markdown: "# Objective\n\nStill ready.\n",
          profile: objectiveProfileYaml,
          profilePath: "profiles/objective.yaml",
        },
      ],
      {
        preserveSourceLocations: true,
      },
    ) satisfies ValidateDocumentSetResult;

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.entries.map((entry) => entry.path)).toEqual([
      "01-pass.md",
      "02-pass-yaml-profile.md",
    ]);
    expect(result.entries).toEqual([
      expect.objectContaining({
        path: "01-pass.md",
        diagnostics: [],
        parseDiagnostics: [],
        normalizationDiagnostics: [],
        profileDiagnostics: [],
        validationDiagnostics: [],
        validationResult: expect.objectContaining({
          valid: true,
          diagnostics: [],
          ruleResults: [
            {
              ruleId: "objective.required",
              passed: true,
              diagnostics: [],
            },
          ],
        }),
      }),
      expect.objectContaining({
        path: "02-pass-yaml-profile.md",
        profilePath: "profiles/objective.yaml",
        diagnostics: [],
        parseDiagnostics: [],
        normalizationDiagnostics: [],
        profileDiagnostics: [],
        validationDiagnostics: [],
        validationResult: expect.objectContaining({
          valid: true,
          diagnostics: [],
          ruleResults: [
            {
              ruleId: "objective.required",
              passed: true,
              diagnostics: [],
            },
          ],
        }),
      }),
    ]);
  });

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
      {
        code: "profile.config.invalidYaml",
        message:
          "Flow sequence in block collection must be sufficiently indented and end with a ]",
        severity: "error",
        sourceRange: {
          start: {
            line: 1,
            column: 17,
            offset: 16,
          },
          end: {
            line: 1,
            column: 17,
            offset: 16,
          },
        },
      },
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
