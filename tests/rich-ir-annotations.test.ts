import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  serialize,
  validateAnnotations,
  type AnnotationValidationResult,
  type EngineAnnotation,
  type EngineDocument,
  type EngineNode,
  type EngineTarget,
  type SourceRange,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/proving.md";
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/proving.md", import.meta.url),
  "utf8",
);

describe("1.0 Rich IR annotation target validation", () => {
  it("accepts node, section, and source targets while preserving opaque payloads", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstNode(document, "paragraph");
    const section = documentQueries.sections(document)[0] ?? missing();
    const payload = {
      callerOwnsMeaning: true,
      reviewSignal: "go",
      nested: { stable: true },
    };
    const annotations = [
      nodeAnnotation("annotation:node", requireTarget(paragraph), payload),
      nodeAnnotation("annotation:section", section.target, {
        callerOwnsMeaning: true,
        reviewSignal: "section",
      }),
      sourceAnnotation("annotation:source", requireSourceRange(paragraph), {
        callerOwnsMeaning: true,
        reviewSignal: "source",
      }),
    ];

    const result = validateAnnotations(document, annotations);

    expect(result).toEqual({
      valid: true,
      annotations,
      diagnostics: [],
    });
    expect(result.annotations).not.toBe(annotations);
    expect(result.annotations[0]).not.toBe(annotations[0]);
    expect(result.annotations[0]?.payload).toEqual(payload);
  });

  it("produces deterministic diagnostics for malformed and missing targets", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstNode(document, "paragraph");
    const paragraphTarget = requireTarget(paragraph);
    const malformedAnnotations = [
      sourceAnnotation("annotation:out-of-bounds", range(1, 1, 0, 1, 8, 7), {
        callerOwnsMeaning: true,
      }),
      sourceAnnotation(
        "annotation:line-out-of-bounds",
        range(1, 4, 100, 1, 6, 102),
        {
          callerOwnsMeaning: true,
        },
      ),
      nodeAnnotation(
        "annotation:unknown-node",
        {
          ...paragraphTarget,
          id: "node:missing:paragraph",
        },
        { callerOwnsMeaning: true },
      ),
      sourceAnnotation(
        "annotation:invalid-order",
        range(10, 4, 200, 9, 1, 180),
        {
          callerOwnsMeaning: true,
        },
      ),
      sourceAnnotation(
        "annotation:invalid-line-order",
        range(10, 6, 200, 9, 1, 220),
        {
          callerOwnsMeaning: true,
        },
      ),
      malformedAnnotation("annotation:bad-target-kind", {
        kind: "block",
        target: paragraphTarget,
      }),
      malformedAnnotation("annotation:bad-node-target", {
        kind: "node",
        target: {
          ...paragraphTarget,
          path: [-1],
        },
      }),
      malformedAnnotation("annotation:missing-source-range", {
        kind: "source",
      }),
      malformedAnnotation("annotation:non-ascii-target-a", {
        kind: "node",
        target: {
          kind: "node",
          id: "node:ä",
          path: [-1],
        },
      }),
      malformedAnnotation("annotation:non-ascii-target-z", {
        kind: "node",
        target: {
          kind: "node",
          id: "node:z",
          path: [-1],
        },
      }),
    ];

    const firstResult = validateAnnotations(document, malformedAnnotations);
    const secondResult = validateAnnotations(
      document,
      [...malformedAnnotations].reverse(),
    );

    expect(diagnosticSummary(firstResult)).toEqual(
      diagnosticSummary(secondResult),
    );
    expect(diagnosticSummary(firstResult)).toEqual([
      {
        code: "annotation.target.outOfBounds",
        sourceStart: "1:1",
        targetKey: "source",
      },
      {
        code: "annotation.target.outOfBounds",
        sourceStart: "1:4",
        targetKey: "source",
      },
      {
        code: "annotation.target.unknown",
        sourceStart: "9:1",
        targetKey: "node:missing:paragraph",
      },
      {
        code: "annotation.target.invalidRange",
        sourceStart: "10:4",
        targetKey: "source",
      },
      {
        code: "annotation.target.invalidRange",
        sourceStart: "10:6",
        targetKey: "source",
      },
      {
        code: "annotation.target.invalidKind",
        sourceStart: undefined,
        targetKey: "node:1:paragraph",
      },
      {
        code: "annotation.target.invalidKind",
        sourceStart: undefined,
        targetKey: "node:z",
      },
      {
        code: "annotation.target.invalidKind",
        sourceStart: undefined,
        targetKey: "node:ä",
      },
      {
        code: "annotation.target.invalidKind",
        sourceStart: undefined,
        targetKey: "block",
      },
      {
        code: "annotation.target.invalidRange",
        sourceStart: undefined,
        targetKey: "source",
      },
    ]);
  });

  it("returns diagnostics for malformed targets with non-JSON-safe values", () => {
    const document = normalizeDraftFixture();
    const circularTarget: Record<string, unknown> = { kind: "block" };
    circularTarget.self = circularTarget;
    const throwingGetterTarget = {
      kind: "block",
      get bad() {
        throw new Error("getter exploded");
      },
    };
    const throwingKindTarget = {
      get kind() {
        throw new Error("kind exploded");
      },
    };
    const sharedChild = { value: "shared" };

    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:bigint-target", {
        kind: "block",
        value: BigInt(1),
      }),
      malformedAnnotation("annotation:circular-target", circularTarget),
      malformedAnnotation("annotation:getter-target", throwingGetterTarget),
      malformedAnnotation("annotation:getter-kind-target", throwingKindTarget),
      malformedAnnotation("annotation:dag-target", {
        kind: "block",
        a: sharedChild,
        b: sharedChild,
      }),
    ]);

    expect(result).toMatchObject({
      valid: false,
      diagnostics: [
        { code: "annotation.target.invalidKind", severity: "error" },
        { code: "annotation.target.invalidKind", severity: "error" },
        { code: "annotation.target.invalidKind", severity: "error" },
        { code: "annotation.target.invalidKind", severity: "error" },
        { code: "annotation.target.invalidKind", severity: "error" },
      ],
    });

    const serialized = serialize(result, { pretty: true });
    const parsed = JSON.parse(serialized);

    expect(serialized).toEqual(serialize(result, { pretty: true }));
    expect(parsed.annotations).toEqual([
      expect.objectContaining({
        target: { kind: "block", value: "1" },
      }),
      expect.objectContaining({
        target: { kind: "block", self: "[Circular]" },
      }),
      expect.objectContaining({
        target: { bad: "[Unserializable]", kind: "block" },
      }),
      expect.objectContaining({
        target: { kind: "[Unserializable]" },
      }),
      expect.objectContaining({
        target: {
          a: { value: "shared" },
          b: { value: "shared" },
          kind: "block",
        },
      }),
    ]);
    expect(parsed.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: { kind: "block", value: "1" },
        }),
        expect.objectContaining({
          target: { kind: "block", self: "[Circular]" },
        }),
        expect.objectContaining({
          target: { bad: "[Unserializable]", kind: "block" },
        }),
        expect.objectContaining({
          target: { kind: "[Unserializable]" },
        }),
        expect.objectContaining({
          target: {
            a: { value: "shared" },
            b: { value: "shared" },
            kind: "block",
          },
        }),
      ]),
    );
  });

  it("serializes accepted source ranges without preserving non-contract fields", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstNode(document, "paragraph");
    const paragraphRange = requireSourceRange(paragraph);
    const unsafeRange = {
      start: { ...paragraphRange.start, unsafe: BigInt(1) },
      end: { ...paragraphRange.end },
    } as SourceRange;

    const result = validateAnnotations(document, [
      sourceAnnotation("annotation:unsafe-source-extra", unsafeRange, {
        callerOwnsMeaning: true,
      }),
    ]);

    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
    });

    const parsed = JSON.parse(serialize(result, { pretty: true }));

    expect(parsed.annotations[0].target.range.start).toEqual(
      paragraphRange.start,
    );
    expect(parsed.annotations[0].target.range.start).not.toHaveProperty(
      "unsafe",
    );
  });

  it("serializes annotation validation results in stable key order", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstNode(document, "paragraph");
    const result = validateAnnotations(document, [
      nodeAnnotation("annotation:valid", requireTarget(paragraph), {
        callerOwnsMeaning: true,
        reviewSignal: "valid",
      }),
      sourceAnnotation(
        "annotation:bad-range",
        range(12, 2, 260, 11, 1, 240),
        {
          callerOwnsMeaning: true,
          reviewSignal: "invalid",
        },
      ),
    ]);

    const serialized = serialize(result, { pretty: true });

    expect(serialized).toEqual(serialize(result, { pretty: true }));
    expect(JSON.parse(serialized)).toMatchObject({
      valid: false,
      annotations: [
        {
          id: "annotation:valid",
          payload: {
            callerOwnsMeaning: true,
            reviewSignal: "valid",
          },
        },
        {
          id: "annotation:bad-range",
          payload: {
            callerOwnsMeaning: true,
            reviewSignal: "invalid",
          },
        },
      ],
      diagnostics: [
        {
          code: "annotation.target.invalidRange",
          severity: "error",
          sourceRange: {
            start: { line: 12, column: 2, offset: 260 },
            end: { line: 11, column: 1, offset: 240 },
          },
        },
      ],
    });
  });
});

