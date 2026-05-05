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

  it("checks provided source offsets even when the opposite endpoint omits offset", () => {
    const document = normalizeDraftFixture();
    const documentSourceRange = document.sourceRange ?? missing();
    const documentEndOffset = documentSourceRange.end.offset ?? missing();
    const partialStartOffsetOutOfBounds = {
      start: {
        line: documentSourceRange.start.line,
        column: documentSourceRange.start.column,
        offset: documentEndOffset + 1,
      },
      end: {
        line: documentSourceRange.end.line,
        column: documentSourceRange.end.column,
      },
    };
    const partialEndOffsetOutOfBounds = {
      start: {
        line: documentSourceRange.start.line,
        column: documentSourceRange.start.column,
      },
      end: {
        line: documentSourceRange.end.line,
        column: documentSourceRange.end.column,
        offset: documentEndOffset + 1,
      },
    };
    const partialOffsetInBounds = {
      start: {
        line: documentSourceRange.start.line,
        column: documentSourceRange.start.column,
        offset: documentSourceRange.start.offset ?? 0,
      },
      end: {
        line: documentSourceRange.end.line,
        column: documentSourceRange.end.column,
      },
    };

    const result = validateAnnotations(document, [
      sourceAnnotation(
        "annotation:partial-start-offset-out-of-bounds",
        partialStartOffsetOutOfBounds,
        { callerOwnsMeaning: true },
      ),
      sourceAnnotation(
        "annotation:partial-end-offset-out-of-bounds",
        partialEndOffsetOutOfBounds,
        { callerOwnsMeaning: true },
      ),
      sourceAnnotation("annotation:partial-offset-in-bounds", partialOffsetInBounds, {
        callerOwnsMeaning: true,
      }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "annotation.target.outOfBounds",
          sourceRange: partialStartOffsetOutOfBounds,
          target: { kind: "source", range: partialStartOffsetOutOfBounds },
        }),
        expect.objectContaining({
          code: "annotation.target.outOfBounds",
          sourceRange: partialEndOffsetOutOfBounds,
          target: { kind: "source", range: partialEndOffsetOutOfBounds },
        }),
      ]),
    );
  });

  it("semantically validates optional node target source ranges", () => {
    const document = normalizeDraftFixture();
    const documentTarget = document.target ?? missing();
    const documentSourceRange = document.sourceRange ?? missing();
    const documentEndOffset = documentSourceRange.end.offset ?? missing();
    const reversedNodeSourceRange = {
      start: documentSourceRange.end,
      end: documentSourceRange.start,
    };
    const partialOffsetOutOfBoundsNodeSourceRange = {
      start: {
        line: documentSourceRange.start.line,
        column: documentSourceRange.start.column,
        offset: documentEndOffset + 1,
      },
      end: {
        line: documentSourceRange.end.line,
        column: documentSourceRange.end.column,
      },
    };
    const partialOffsetInBoundsNodeSourceRange = {
      start: {
        line: documentSourceRange.start.line,
        column: documentSourceRange.start.column,
        offset: documentSourceRange.start.offset ?? 0,
      },
      end: {
        line: documentSourceRange.end.line,
        column: documentSourceRange.end.column,
      },
    };
    const reversedNodeTarget = {
      ...documentTarget,
      sourceRange: reversedNodeSourceRange,
    };
    const outOfBoundsNodeTarget = {
      ...documentTarget,
      sourceRange: partialOffsetOutOfBoundsNodeSourceRange,
    };
    const inBoundsNodeTarget = {
      ...documentTarget,
      sourceRange: partialOffsetInBoundsNodeSourceRange,
    };

    const result = validateAnnotations(document, [
      nodeAnnotation("annotation:reversed-node-source-range", reversedNodeTarget, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation("annotation:out-of-bounds-node-source-range", outOfBoundsNodeTarget, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation("annotation:in-bounds-node-source-range", inBoundsNodeTarget, {
        callerOwnsMeaning: true,
      }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "annotation.target.invalidRange",
          sourceRange: reversedNodeSourceRange,
          target: {
            kind: "node",
            target: reversedNodeTarget,
          },
        }),
        expect.objectContaining({
          code: "annotation.target.outOfBounds",
          sourceRange: partialOffsetOutOfBoundsNodeSourceRange,
          target: {
            kind: "node",
            target: outOfBoundsNodeTarget,
          },
        }),
      ]),
    );
  });

  it("accepts known node targets with unavailable paths without serializing path", () => {
    const document = normalizeDraftFixture();
    const paragraphTarget = requireTarget(firstNode(document, "paragraph"));
    const oversizedPath = Array.from({ length: 1_025 }, (_, index) => index);
    const validOversizedPathTarget = {
      ...paragraphTarget,
      path: oversizedPath,
    };
    const unavailablePathTarget = {
      ...paragraphTarget,
      path: hugeSparseArrayTarget("target path") as readonly number[],
    };
    const descriptorUnavailablePathTarget = {
      ...paragraphTarget,
      path: unavailableArrayLengthTarget("target path"),
    };
    const unavailablePathDescriptorTarget = unavailablePathDescriptorEngineTarget(
      paragraphTarget.id,
    );

    const result = validateAnnotations(document, [
      nodeAnnotation("annotation:oversized-path", validOversizedPathTarget, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation("annotation:unavailable-path", unavailablePathTarget, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation(
        "annotation:descriptor-unavailable-path",
        descriptorUnavailablePathTarget,
        {
          callerOwnsMeaning: true,
        },
      ),
      nodeAnnotation(
        "annotation:unavailable-path-descriptor",
        unavailablePathDescriptorTarget,
        {
          callerOwnsMeaning: true,
        },
      ),
    ]);

    expect(result.valid).toBe(true);
    expect(result.diagnostics).toEqual([]);

    for (const annotation of result.annotations) {
      if (annotation.target.kind !== "node") {
        missing();
      }

      expect(annotation.target.target).toMatchObject({
        id: paragraphTarget.id,
        kind: "node",
      });
      expect(annotation.target.target).not.toHaveProperty("path");
    }
  });

  it("sorts same-position diagnostics with offsets before diagnostics without offsets", () => {
    const document = normalizeDraftFixture();
    const knownOffsetTarget = {
      kind: "node",
      id: "node:z:missing",
      sourceRange: range(9, 1, 90, 9, 6, 95),
    } satisfies EngineTarget;
    const missingOffsetTarget = {
      kind: "node",
      id: "node:a:missing",
      sourceRange: rangeWithoutOffsets(9, 1, 9, 6),
    } satisfies EngineTarget;
    const annotations = [
      nodeAnnotation("annotation:missing-offset", missingOffsetTarget, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation("annotation:known-offset", knownOffsetTarget, {
        callerOwnsMeaning: true,
      }),
    ];

    const firstResult = validateAnnotations(document, annotations);
    const secondResult = validateAnnotations(document, [...annotations].reverse());

    expect(diagnosticOffsets(firstResult)).toEqual(diagnosticOffsets(secondResult));
    expect(diagnosticOffsets(firstResult)).toEqual([90, undefined]);
    expect(firstResult.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
      "Annotation target 'node:z:missing' does not exist in the document.",
      "Annotation target 'node:a:missing' does not exist in the document.",
    ]);
  });

  it("returns diagnostics for malformed targets with non-JSON-safe values", () => {
    const document = normalizeDraftFixture();
    const paragraphTarget = requireTarget(firstNode(document, "paragraph"));
    const circularTarget: Record<string, unknown> = { kind: "block" };
    circularTarget.self = circularTarget;
    const sharedTargetValue = { value: "shared" };
    let readableAccessorPathReads = 0;
    let nonPlainTagReads = 0;
    const accessorTarget = { kind: "block" };
    Object.defineProperty(accessorTarget, "bad", {
      enumerable: true,
      get() {
        throw new Error("Expected target normalization not to invoke getters.");
      },
    });
    const accessorKindTarget = throwingAccessorTarget("kind");
    const accessorNodeTarget = throwingAccessorTarget("target", "node");
    const accessorSourceTarget = throwingAccessorTarget("range", "source");
    const accessorArrayTarget = throwingArrayTarget("array target");
    const accessorPathTarget = {
      kind: "node",
      target: {
        kind: "node",
        id: "node:accessor-path",
        path: throwingArrayTarget("target path"),
      },
    };
    const readableAccessorPathTarget = {
      kind: "node",
      target: {
        kind: "node",
        id: paragraphTarget.id,
        path: readableAccessorArrayTarget(0, () => {
          readableAccessorPathReads += 1;
        }),
      },
    };
    const proxyArrayTarget = new Proxy([1], {
      get() {
        throw new Error("Expected array proxy get trap not to escape validation.");
      },
    });
    const proxyTarget = new Proxy(
      { kind: "block" },
      {
        getOwnPropertyDescriptor() {
          throw new Error("Expected descriptor trap not to escape validation.");
        },
      },
    );
    const nonPlainTaggedTarget = Object.create(Date.prototype) as object;
    Object.defineProperty(nonPlainTaggedTarget, Symbol.toStringTag, {
      get() {
        nonPlainTagReads += 1;
        return "UnsafeTarget";
      },
    });
    const revokedProxyTarget = revokedProxy();
    const functionTarget = throwingFunctionTarget("function target");
    const proxyFunctionTarget = proxiedFunctionTarget("function proxy target");
    const hugeArrayTarget = hugeSparseArrayTarget("array target");

    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:bigint-target", {
        kind: "block",
        value: BigInt(1),
      }),
      malformedAnnotation("annotation:circular-target", circularTarget),
      malformedAnnotation("annotation:shared-target", {
        kind: "block",
        a: sharedTargetValue,
        b: sharedTargetValue,
      }),
      malformedAnnotation("annotation:accessor-target", accessorTarget),
      malformedAnnotation("annotation:accessor-kind-target", accessorKindTarget),
      malformedAnnotation("annotation:accessor-node-target", accessorNodeTarget),
      malformedAnnotation("annotation:accessor-source-target", accessorSourceTarget),
      malformedAnnotation("annotation:accessor-array-target", accessorArrayTarget),
      malformedAnnotation("annotation:accessor-path-target", accessorPathTarget),
      malformedAnnotation(
        "annotation:readable-accessor-path-target",
        readableAccessorPathTarget,
      ),
      malformedAnnotation("annotation:proxy-array-target", proxyArrayTarget),
      malformedAnnotation("annotation:proxy-target", proxyTarget),
      malformedAnnotation("annotation:non-plain-tagged-target", nonPlainTaggedTarget),
      malformedAnnotation("annotation:revoked-proxy-target", revokedProxyTarget),
      malformedAnnotation("annotation:function-target", functionTarget),
      malformedAnnotation("annotation:function-proxy-target", proxyFunctionTarget),
      malformedAnnotation("annotation:huge-array-target", hugeArrayTarget),
    ]);

    expect(result.valid).toBe(false);
    expect(readableAccessorPathReads).toBe(0);
    expect(nonPlainTagReads).toBe(0);
    expect(result.diagnostics).toHaveLength(17);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          severity: "error",
        }),
        expect.objectContaining({
          code: "annotation.target.invalidRange",
          severity: "error",
        }),
      ]),
    );

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
        target: {
          a: { value: "shared" },
          b: { value: "shared" },
          kind: "block",
        },
      }),
      expect.objectContaining({
        target: { bad: "[Accessor]", kind: "block" },
      }),
      expect.objectContaining({
        target: { kind: "[Accessor]" },
      }),
      expect.objectContaining({
        target: { kind: "node", target: "[Accessor]" },
      }),
      expect.objectContaining({
        target: { kind: "source", range: "[Accessor]" },
      }),
      expect.objectContaining({
        target: ["[Accessor]"],
      }),
      expect.objectContaining({
        target: {
          kind: "node",
          target: {
            id: "node:accessor-path",
            kind: "node",
            path: ["[Accessor]"],
          },
        },
      }),
      expect.objectContaining({
        target: {
          kind: "node",
          target: {
            id: paragraphTarget.id,
            kind: "node",
            path: ["[Accessor]"],
          },
        },
      }),
      expect.objectContaining({
        target: [1],
      }),
      expect.objectContaining({
        target: "[Unavailable]",
      }),
      expect.objectContaining({
        target: "[Unavailable]",
      }),
      expect.objectContaining({
        target: "[Unavailable]",
      }),
      expect.objectContaining({
        target: "[Function]",
      }),
      expect.objectContaining({
        target: "[Function]",
      }),
      expect.objectContaining({
        target: "[Unavailable]",
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
          target: {
            a: { value: "shared" },
            b: { value: "shared" },
            kind: "block",
          },
        }),
        expect.objectContaining({
          target: { bad: "[Accessor]", kind: "block" },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: { kind: "[Accessor]" },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: { kind: "node", target: "[Accessor]" },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidRange",
          target: { kind: "source", range: "[Accessor]" },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: ["[Accessor]"],
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: {
            kind: "node",
            target: {
              id: "node:accessor-path",
              kind: "node",
              path: ["[Accessor]"],
            },
          },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: {
            kind: "node",
            target: {
              id: paragraphTarget.id,
              kind: "node",
              path: ["[Accessor]"],
            },
          },
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: [1],
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: "[Function]",
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: "[Unavailable]",
        }),
      ]),
    );
  });

  it("bounds normalization depth for deeply nested malformed targets", () => {
    const document = normalizeDraftFixture();
    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:deep-target", deeplyNestedTarget(5_000)),
    ]);

    const serialized = serialize(result, { pretty: true });
    const parsed = JSON.parse(serialized);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.invalidKind",
      }),
    ]);
    expect(serialized).toContain("[Unavailable]");
  });

  it("bounds normalization width for wide malformed object targets", () => {
    const document = normalizeDraftFixture();
    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:wide-target", wideObjectTarget(2_000)),
    ]);

    const serialized = serialize(result, { pretty: true });
    const parsed = JSON.parse(serialized);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(parsed.annotations).toEqual([
      expect.objectContaining({
        target: "[Unavailable]",
      }),
    ]);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.invalidKind",
        target: "[Unavailable]",
      }),
    ]);
    expect(serialized).not.toContain("wide:1999");
  });

  it("bounds normalization work for shared malformed target graphs", () => {
    const document = normalizeDraftFixture();
    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:shared-fanout", sharedFanoutTarget(16, 5)),
    ]);

    const serialized = serialize(result, { pretty: true });
    const parsed = JSON.parse(serialized);

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.invalidKind",
      }),
    ]);
    expect(serialized).toContain("[Unavailable]");
    expect(serialized.length).toBeLessThan(200_000);
  });

  it("rejects accessor-backed optional target fields", () => {
    const document = normalizeDraftFixture();
    const paragraphTarget = requireTarget(firstNode(document, "paragraph"));
    const expectedPathTarget = {
      kind: "node",
      target: {
        id: paragraphTarget.id,
        kind: "node",
        path: "[Accessor]",
      },
    };
    const expectedNodeTypeTarget = {
      kind: "node",
      target: {
        id: paragraphTarget.id,
        kind: "node",
        nodeType: "[Accessor]",
      },
    };
    const expectedSourceRangeTarget = {
      kind: "node",
      target: {
        id: paragraphTarget.id,
        kind: "node",
        sourceRange: "[Accessor]",
      },
    };
    const expectedSourceOffsetTarget = {
      kind: "source",
      range: {
        end: { line: 7, column: 3, offset: 79 },
        start: { line: 7, column: 1, offset: "[Accessor]" },
      },
    };

    const result = validateAnnotations(document, [
      malformedAnnotation("annotation:accessor-path", {
        kind: "node",
        target: accessorBackedEngineTarget(paragraphTarget.id, "path"),
      }),
      malformedAnnotation("annotation:accessor-node-type", {
        kind: "node",
        target: accessorBackedEngineTarget(paragraphTarget.id, "nodeType"),
      }),
      malformedAnnotation("annotation:accessor-source-range", {
        kind: "node",
        target: accessorBackedEngineTarget(paragraphTarget.id, "sourceRange"),
      }),
      sourceAnnotation(
        "annotation:accessor-offset",
        {
          start: accessorBackedSourcePosition(7, 1, "source offset"),
          end: { line: 7, column: 3, offset: 79 },
        },
        { callerOwnsMeaning: true },
      ),
    ]);

    const parsed = JSON.parse(serialize(result, { pretty: true }));

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toHaveLength(4);
    expect(parsed.annotations).toEqual([
      expect.objectContaining({ target: expectedPathTarget }),
      expect.objectContaining({ target: expectedNodeTypeTarget }),
      expect.objectContaining({ target: expectedSourceRangeTarget }),
      expect.objectContaining({ target: expectedSourceOffsetTarget }),
    ]);
    expect(parsed.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: expectedPathTarget,
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: expectedNodeTypeTarget,
        }),
        expect.objectContaining({
          code: "annotation.target.invalidKind",
          target: expectedSourceRangeTarget,
        }),
        expect.objectContaining({
          code: "annotation.target.invalidRange",
          target: expectedSourceOffsetTarget,
        }),
      ]),
    );
  });

  it("strips extra source position fields before serialization", () => {
    const document = normalizeDraftFixture();
    const unsafeSourceRange = rangeWithExtraFields(7, 1, 77, 7, 3, 79);
    const unsafeNodeRange = rangeWithExtraFields(9, 1, 90, 9, 6, 95);
    const unsafeOutOfBoundsRange = rangeWithExtraFields(1, 1, 0, 1, 8, 7);
    const unknownNodeTarget = {
      kind: "node",
      id: "node:missing:unsafe",
      sourceRange: unsafeNodeRange,
    } satisfies EngineTarget;

    const result = validateAnnotations(document, [
      sourceAnnotation("annotation:unsafe-source-range", unsafeSourceRange, {
        callerOwnsMeaning: true,
      }),
      nodeAnnotation("annotation:unsafe-node-range", unknownNodeTarget, {
        callerOwnsMeaning: true,
      }),
      sourceAnnotation("annotation:unsafe-out-of-bounds", unsafeOutOfBoundsRange, {
        callerOwnsMeaning: true,
      }),
    ]);

    const serialized = serialize(result, { pretty: true });
    const parsed = JSON.parse(serialized);

    expect(result.valid).toBe(false);
    expect(parsed.annotations[0].target.range).toEqual(range(7, 1, 77, 7, 3, 79));
    expect(parsed.annotations[1].target.target.sourceRange).toEqual(
      range(9, 1, 90, 9, 6, 95),
    );
    expect(parsed.annotations[2].target.range).toEqual(range(1, 1, 0, 1, 8, 7));
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.outOfBounds",
        sourceRange: range(1, 1, 0, 1, 8, 7),
        target: {
          kind: "source",
          range: range(1, 1, 0, 1, 8, 7),
        },
      }),
      expect.objectContaining({
        code: "annotation.target.unknown",
        sourceRange: range(9, 1, 90, 9, 6, 95),
        target: {
          kind: "node",
          target: {
            kind: "node",
            id: "node:missing:unsafe",
            sourceRange: range(9, 1, 90, 9, 6, 95),
          },
        },
      }),
    ]);
  });

  it("normalizes proxy-backed target internals before validation reads them", () => {
    const document = normalizeDraftFixture();
    const proxyRange = descriptorBackedProxy(
      {
        start: { line: 7, column: 1, offset: 77 },
        end: { line: 7, column: 3, offset: 79 },
      },
      "source range",
    );
    const proxyPositionRange = {
      start: descriptorBackedProxy(
        { line: 8, column: 1, offset: 88 },
        "source position",
      ),
      end: { line: 8, column: 4, offset: 91 },
    };
    const proxyNodeTarget = descriptorBackedProxy(
      {
        kind: "node",
        id: "node:missing:proxy",
        sourceRange: range(9, 1, 90, 9, 6, 95),
      },
      "node target",
    );

    const result = validateAnnotations(document, [
      sourceAnnotation(
        "annotation:proxy-range",
        proxyRange as unknown as SourceRange,
        { callerOwnsMeaning: true },
      ),
      sourceAnnotation(
        "annotation:proxy-position",
        proxyPositionRange as unknown as SourceRange,
        { callerOwnsMeaning: true },
      ),
      malformedAnnotation("annotation:proxy-node-target", {
        kind: "node",
        target: proxyNodeTarget,
      }),
    ]);

    const parsed = JSON.parse(serialize(result, { pretty: true }));

    expect(result.valid).toBe(false);
    expect(parsed.annotations).toEqual([
      expect.objectContaining({
        target: { kind: "source", range: range(7, 1, 77, 7, 3, 79) },
      }),
      expect.objectContaining({
        target: { kind: "source", range: range(8, 1, 88, 8, 4, 91) },
      }),
      expect.objectContaining({
        target: {
          kind: "node",
          target: {
            kind: "node",
            id: "node:missing:proxy",
            sourceRange: range(9, 1, 90, 9, 6, 95),
          },
        },
      }),
    ]);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({
        code: "annotation.target.unknown",
        sourceRange: range(9, 1, 90, 9, 6, 95),
        target: {
          kind: "node",
          target: {
            kind: "node",
            id: "node:missing:proxy",
            sourceRange: range(9, 1, 90, 9, 6, 95),
          },
        },
      }),
    ]);
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

