import { describe, expect, it } from "vitest";

import {
  documentQueries,
  EngineCompatibilityError,
  normalize,
  parse,
  parseValidationProfile,
  serialize,
  validate,
  validateAnnotations,
  validateDocumentSet,
  validateWithProfile,
  type EngineAnnotation,
  type EngineNodeTarget,
  type SourceRange,
  type ValidateDocumentSetEntry,
  type ValidateDocumentSetResult,
  type ValidationConfig,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

const markdown = `---
title: API contract
owner: markdown-engine
---

# API Contract

Body text.
`;

const config = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
  },
} satisfies ValidationConfig;
const contractPath = "contract.md";
const contractFrontmatter = {
  title: "API contract",
  owner: "markdown-engine",
};
const queryMarkdown = `# Heading

Text with [link](https://example.com).
`;
const mismatchedVersionProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "0.0.0",
  rules: [],
} satisfies ValidationProfile;

describe("public API", () => {
  it("exports the named API functions", () => {
    expect(parse).toEqual(expect.any(Function));
    expect(normalize).toEqual(expect.any(Function));
    expect(validate).toEqual(expect.any(Function));
    expect(serialize).toEqual(expect.any(Function));
    expect(validateDocumentSet).toEqual(expect.any(Function));
    expect(documentQueries).toEqual(expect.any(Object));
    expect(validateAnnotations).toEqual(expect.any(Function));
    expect(parseValidationProfile).toEqual(expect.any(Function));
    expect(validateWithProfile).toEqual(expect.any(Function));
  });

  it("VAL-7: exposes parse, normalize, validate, and serialize result contracts", () => {
    const parseResult = parse(markdown, { path: contractPath });
    const normalizeResult = normalize(parseResult.parsed);
    const validationResult = validate(normalizeResult.document, config);
    const serializedValidation = serialize(validationResult, { pretty: true });

    expect(parseResult).toMatchObject({
      parsed: {
        markdown,
        body: "\n# API Contract\n\nBody text.\n",
        path: contractPath,
        frontmatter: contractFrontmatter,
        document: {
          kind: "markdown-document",
          version: "0.0.0",
          path: contractPath,
          frontmatter: contractFrontmatter,
        },
        diagnostics: [],
      },
      diagnostics: [],
    });
    expect(normalizeResult).toMatchObject({
      document: {
        kind: "markdown-document",
        version: "1.0.0",
        path: contractPath,
        frontmatter: contractFrontmatter,
      },
      diagnostics: [],
    });
    expect(validationResult).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "frontmatter.required",
          passed: true,
          diagnostics: [],
        },
      ],
    });
    expect(serializedValidation).toBe(`{
  "diagnostics": [],
  "ruleResults": [
    {
      "diagnostics": [],
      "passed": true,
      "ruleId": "frontmatter.required"
    }
  ],
  "valid": true
}`);
  });

  it("VAL-7: keeps raw parser AST fields out of public results", () => {
    const parseResult = parse(markdown);
    const normalizeResult = normalize(parseResult.parsed);

    expect(JSON.stringify(parseResult)).not.toContain('"position"');
    expect(JSON.stringify(normalizeResult)).not.toContain('"position"');
    expect(JSON.stringify(normalizeResult)).not.toContain('"value"');
  });

  it("reports parse and validate diagnostics through stable public fields", () => {
    const brokenFrontmatter = "---\ntitle: [\n---\n# Broken\n";
    const parseResult = parse(brokenFrontmatter, { path: "broken.md" });
    const normalizedDocument = normalize(parse("# Heading\n\nBody.\n").parsed, {
      documentVersion: "1.0.0",
    }).document;
    const validationResult = validate(normalizedDocument, {
      rules: {
        "frontmatter.required": {
          fields: ["title"],
        },
        unsupported: {},
      },
    });
    const invalidConfigResult = validate(normalizedDocument, {
      rules: [],
    } as unknown as ValidationConfig);

    expect(parseResult.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        message: expect.stringContaining("Flow sequence"),
        severity: "error",
        sourceRange: {
          start: { line: 3, column: 1, offset: 13 },
          end: { line: 3, column: 1, offset: 13 },
        },
      }),
    ]);
    expect(validationResult.valid).toBe(false);
    expect(validationResult.diagnostics).toEqual([
      {
        code: "config.rule.unsupported",
        ruleId: "unsupported",
        message: 'Unsupported validation rule "unsupported".',
        severity: "error",
      },
      {
        code: "frontmatter.required.missing",
        ruleId: "frontmatter.required",
        message: 'Required frontmatter field "title" is missing.',
        severity: "error",
      },
    ]);
    expect(validationResult.ruleResults).toEqual([
      {
        ruleId: "frontmatter.required",
        passed: false,
        diagnostics: [
          {
            code: "frontmatter.required.missing",
            ruleId: "frontmatter.required",
            message: 'Required frontmatter field "title" is missing.',
            severity: "error",
          },
        ],
      },
    ]);
    expect(invalidConfigResult).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "config.rules.invalid",
          message: "Validation config rules must be an object.",
          severity: "error",
        },
      ],
      ruleResults: [],
    });
  });

  it("honors normalize source options and serialize compatibility gates", () => {
    const parseResult = parse(queryMarkdown, { path: "query.md" });
    const document = normalize(parseResult.parsed, {
      documentVersion: "1.0.0",
      preserveSourceLocations: true,
    }).document;
    const paragraph = expectDefined(
      documentQueries.nodes(document, { type: "paragraph" })[0],
    );
    const paragraphTarget = expectDefined(paragraph.target);

    expect(document).toMatchObject({
      kind: "markdown-document",
      version: "1.0.0",
      path: "query.md",
      sourceRange: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 4, column: 1, offset: 50 },
      },
    });
    expect(documentQueries.sourceSlice(document, paragraphTarget)).toMatchObject({
      text: "Text with [link](https://example.com).",
      range: {
        start: { line: 3, column: 1, offset: 11 },
        end: { line: 3, column: 39, offset: 49 },
      },
    });
    expect(() =>
      serialize(document, { compatibilityMode: "legacy-0.1" }),
    ).toThrow(EngineCompatibilityError);

    try {
      serialize(document, { compatibilityMode: "legacy-0.1" });
    } catch (error) {
      expect(error).toMatchObject({
        name: "EngineCompatibilityError",
        code: "engine.compatibility.versionMismatch",
        requestedMode: "legacy-0.1",
        expectedVersion: "0.0.0",
        actualVersion: "1.0.0",
        message:
          'Compatibility mode "legacy-0.1" expects document version "0.0.0" but received "1.0.0".',
      });
    }

    expect(
      JSON.parse(
        serialize(parse("# Legacy").parsed.document, {
          compatibilityMode: "legacy-0.1",
        }),
      ),
    ).toMatchObject({
      kind: "markdown-document",
      version: "0.0.0",
    });
  });

  it("resolves document queries for targets, slices, and missing targets", () => {
    const document = normalizedQueryDocument();
    const documentTarget = expectDefined(document.target);
    const section = expectDefined(
      documentQueries.sections(document, { title: "Heading" })[0],
    );
    const paragraph = expectDefined(
      documentQueries.nodes(document, { type: "paragraph" })[0],
    );
    const paragraphTarget = expectDefined(paragraph.target);
    const link = expectDefined(
      documentQueries.links(document, { url: "https://example.com" })[0],
    );
    const missingTarget = {
      kind: "node",
      id: "node:missing",
    } satisfies EngineNodeTarget;

    expect(documentQueries.targetCategory(document, documentTarget)).toBe(
      "document",
    );
    expect(documentQueries.targetCategory(document, section.target)).toBe(
      "section",
    );
    expect(documentQueries.targetCategory(document, paragraphTarget)).toBe("node");
    expect(documentQueries.targetCategory(document, missingTarget)).toBeUndefined();
    expect(documentQueries.resolveTarget(document, documentTarget)).toEqual({
      category: "document",
      target: documentTarget,
    });
    expect(documentQueries.resolveTarget(document, section.target)).toMatchObject({
      category: "section",
      section: {
        title: "Heading",
        depth: 1,
      },
      sourceSlice: {
        text: "# Heading",
      },
    });
    expect(documentQueries.resolveTarget(document, paragraphTarget)).toMatchObject({
      category: "node",
      node: {
        type: "paragraph",
      },
      sourceSlice: {
        text: "Text with [link](https://example.com).",
      },
    });
    expect(documentQueries.sourceSlice(document, documentTarget)).toBeUndefined();
    expect(documentQueries.sourceSlice(document, link.target)).toMatchObject({
      text: "[link](https://example.com)",
    });
    expect(documentQueries.resolveTarget(document, missingTarget)).toBeUndefined();
    expect(documentQueries.nodes(document, { targetId: section.target.id })).toEqual(
      [],
    );
  });

  it("validates annotation targets with clone isolation and diagnostic shape", () => {
    const document = normalizedQueryDocument();
    const paragraph = expectDefined(
      documentQueries.nodes(document, { type: "paragraph" })[0],
    );
    const paragraphTarget = expectDefined(paragraph.target);
    const annotations = [
      {
        id: "annotation:paragraph",
        target: {
          kind: "node",
          nodeTarget: paragraphTarget,
        },
        payload: { reviewer: "api-contract" },
      },
    ] satisfies readonly EngineAnnotation[];
    const result = validateAnnotations(document, annotations);
    const resultTarget = result.annotations[0]?.target;

    if (resultTarget?.kind !== "node") {
      throw new Error("Expected node annotation result.");
    }

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      annotations,
    });
    expect(result.annotations).not.toBe(annotations);
    expect(result.annotations[0]).not.toBe(annotations[0]);
    expect(resultTarget.nodeTarget).not.toBe(paragraphTarget);
    expect(resultTarget.nodeTarget).toEqual(paragraphTarget);

    const invalidResult = validateAnnotations(document, [
      {
        id: "annotation:out-of-bounds-node",
        target: {
          kind: "node",
          nodeTarget: {
            kind: "node",
            id: "node:missing",
            sourceRange: sourceRange(9, 1, 999, 9, 2, 1000),
          },
        },
        payload: null,
      },
      {
        id: "annotation:invalid-source-range",
        target: {
          kind: "source",
          sourceRange: sourceRange(10, 4, 200, 9, 1, 180),
        },
        payload: null,
      },
    ]);

    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.diagnostics).toEqual([
      {
        code: "annotation.target.outOfBounds",
        message:
          "Annotation node target source range must be contained by the document source range.",
        severity: "error",
        sourceRange: sourceRange(9, 1, 999, 9, 2, 1000),
        target: invalidResult.annotations[0]?.target,
      },
      {
        code: "annotation.target.invalidRange",
        message: "Annotation source target range ends before it starts.",
        severity: "error",
        sourceRange: sourceRange(10, 4, 200, 9, 1, 180),
        target: invalidResult.annotations[1]?.target,
      },
    ]);
  });

  it("exposes declarative profile diagnostics through public API helpers", () => {
    const profileParseResult = parseValidationProfile("syntaxVersion: [", {
      path: "profiles/broken.yaml",
    });
    const document = normalizedQueryDocument();
    const validationResult = validateWithProfile(
      document,
      mismatchedVersionProfile,
    );

    expect(profileParseResult).toEqual({
      diagnostics: [
        {
          code: "profile.config.invalidYaml",
          message:
            "Flow sequence in block collection must be sufficiently indented and end with a ]",
          severity: "error",
          sourceRange: {
            start: { line: 1, column: 17, offset: 16 },
            end: { line: 1, column: 17, offset: 16 },
          },
        },
      ],
    });
    expect(validationResult).toMatchObject({
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
        ruleCount: 0,
      },
    });
  });

  it("exports the document set validation public contract", () => {
    const entry = {
      path: contractPath,
      markdown,
      profile: {
        syntaxVersion: "markdown-engine.validation@v1",
        documentVersion: "1.0.0",
        rules: [],
      },
    } satisfies ValidateDocumentSetEntry;
    const result = validateDocumentSet([entry], {
      preserveSourceLocations: false,
    }) satisfies ValidateDocumentSetResult;

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      entries: [
        {
          path: contractPath,
          diagnostics: [],
          parseDiagnostics: [],
          normalizationDiagnostics: [],
          profileDiagnostics: [],
          validationDiagnostics: [],
          validationResult: {
            valid: true,
            diagnostics: [],
            ruleResults: [],
          },
        },
      ],
    });
  });
});

function normalizedQueryDocument() {
  return normalize(parse(queryMarkdown, { path: "query.md" }).parsed, {
    documentVersion: "1.0.0",
    preserveSourceLocations: true,
  }).document;
}

function expectDefined<T>(value: T | undefined): T {
  expect(value).toBeDefined();
  return value as T;
}

function sourceRange(
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number,
): SourceRange {
  return {
    start: {
      line: startLine,
      column: startColumn,
      offset: startOffset,
    },
    end: {
      line: endLine,
      column: endColumn,
      offset: endOffset,
    },
  };
}
