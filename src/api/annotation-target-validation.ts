import type { SourcePosition, SourceRange } from "./diagnostics.js";
import type { OwnRuntimeProperty } from "./annotation-target-runtime.js";
import type {
  EngineAnnotation,
  EngineAnnotationTarget,
  EngineDocument,
  EngineNodeTarget,
  EngineTargetDiagnostic,
} from "./document.js";
import { documentQueries } from "./document-queries.js";
import {
  arrayLength,
  FUNCTION_PLACEHOLDER,
  isArray,
  isPlainObject,
  MAX_NORMALIZED_ARRAY_LENGTH,
  normalizeRuntimeValue,
  ownDataProperty,
  ownRuntimeProperty,
  UNAVAILABLE_PLACEHOLDER,
} from "./annotation-target-runtime.js";

type AnnotationTargetCandidate = {
  kind?: unknown;
  nodeTarget?: unknown;
  sourceRange?: unknown;
};

type TargetPathClone =
  | { kind: "cloned"; path: readonly number[] }
  | { kind: "invalid" }
  | { kind: "unavailable" };

interface SortableTargetDiagnostic {
  diagnostic: EngineTargetDiagnostic;
  order: number;
}

export function annotationTargetDiagnostics(
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
): EngineTargetDiagnostic[] {
  const validTargetIds = documentTargetIds(document);
  const documentSourceRange =
    document.sourceRange !== undefined
      ? cloneSourceRangeCandidate(document.sourceRange)
      : undefined;

  return annotations
    .flatMap((annotation, order) =>
      diagnosticsForAnnotation(
        annotation.target,
        validTargetIds,
        documentSourceRange,
        order,
      ),
    )
    .sort(compareSortableDiagnostics)
    .map(({ diagnostic }) => diagnostic);
}

function documentTargetIds(document: EngineDocument): Set<string> {
  return new Set([
    ...(document.target !== undefined ? [document.target.id] : []),
    ...(document.sections ?? []).map((section) => section.target.id),
    ...documentQueries
      .nodes(document)
      .map((node) => node.target?.id)
      .filter((id): id is string => id !== undefined),
  ]);
}

function diagnosticsForAnnotation(
  target: EngineAnnotationTarget,
  validTargetIds: ReadonlySet<string>,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  if (!isAnnotationTargetCandidate(target)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidKind",
          message: "Annotation target kind must be 'node' or 'source'.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  const kind = annotationTargetKind(target);

  if (kind === "node") {
    return nodeTargetDiagnostics(target, validTargetIds, documentSourceRange, order);
  }

  if (kind === "source") {
    return sourceTargetDiagnostics(target, documentSourceRange, order);
  }

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.invalidKind",
        message: "Annotation target kind must be 'node' or 'source'.",
        severity: "error",
        target,
      },
      order,
    ),
  ];
}

function nodeTargetDiagnostics(
  target: AnnotationTargetCandidate,
  validTargetIds: ReadonlySet<string>,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  const nodeTarget = cloneEngineTargetCandidate(annotationNodeTarget(target));

  if (nodeTarget === undefined) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidKind",
          message: "Annotation node target must reference an engine node target.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  const sourceRangeDiagnostic = nodeTargetSourceRangeDiagnostic(
    target,
    nodeTarget,
    documentSourceRange,
    order,
  );

  if (sourceRangeDiagnostic !== undefined) {
    return [sourceRangeDiagnostic];
  }

  if (validTargetIds.has(nodeTarget.id)) {
    return [];
  }

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.unknown",
        message: `Annotation target '${nodeTarget.id}' does not exist in the document.`,
        severity: "error",
        ...(nodeTarget.sourceRange !== undefined
          ? { sourceRange: cloneSourceRange(nodeTarget.sourceRange) }
          : {}),
        target,
      },
      order,
    ),
  ];
}

function nodeTargetSourceRangeDiagnostic(
  target: AnnotationTargetCandidate,
  nodeTarget: EngineNodeTarget,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic | undefined {
  if (nodeTarget.sourceRange === undefined) {
    return undefined;
  }

  if (sourceRangeIsInvalid(nodeTarget.sourceRange)) {
    return sortableDiagnostic(
      {
        code: "annotation.target.invalidRange",
        message: "Annotation node target source range ends before it starts.",
        severity: "error",
        sourceRange: cloneSourceRange(nodeTarget.sourceRange),
        target,
      },
      order,
    );
  }

  if (
    documentSourceRange !== undefined &&
    !sourceRangeContains(documentSourceRange, nodeTarget.sourceRange)
  ) {
    return sortableDiagnostic(
      {
        code: "annotation.target.outOfBounds",
        message:
          "Annotation node target source range must be contained by the document source range.",
        severity: "error",
        sourceRange: cloneSourceRange(nodeTarget.sourceRange),
        target,
      },
      order,
    );
  }

  return undefined;
}

function sourceTargetDiagnostics(
  target: AnnotationTargetCandidate,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  const range = cloneSourceRangeCandidate(annotationSourceRange(target));

  if (range === undefined) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range must include start and end positions.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  if (sourceRangeIsInvalid(range)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range ends before it starts.",
          severity: "error",
          sourceRange: cloneSourceRange(range),
          target,
        },
        order,
      ),
    ];
  }

  if (
    documentSourceRange !== undefined &&
    !sourceRangeContains(documentSourceRange, range)
  ) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.outOfBounds",
          message:
            "Annotation source target range must be contained by the document source range.",
          severity: "error",
          sourceRange: cloneSourceRange(range),
          target,
        },
        order,
      ),
    ];
  }

  return [];
}

