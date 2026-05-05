import type { SourcePosition, SourceRange } from "./diagnostics.js";
import type {
  EngineAnnotation,
  EngineAnnotationTarget,
  EngineDocument,
  EngineTarget,
  EngineTargetDiagnostic,
} from "./document.js";
import { documentQueries } from "./document-queries.js";

type AnnotationTargetCandidate = {
  kind?: unknown;
  range?: unknown;
  target?: unknown;
};

interface SortableTargetDiagnostic {
  diagnostic: EngineTargetDiagnostic;
  order: number;
}

export function annotationTargetDiagnostics(
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
): EngineTargetDiagnostic[] {
  const validTargetIds = documentTargetIds(document);

  return annotations
    .flatMap((annotation, order) =>
      diagnosticsForAnnotation(
        annotation.target,
        validTargetIds,
        document.sourceRange,
        order,
      ),
    )
    .sort(compareSortableDiagnostics)
    .map(({ diagnostic }) => diagnostic);
}

export function cloneAnnotation<TPayload>(
  annotation: EngineAnnotation<TPayload>,
): EngineAnnotation<TPayload> {
  return {
    ...annotation,
    target: cloneAnnotationTarget(annotation.target),
  };
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

  if (target.kind === "node") {
    return nodeTargetDiagnostics(target, validTargetIds, order);
  }

  if (target.kind === "source") {
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
  order: number,
): SortableTargetDiagnostic[] {
  if (!isNodeTarget(target.target)) {
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

  if (validTargetIds.has(target.target.id)) {
    return [];
  }

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.unknown",
        message: `Annotation target '${target.target.id}' does not exist in the document.`,
        severity: "error",
        ...(target.target.sourceRange !== undefined
          ? { sourceRange: cloneSourceRange(target.target.sourceRange) }
          : {}),
        target,
      },
      order,
    ),
  ];
}

function sourceTargetDiagnostics(
  target: AnnotationTargetCandidate,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  if (!isSourceRange(target.range)) {
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

  if (sourceRangeIsInvalid(target.range)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range ends before it starts.",
          severity: "error",
          sourceRange: cloneSourceRange(target.range),
          target,
        },
        order,
      ),
    ];
  }

  if (
    documentSourceRange !== undefined &&
    !sourceRangeContains(documentSourceRange, target.range)
  ) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.outOfBounds",
          message:
            "Annotation source target range must be contained by the document source range.",
          severity: "error",
          sourceRange: cloneSourceRange(target.range),
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
      target: serializableTarget(diagnostic.target),
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
  const offsetComparison =
    left.offset !== undefined && right.offset !== undefined
      ? left.offset - right.offset
      : 0;

  return (
    left.line - right.line ||
    left.column - right.column ||
    offsetComparison
  );
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
    const serialized = JSON.stringify(normalizeSortValue(target, new WeakSet()));

    return serialized ?? String(target);
  } catch {
    return Object.prototype.toString.call(target);
  }
}

function serializableTarget(target: unknown): unknown {
  return normalizeSortValue(target, new WeakSet());
}

function normalizeSortValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => normalizeSortValue(item, seen));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeSortValue(value[key], seen)]),
    );
  }

  return Object.prototype.toString.call(value);
}

function cloneAnnotationTarget(target: EngineAnnotationTarget): EngineAnnotationTarget {
  if (isAnnotationTargetCandidate(target)) {
    if (target.kind === "node" && isNodeTarget(target.target)) {
      return {
        kind: "node",
        target: cloneEngineTarget(target.target),
      };
    }

    if (target.kind === "source" && isSourceRange(target.range)) {
      return {
        kind: "source",
        range: cloneSourceRange(target.range),
      };
    }
  }

  return serializableTarget(target) as EngineAnnotationTarget;
}

function cloneEngineTarget(target: EngineTarget): EngineTarget {
  return {
    kind: target.kind,
    id: target.id,
    ...(target.path !== undefined ? { path: [...target.path] } : {}),
    ...(target.nodeType !== undefined ? { nodeType: target.nodeType } : {}),
    ...(target.sourceRange !== undefined
      ? { sourceRange: cloneSourceRange(target.sourceRange) }
      : {}),
  };
}

function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: { ...sourceRange.start },
    end: { ...sourceRange.end },
  };
}

function isAnnotationTargetCandidate(
  target: unknown,
): target is AnnotationTargetCandidate {
  return typeof target === "object" && target !== null && !Array.isArray(target);
}

function isNodeTarget(target: unknown): target is EngineTarget {
  if (!isPlainObject(target)) {
    return false;
  }

  if (target.kind !== "node" || typeof target.id !== "string") {
    return false;
  }

  if (target.path !== undefined && !isTargetPath(target.path)) {
    return false;
  }

  if (target.nodeType !== undefined && typeof target.nodeType !== "string") {
    return false;
  }

  return target.sourceRange === undefined || isSourceRange(target.sourceRange);
}

function isTargetPath(path: unknown): path is readonly number[] {
  return (
    Array.isArray(path) &&
    path.every(
      (segment) =>
        typeof segment === "number" &&
        Number.isInteger(segment) &&
        segment >= 0,
    )
  );
}

function isSourceRange(range: unknown): range is SourceRange {
  return (
    isPlainObject(range) &&
    isSourcePosition(range.start) &&
    isSourcePosition(range.end)
  );
}

function isSourcePosition(position: unknown): position is SourcePosition {
  return (
    isPlainObject(position) &&
    isPositiveInteger(position.line) &&
    isPositiveInteger(position.column) &&
    (position.offset === undefined || isNonNegativeInteger(position.offset))
  );
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
  if (
    container.start.offset === undefined ||
    container.end.offset === undefined ||
    target.start.offset === undefined ||
    target.end.offset === undefined
  ) {
    return true;
  }

  return (
    container.start.offset <= target.start.offset &&
    target.end.offset <= container.end.offset
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