function throwingAccessorTarget(
  property: string,
  kind?: "node" | "source",
): Record<string, unknown> {
  const target: Record<string, unknown> = {};

  if (kind !== undefined) {
    target.kind = kind;
  }

  Object.defineProperty(target, property, {
    enumerable: true,
    get() {
      throw new Error(`Expected ${property} getter not to be invoked.`);
    },
  });

  return target;
}

function throwingArrayTarget(label: string): unknown[] {
  const target: unknown[] = [];

  Object.defineProperty(target, "0", {
    enumerable: true,
    get() {
      throw new Error(`Expected ${label} getter not to be invoked.`);
    },
  });

  return target;
}

function readableAccessorArrayTarget(value: unknown, onRead: () => void): unknown[] {
  const target: unknown[] = [];

  Object.defineProperty(target, "0", {
    enumerable: true,
    get() {
      onRead();
      return value;
    },
  });

  return target;
}

function deeplyNestedTarget(depth: number): Record<string, unknown> {
  let target: Record<string, unknown> = { kind: "block", leaf: true };

  for (let index = 0; index < depth; index += 1) {
    target = { kind: "block", next: target };
  }

  return target;
}

function wideObjectTarget(propertyCount: number): Record<string, unknown> {
  const target: Record<string, unknown> = { kind: "block" };

  for (let index = 0; index < propertyCount; index += 1) {
    target[`wide:${index}`] = index;
  }

  return target;
}

