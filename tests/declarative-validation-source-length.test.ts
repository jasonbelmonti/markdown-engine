import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  parseValidationProfile,
  validateWithProfile,
  type ValidationProfile,
} from "../src/index.js";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

const documentSelector = { target: "document" } as const;

describe("declarative validation sourceLength", () => {
  it("admits valid v2 YAML bounds and rejects sourceLength in v1", () => {
    const v2 = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: source.minimum
    select:
      target: document
    assert:
      sourceLength:
        min: 10
  - id: source.maximum
    select:
      target: document
    assert:
      sourceLength:
        max: 100
  - id: source.range
    select:
      target: document
    assert:
      sourceLength:
        min: 10
        max: 100
`);

    expect(v2.diagnostics).toEqual([]);
    expect(v2.profile?.rules).toHaveLength(3);

    const v1 = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: source.maximum
    select:
      target: document
    assert:
      sourceLength:
        max: 100
`);

    expect(v1.profile).toBeUndefined();
    expect(v1.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "profile.compile.unsupportedAssertion",
        message: 'Unsupported assertion "sourceLength".',
      }),
    );

    const directV1 = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "source.direct-v1",
          select: documentSelector,
          assert: { sourceLength: { max: 100 } },
        },
      ],
    });
    expect(directV1.plan).toBeUndefined();
    expect(directV1.diagnostics).toContainEqual(
      expect.objectContaining({ code: "profile.config.unsupportedKey" }),
    );
  });

  it.each([
    ["{}", "sourceLength must include min, max, or both."],
    ["min: -1", "sourceLength.min must be a non-negative integer when provided."],
    ["max: 2.5", "sourceLength.max must be a non-negative integer when provided."],
    [
      "min: 10\n        max: 3",
      "sourceLength.min must be less than or equal to sourceLength.max.",
    ],
    [
      "min: 1\n        unit: words",
      'Unsupported validation profile key "unit".',
    ],
  ])("rejects invalid v2 YAML bounds: %s", (sourceLength, message) => {
    const result = parseValidationProfile(`
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: source.invalid
    select:
      target: document
    assert:
      sourceLength:
        ${sourceLength}
`);

    expect(result.profile).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ message }),
    );
  });

  it("compiles a private document-only sourceLength assertion", () => {
    const profile = sourceLengthProfile({ min: 5, max: 50 });
    const result = compileValidationProfile(profile);

    expect(result.diagnostics).toEqual([]);
    expect(result.plan?.rules[0]).toMatchObject({
      selector: documentSelector,
      assertions: [{ kind: "sourceLength", min: 5, max: 50 }],
    });

    const incompatible = compileValidationProfile({
      ...profile,
      rules: [
        {
          id: "source.section",
          select: { target: "section", title: "Mission" },
          assert: { sourceLength: { max: 50 } },
        },
      ],
    });

    expect(incompatible.plan).toBeUndefined();
    expect(incompatible.diagnostics).toContainEqual({
      code: "profile.compile.incompatibleSelectorAssertion",
      message:
        'Assertion "sourceLength" is compatible only with document selectors.',
      ruleId: "source.section",
      severity: "error",
    });
  });

  it("counts the complete source with JavaScript string length semantics", () => {
    const source =
      "---\r\ntitle: 🚀\r\n---\r\n\r\n# Mission\r\n\r\nReady.\r\n";
    const document = normalize(parse(source).parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      validateWithProfile(
        document,
        sourceLengthProfile({ min: source.length, max: source.length }),
        { sourceText: source },
      ),
    ).toMatchObject({ valid: true, diagnostics: [] });

    expect(
      validateWithProfile(
        document,
        sourceLengthProfile({ max: source.length - 1 }),
        { sourceText: source },
      ).diagnostics,
    ).toEqual([
      {
        code: "profile.validation.assertionFailed",
        message: `Document source length must be at most ${source.length - 1}; found ${source.length}.`,
        ruleId: "document.source-length",
        severity: "error",
      },
    ]);
  });

  it("fails closed with error severity when complete source context is unavailable", () => {
    const source = "# Mission\n\nReady.\n";
    const document = normalize(parse(source).parsed).document;
    const profile = {
      ...sourceLengthProfile({ max: 100 }),
      rules: [
        {
          id: "document.source-length",
          severity: "warning",
          select: documentSelector,
          assert: { sourceLength: { max: 100 } },
        },
      ],
    } satisfies ValidationProfile;
    const result = validateWithProfile(document, profile);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual([
      {
        code: "profile.validation.sourceUnavailable",
        message: "Complete Markdown source is required to evaluate sourceLength.",
        ruleId: "document.source-length",
        severity: "error",
      },
    ]);
  });

  it("threads source context through grouped rules and fails grouped evaluation closed", () => {
    const source = "# Mission\n\nReady.\n";
    const document = normalize(parse(source).parsed).document;
    const profile = {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "document.group",
          severity: "warning",
          allOf: [
            {
              label: "source-budget",
              select: documentSelector,
              assert: { sourceLength: { max: source.length } },
            },
            {
              label: "mission-text",
              select: documentSelector,
              assert: { text: { contains: "Mission" } },
            },
          ],
        },
      ],
    } satisfies ValidationProfile;

    expect(
      validateWithProfile(document, profile, { sourceText: source }).valid,
    ).toBe(true);

    const missing = validateWithProfile(document, profile);
    expect(missing.valid).toBe(false);
    expect(missing.ruleResults[0]).toMatchObject({
      status: "failed",
      diagnostics: [
        {
          code: "profile.validation.sourceUnavailable",
          severity: "error",
        },
      ],
      evaluation: {
        kind: "allOf",
        branches: [
          {
            label: "source-budget",
            status: "failed",
          },
          {
            label: "mission-text",
            status: "passed",
          },
        ],
      },
    });
  });

  it("evaluates sourceLength in when and does not require source for skipped assertions", () => {
    const source = "# Mission\n\nReady.\n";
    const document = normalize(parse(source).parsed).document;
    const sourceWhenProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "document.when-source",
          when: {
            select: documentSelector,
            assert: { sourceLength: { max: source.length } },
          },
          select: documentSelector,
          assert: { text: { contains: "Mission" } },
        },
      ],
    } satisfies ValidationProfile;

    expect(
      validateWithProfile(document, sourceWhenProfile, { sourceText: source })
        .valid,
    ).toBe(true);

    const unavailableWhen = validateWithProfile(document, sourceWhenProfile);
    expect(unavailableWhen.valid).toBe(false);
    expect(unavailableWhen.ruleResults[0]).toMatchObject({
      status: "failed",
      diagnostics: [
        {
          code: "profile.validation.sourceUnavailable",
          severity: "error",
        },
      ],
    });

    const skipped = validateWithProfile(document, {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "document.skipped-source",
          when: {
            select: { target: "section", title: "Absent" },
            assert: { exists: true },
          },
          select: documentSelector,
          assert: { sourceLength: { max: 100 } },
        },
      ],
    });

    expect(skipped).toMatchObject({
      valid: true,
      diagnostics: [],
      ruleResults: [{ status: "skipped" }],
    });
  });

  it("exposes and hashes source measurement only for profiles using sourceLength", () => {
    const shortSource = "# Mission\n\nReady.\n";
    const longSource = `${shortSource}\n\n`;
    const shortDocument = normalize(parse(shortSource).parsed, {
      preserveSourceLocations: false,
    }).document;
    const longDocument = normalize(parse(longSource).parsed, {
      preserveSourceLocations: false,
    }).document;

    expect(longDocument).toEqual(shortDocument);

    const profile = sourceLengthProfile({ max: 100 });
    const shortResult = validateWithProfile(shortDocument, profile, {
      includeEvidence: true,
      sourceText: shortSource,
    });
    const longResult = validateWithProfile(longDocument, profile, {
      includeEvidence: true,
      sourceText: longSource,
    });

    expect(shortResult.evidence?.sourceLength).toBe(shortSource.length);
    expect(longResult.evidence?.sourceLength).toBe(longSource.length);
    expect(longResult.evidence?.inputHash).not.toBe(
      shortResult.evidence?.inputHash,
    );
    expect(longResult.evidence?.profileHash).toBe(
      shortResult.evidence?.profileHash,
    );

    const unaffectedProfile = {
      syntaxVersion: "markdown-engine.validation@v2",
      rules: [
        {
          id: "document.text",
          select: documentSelector,
          assert: { text: { contains: "Mission" } },
        },
      ],
    } satisfies ValidationProfile;
    const withoutSource = validateWithProfile(shortDocument, unaffectedProfile, {
      includeEvidence: true,
    });
    const withSource = validateWithProfile(shortDocument, unaffectedProfile, {
      includeEvidence: true,
      sourceText: shortSource,
    });

    expect(withSource).toEqual(withoutSource);
    expect(withSource.evidence).not.toHaveProperty("sourceLength");
  });
});

function sourceLengthProfile(
  bounds: { min?: number; max?: number },
): ValidationProfile {
  return {
    syntaxVersion: "markdown-engine.validation@v2",
    rules: [
      {
        id: "document.source-length",
        select: documentSelector,
        assert: { sourceLength: bounds },
      },
    ],
  };
}