function sortableDiagnostic(
  diagnostic: EngineTargetDiagnostic,
  order: number,
): SortableTargetDiagnostic {
  return {
    diagnostic: {
      ...diagnostic,
      target: cloneDiagnosticTarget(diagnostic.target),
    },
    order,
  };
}

function compareSortableDiagnostics(
  left: SortableTargetDiagnostic,
  right: SortableTargetDiagnostic,
): number {
  return (
    compareOptionalSourceRange(
      left.diagnostic.sourceRange,
      right.diagnostic.sourceRange,
    ) ||
    compareStrings(left.diagnostic.code, right.diagnostic.code) ||
    compareStrings(left.diagnostic.message, right.diagnostic.message) ||
    compareStrings(
      targetSortKey(left.diagnostic.target),
      targetSortKey(right.diagnostic.target),
    ) ||
    left.order - right.order
  );
}

function compareOptionalSourceRange(
  left: SourceRange | undefined,
  right: SourceRange | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return (
    compareSourcePositions(left.start, right.start) ||
    compareSourcePositions(left.end, right.end)
  );
}

function compareSourcePositions(
  left: SourcePosition,
  right: SourcePosition,
): number {
  return (
    left.line - right.line ||
    left.column - right.column ||
    compareOptionalOffsets(left.offset, right.offset)
  );
}

function compareOptionalOffsets(
  left: number | undefined,
  right: number | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left - right;
}

function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function targetSortKey(target: unknown): string {
  try {
    const serialized = JSON.stringify(normalizeRuntimeValue(target));

    return serialized ?? String(target);
  } catch {
    if (typeof target === "function") {
      return FUNCTION_PLACEHOLDER;
    }

    if (typeof target === "object" && target !== null) {
      return UNAVAILABLE_PLACEHOLDER;
    }

    return String(target);
  }
}

function serializableTarget(target: unknown): unknown {
  return normalizeRuntimeValue(target);
}

function annotationTargetKind(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "kind");
}

function annotationNodeTarget(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "nodeTarget");
}

function annotationSourceRange(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "sourceRange");
}

export function cloneAnnotationTarget(
  target: EngineAnnotationTarget,
): EngineAnnotationTarget {
  if (isAnnotationTargetCandidate(target)) {
    const clonedTarget = cloneKnownAnnotationTarget(target);

    if (clonedTarget !== undefined) {
      return clonedTarget;
    }
  }

  return serializableTarget(target) as EngineAnnotationTarget;
}

function cloneDiagnosticTarget(target: unknown): unknown {
  if (isAnnotationTargetCandidate(target)) {
    const clonedTarget = cloneKnownAnnotationTarget(target);

    if (clonedTarget !== undefined) {
      return clonedTarget;
    }
  }

  return serializableTarget(target);
}

function cloneKnownAnnotationTarget(
  target: AnnotationTargetCandidate,
): EngineAnnotationTarget | undefined {
  const kind = annotationTargetKind(target);

  if (kind === "node") {
    const nodeTarget = cloneEngineTargetCandidate(annotationNodeTarget(target));

    if (nodeTarget === undefined) {
      return undefined;
    }

    return {
      kind: "node",
      nodeTarget,
    };
  }

  if (kind === "source") {
    const sourceRange = cloneSourceRangeCandidate(annotationSourceRange(target));

    if (sourceRange === undefined) {
      return undefined;
    }

    return {
      kind: "source",
      sourceRange,
    };
  }

  return undefined;
}

function cloneEngineTargetCandidate(target: unknown): EngineNodeTarget | undefined {
  if (!isPlainObject(target)) {
    return undefined;
  }

  const kind = ownDataProperty(target, "kind");
  const id = ownDataProperty(target, "id");
  const pathProperty = ownRuntimeProperty(target, "path");
  const nodeTypeProperty = ownRuntimeProperty(target, "nodeType");
  const sourceRangeProperty = ownRuntimeProperty(target, "sourceRange");
  const path = optionalDataPropertyValue(pathProperty);
  const nodeType = optionalDataPropertyValue(nodeTypeProperty);
  const sourceRange = optionalDataPropertyValue(sourceRangeProperty);

  if (kind !== "node" || typeof id !== "string") {
    return undefined;
  }

  const pathClone = path !== undefined ? cloneTargetPathCandidate(path) : undefined;
  const clonedSourceRange =
    sourceRange !== undefined ? cloneSourceRangeCandidate(sourceRange) : undefined;

  if (
    pathProperty.kind === "accessor" ||
    optionalDataPropertyIsInvalid(nodeTypeProperty) ||
    optionalDataPropertyIsInvalid(sourceRangeProperty) ||
    pathClone?.kind === "invalid" ||
    (nodeType !== undefined && typeof nodeType !== "string") ||
    (sourceRange !== undefined && clonedSourceRange === undefined)
  ) {
    return undefined;
  }

  return {
    kind,
    id,
    ...(pathClone?.kind === "cloned" ? { path: pathClone.path } : {}),
    ...(typeof nodeType === "string" ? { nodeType } : {}),
    ...(clonedSourceRange !== undefined ? { sourceRange: clonedSourceRange } : {}),
  };
}