function sharedFanoutTarget(width: number, depth: number): Record<string, unknown> {
  let target: Record<string, unknown> = { kind: "block", leaf: true };

  for (let level = 0; level < depth; level += 1) {
    const parent: Record<string, unknown> = { kind: "block" };

    for (let index = 0; index < width; index += 1) {
      parent[`fanout:${level}:${index}`] = target;
    }

    target = parent;
  }

  return target;
}

function accessorBackedEngineTarget(
  id: string,
  property: "nodeType" | "path" | "sourceRange",
): EngineTarget {
  const target: Record<string, unknown> = { kind: "node", id };

  Object.defineProperty(target, property, {
    enumerable: true,
    get() {
      throw new Error(`Expected ${property} getter not to be invoked.`);
    },
  });

  return target as unknown as EngineTarget;
}

function accessorBackedSourcePosition(
  line: number,
  column: number,
  label: string,
): SourceRange["start"] {
  const position: Record<string, unknown> = { line, column };

  Object.defineProperty(position, "offset", {
    enumerable: true,
    get() {
      throw new Error(`Expected ${label} getter not to be invoked.`);
    },
  });

  return position as SourceRange["start"];
}

function throwingFunctionTarget(label: string): () => void {
  const target = function runtimeTarget(): void {};

  Object.defineProperty(target, "toString", {
    get() {
      throw new Error(`Expected ${label} toString getter not to be invoked.`);
    },
  });

  return target;
}