function normalizeDraftFixture(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0-draft",
  }).document;
}

function nodeAnnotation<TPayload>(
  id: string,
  target: EngineTarget,
  payload: TPayload,
): EngineAnnotation<TPayload> {
  return {
    id,
    target: {
      kind: "node",
      target,
    },
    payload,
  };
}

function sourceAnnotation<TPayload>(
  id: string,
  range: SourceRange,
  payload: TPayload,
): EngineAnnotation<TPayload> {
  return {
    id,
    target: {
      kind: "source",
      range,
    },
    payload,
  };
}

function malformedAnnotation(id: string, target: unknown): EngineAnnotation {
  return {
    id,
    target,
    payload: { callerOwnsMeaning: true },
  } as EngineAnnotation;
}

function diagnosticSummary(result: AnnotationValidationResult) {
  return result.diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    sourceStart: sourceStart(diagnostic.sourceRange),
    targetKey: targetKey(diagnostic.target),
  }));
}

function sourceStart(sourceRange: SourceRange | undefined): string | undefined {
  if (sourceRange === undefined) {
    return undefined;
  }

  return `${sourceRange.start.line}:${sourceRange.start.column}`;
}

function targetKey(target: unknown): string | undefined {
  if (typeof target !== "object" || target === null || !("kind" in target)) {
    return undefined;
  }

  if (target.kind === "source") {
    return "source";
  }

  if (target.kind !== "node") {
    return String(target.kind);
  }

  if (!("target" in target)) {
    return "node";
  }

  const nodeTarget = target.target;

  if (
    typeof nodeTarget === "object" &&
    nodeTarget !== null &&
    "id" in nodeTarget &&
    typeof nodeTarget.id === "string"
  ) {
    return nodeTarget.id;
  }

  return "node";
}

function firstNode(document: EngineDocument, type: string): EngineNode {
  return documentQueries.nodes(document, { type })[0] ?? missing();
}

function requireTarget(node: EngineNode): EngineTarget {
  return node.target ?? missing();
}

function requireSourceRange(node: EngineNode): SourceRange {
  return node.sourceRange ?? missing();
}

function missing(): never {
  throw new Error("Expected fixture target to be present.");
}

function range(
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
