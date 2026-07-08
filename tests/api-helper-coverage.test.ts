import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  type EngineAnnotation,
  type SourceRange,
  type ValidationConfig,
  type ValidationProfile,
} from "@jasonbelmonti/markdown-engine";

import {
  annotationTargetDiagnostics,
  cloneAnnotationTarget,
} from "../src/api/annotation-target-validation.js";
import {
  cloneDiagnosticTarget,
  cloneEngineTargetCandidate,
} from "../src/api/annotation-target-cloning.js";
import {
  ACCESSOR_PLACEHOLDER,
  FUNCTION_PLACEHOLDER,
  normalizeRuntimeValue,
} from "../src/api/annotation-target-runtime.js";
import {
  cloneSourceRangeCandidate,
  compareSourcePositions,
  sourceRangeContains,
  sourceRangeIsInvalid,
} from "../src/api/annotation-source-range.js";
import { validateDocumentSet } from "../src/api/document-set-validation.js";
import { validate } from "../src/api/validate.js";

const helperMarkdown = `---
title: Helper coverage
---

# Helper Coverage

Paragraph text.
`;

const helperProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "objective.required",
      select: { target: "document" },
      assert: { sectionsRequired: { headings: ["Helper Coverage"] } },
    },
  ],
} satisfies ValidationProfile;