function proxiedFunctionTarget(label: string): () => void {
  return new Proxy(function runtimeTarget(): void {}, {
    get() {
      throw new Error(`Expected ${label} proxy get trap not to escape validation.`);
    },
  });
}

function hugeSparseArrayTarget(label: string): unknown[] {
  const target: unknown[] = [];

  target.length = 2 ** 32 - 1;

  Object.defineProperty(target, "0", {
    enumerable: true,
    get() {
      throw new Error(`Expected ${label} getter not to be invoked.`);
    },
  });

  return target;
}

function unavailableArrayLengthTarget(label: string): readonly number[] {
  return new Proxy([], {
    get() {
      throw new Error(`Expected ${label} getter not to escape validation.`);
    },
    getOwnPropertyDescriptor(target, property) {
      if (property === "length") {
        throw new Error(
          `Expected ${label} length descriptor failure not to escape validation.`,
        );
      }

      return Reflect.getOwnPropertyDescriptor(target, property);
    },
  });
}

function unavailablePathDescriptorEngineTarget(id: string): EngineTarget {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Expected target getter not to escape validation.");
      },
      getOwnPropertyDescriptor(_target, property) {
        if (property === "kind") {
          return { configurable: true, enumerable: true, value: "node" };
        }

        if (property === "id") {
          return { configurable: true, enumerable: true, value: id };
        }

        if (property === "nodeType") {
          return { configurable: true, enumerable: true, value: "paragraph" };
        }

        if (property === "path") {
          throw new Error(
            "Expected path descriptor failure not to escape validation.",
          );
        }

        return undefined;
      },
    },
  ) as EngineTarget;
}