function cloneTargetPathCandidate(path: unknown): TargetPathClone {
  if (!isArray(path)) {
    return { kind: "invalid" };
  }

  const length = arrayLength(path);

  if (length === undefined) {
    return { kind: "unavailable" };
  }

  if (length > MAX_NORMALIZED_ARRAY_LENGTH) {
    return { kind: "unavailable" };
  }

  const clonedPath: number[] = [];

  for (let index = 0; index < length; index += 1) {
    const segmentProperty = ownRuntimeProperty(
      path as unknown as Record<string, unknown>,
      String(index),
    );

    if (segmentProperty.kind === "unavailable") {
      return { kind: "unavailable" };
    }

    if (segmentProperty.kind !== "data") {
      return { kind: "invalid" };
    }

    if (!isNonNegativeInteger(segmentProperty.value)) {
      return { kind: "invalid" };
    }

    clonedPath.push(segmentProperty.value);
  }

  return { kind: "cloned", path: clonedPath };
}

function cloneSourceRangeCandidate(range: unknown): SourceRange | undefined {
  if (!isPlainObject(range)) {
    return undefined;
  }

  const start = cloneSourcePositionCandidate(ownDataProperty(range, "start"));
  const end = cloneSourcePositionCandidate(ownDataProperty(range, "end"));

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return { start, end };
}

function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: cloneSourcePosition(sourceRange.start),
    end: cloneSourcePosition(sourceRange.end),
  };
}

function cloneSourcePosition(position: SourcePosition): SourcePosition {
  return {
    line: position.line,
    column: position.column,
    ...(position.offset !== undefined ? { offset: position.offset } : {}),
  };
}

function cloneSourcePositionCandidate(
  position: unknown,
): SourcePosition | undefined {
  if (!isPlainObject(position)) {
    return undefined;
  }

  const line = ownDataProperty(position, "line");
  const column = ownDataProperty(position, "column");
  const offsetProperty = ownRuntimeProperty(position, "offset");
  const offset = optionalDataPropertyValue(offsetProperty);

  if (
    !isPositiveInteger(line) ||
    !isPositiveInteger(column) ||
    optionalDataPropertyIsInvalid(offsetProperty) ||
    (offset !== undefined && !isNonNegativeInteger(offset))
  ) {
    return undefined;
  }

  return {
    line,
    column,
    ...(offset !== undefined ? { offset } : {}),
  };
}

function isAnnotationTargetCandidate(
  target: unknown,
): target is AnnotationTargetCandidate {
  return typeof target === "object" && target !== null && !isArray(target);
}

function optionalDataPropertyValue(property: OwnRuntimeProperty): unknown {
  return property.kind === "data" ? property.value : undefined;
}

function optionalDataPropertyIsInvalid(property: OwnRuntimeProperty): boolean {
  return property.kind === "accessor" || property.kind === "unavailable";
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function sourceRangeIsInvalid(range: SourceRange): boolean {
  return (
    compareLineAndColumn(range.end, range.start) < 0 ||
    sourceOffsetsAreInvalid(range)
  );
}

function sourceRangeContains(container: SourceRange, target: SourceRange): boolean {
  return (
    compareLineAndColumn(container.start, target.start) <= 0 &&
    compareLineAndColumn(target.end, container.end) <= 0 &&
    sourceOffsetsAreContained(container, target)
  );
}

function compareLineAndColumn(
  left: SourcePosition,
  right: SourcePosition,
): number {
  return left.line - right.line || left.column - right.column;
}

function sourceOffsetsAreInvalid(range: SourceRange): boolean {
  return (
    range.start.offset !== undefined &&
    range.end.offset !== undefined &&
    range.end.offset < range.start.offset
  );
}

function sourceOffsetsAreContained(
  container: SourceRange,
  target: SourceRange,
): boolean {
  return (
    sourceOffsetIsContained(container, target.start.offset) &&
    sourceOffsetIsContained(container, target.end.offset)
  );
}

function sourceOffsetIsContained(
  container: SourceRange,
  offset: number | undefined,
): boolean {
  if (offset === undefined) {
    return true;
  }

  return (
    (container.start.offset === undefined || container.start.offset <= offset) &&
    (container.end.offset === undefined || offset <= container.end.offset)
  );
}