describe("api helper coverage", () => {
  it("covers validate and document set internals through stable API-shaped inputs", () => {
    const document = normalize(parse(helperMarkdown).parsed, {
      documentVersion: "1.0.0",
      preserveSourceLocations: true,
    }).document;
    const validationResult = validate(document, {
      rules: {
        "frontmatter.required": {
          fields: ["title", "owner"],
        },
      },
    } satisfies ValidationConfig);
    const invalidConfigResult = validate(document, {
      rules: [],
    } as unknown as ValidationConfig);
    const setResult = validateDocumentSet(
      [
        {
          path: "helper-pass.md",
          markdown: helperMarkdown,
          profile: helperProfile,
        },
        {
          path: "helper-profile-error.md",
          markdown: helperMarkdown,
          profile: "syntaxVersion: [",
          profilePath: "profiles/broken.yaml",
        },
      ],
      {
        documentVersion: "1.0.0",
        preserveSourceLocations: true,
        includeEvidence: true,
      },
    );

    expect(validationResult).toMatchObject({
      valid: false,
      diagnostics: [
        {
          code: "frontmatter.required.missing",
          ruleId: "frontmatter.required",
          severity: "error",
        },
      ],
      ruleResults: [
        {
          ruleId: "frontmatter.required",
          passed: false,
        },
      ],
    });
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
    expect(setResult.valid).toBe(false);
    expect(setResult.entries[0]).toMatchObject({
      path: "helper-pass.md",
      diagnostics: [],
      parseDiagnostics: [],
      normalizationDiagnostics: [],
      profileDiagnostics: [],
      validationDiagnostics: [],
      validationResult: {
        valid: true,
      },
    });
    expect(setResult.entries[1]).toMatchObject({
      path: "helper-profile-error.md",
      profilePath: "profiles/broken.yaml",
      parseDiagnostics: [],
      normalizationDiagnostics: [],
      validationDiagnostics: [],
    });
    expect(setResult.entries[1]?.profileDiagnostics).toEqual([
      expect.objectContaining({
        code: "profile.config.invalidYaml",
        severity: "error",
        sourceRange: sourceRange(1, 17, 16, 1, 17, 16),
      }),
    ]);
    expect(setResult.entries[1]?.validationResult).toBeUndefined();
    expect(setResult.diagnostics).toEqual(
      setResult.entries.flatMap((entry) => entry.diagnostics),
    );
  });

  it("covers annotation target diagnostics, cloning, and runtime normalization", () => {
    const document = normalize(parse(helperMarkdown).parsed, {
      documentVersion: "1.0.0",
      preserveSourceLocations: true,
    }).document;
    const paragraphTarget = expectDefined(
      document.children.find((node) => node.type === "paragraph")?.target,
    );
    const validAnnotations = [
      {
        id: "annotation:node",
        target: {
          kind: "node",
          nodeTarget: paragraphTarget,
        },
        payload: { stable: true },
      },
      {
        id: "annotation:source",
        target: {
          kind: "source",
          sourceRange: expectDefined(paragraphTarget.sourceRange),
        },
        payload: { stable: true },
      },
    ] satisfies readonly EngineAnnotation[];
    const malformedAnnotations = [
      {
        id: "annotation:unknown-node",
        target: {
          kind: "node",
          nodeTarget: {
            ...paragraphTarget,
            id: "node:missing",
          },
        },
        payload: null,
      },
      {
        id: "annotation:source-out-of-bounds",
        target: {
          kind: "source",
          sourceRange: sourceRange(99, 1, 999, 99, 2, 1000),
        },
        payload: null,
      },
      {
        id: "annotation:missing-source-range",
        target: {
          kind: "source",
        },
        payload: null,
      },
      {
        id: "annotation:bad-node-target",
        target: {
          kind: "node",
          nodeTarget: {
            kind: "node",
            id: "node:bad-path",
            path: [-1],
          },
        },
        payload: null,
      },
    ] as unknown as readonly EngineAnnotation[];
    const clonedNodeTarget = cloneAnnotationTarget(validAnnotations[0].target);
    const clonedSourceTarget = cloneAnnotationTarget(validAnnotations[1].target);
    const diagnostics = annotationTargetDiagnostics(document, malformedAnnotations);
    const circular: unknown[] = [];
    circular.push(circular);
    const accessorValues = ["fallback"];
    Object.defineProperty(accessorValues, "0", {
      get: () => "hidden",
    });

    expect(annotationTargetDiagnostics(document, validAnnotations)).toEqual([]);
    expect(clonedNodeTarget).toEqual(validAnnotations[0].target);
    expect(clonedNodeTarget).not.toBe(validAnnotations[0].target);
    expect(clonedSourceTarget).toEqual(validAnnotations[1].target);
    expect(clonedSourceTarget).not.toBe(validAnnotations[1].target);
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.unknown",
        message: "Annotation target 'node:missing' does not exist in the document.",
        severity: "error",
        sourceRange: paragraphTarget.sourceRange,
      }),
      expect.objectContaining({
        code: "annotation.target.outOfBounds",
        severity: "error",
        sourceRange: sourceRange(99, 1, 999, 99, 2, 1000),
      }),
      expect.objectContaining({
        code: "annotation.target.invalidKind",
        message: "Annotation node target must reference an engine node target.",
        severity: "error",
      }),
      expect.objectContaining({
        code: "annotation.target.invalidRange",
        message: "Annotation source target range must include start and end positions.",
        severity: "error",
      }),
    ]);
    expect(cloneEngineTargetCandidate(paragraphTarget)).toEqual(paragraphTarget);
    expect(
      cloneEngineTargetCandidate({ ...paragraphTarget, path: [-1] }),
    ).toBeUndefined();
    expect(cloneDiagnosticTarget(() => "target")).toBe(FUNCTION_PLACEHOLDER);
    expect(normalizeRuntimeValue(circular)).toEqual(["[Circular]"]);
    expect(normalizeRuntimeValue(accessorValues)).toEqual([ACCESSOR_PLACEHOLDER]);
    expect(
      normalizeRuntimeValue([() => "target", 1n, Number.POSITIVE_INFINITY]),
    ).toEqual([FUNCTION_PLACEHOLDER, "1", "Infinity"]);
  });

  it("covers source range helper edge cases", () => {
    const fullRange = sourceRange(1, 1, 0, 3, 1, 20);
    const containedRange = sourceRange(2, 1, 5, 2, 5, 9);
    const invalidByLine = sourceRange(3, 1, 20, 2, 1, 5);
    const invalidByOffset = sourceRange(2, 1, 10, 2, 5, 9);
    const clonedRange = cloneSourceRangeCandidate(fullRange);

    expect(clonedRange).toEqual(fullRange);
    expect(clonedRange).not.toBe(fullRange);
    expect(cloneSourceRangeCandidate({ start: { line: 1 }, end: {} })).toBeUndefined();
    expect(sourceRangeContains(fullRange, containedRange)).toBe(true);
    expect(sourceRangeContains(containedRange, fullRange)).toBe(false);
    expect(sourceRangeIsInvalid(invalidByLine)).toBe(true);
    expect(sourceRangeIsInvalid(invalidByOffset)).toBe(true);
    expect(compareSourcePositions({ line: 1, column: 1 }, { line: 1, column: 2 })).toBe(
      -1,
    );
    expect(
      compareSourcePositions(
        { line: 1, column: 1, offset: 5 },
        { line: 1, column: 1, offset: 3 },
      ),
    ).toBe(2);
  });
});

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