function revokedProxy(): object {
  const { proxy, revoke } = Proxy.revocable({}, {});

  revoke();

  return proxy;
}

function descriptorBackedProxy(
  properties: Record<string, unknown>,
  label: string,
): Record<string, unknown> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`Expected ${label} getter not to be invoked.`);
      },
      getOwnPropertyDescriptor(_target, property) {
        if (!Object.prototype.hasOwnProperty.call(properties, property)) {
          return undefined;
        }

        return {
          configurable: true,
          enumerable: true,
          value: properties[String(property)],
        };
      },
    },
  );
}

function diagnosticSummary(result: AnnotationValidationResult) {
  return result.diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    sourceStart: sourceStart(diagnostic.sourceRange),
    targetKey: targetKey(diagnostic.target),
  }));
}

function diagnosticOffsets(result: AnnotationValidationResult) {
  return result.diagnostics.map(
    (diagnostic) => diagnostic.sourceRange?.start.offset,
  );
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

function rangeWithoutOffsets(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
): SourceRange {
  return {
    start: {
      line: startLine,
      column: startColumn,
    },
    end: {
      line: endLine,
      column: endColumn,
    },
  };
}

function rangeWithExtraFields(
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
      nonJson: BigInt(1),
    },
    end: {
      line: endLine,
      column: endColumn,
      offset: endOffset,
      nonJson: BigInt(2),
    },
  } as unknown as SourceRange;
}
