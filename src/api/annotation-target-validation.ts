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

const unreadableProperty = Symbol("unreadableProperty");

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

  const kind = readProperty(target, "kind");

  if (kind === "node") {
    return nodeTargetDiagnostics(target, validTargetIds, order);
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
  order: number,
): SortableTargetDiagnostic[] {
  const nodeTarget = readProperty(target, "target");

  if (!isNodeTarget(nodeTarget)) {
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

  const targetId = readProperty(nodeTarget, "id");

  if (typeof targetId !== "string") {
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

  if (validTargetIds.has(targetId)) {
    return [];
  }

  const sourceRange = readProperty(nodeTarget, "sourceRange");

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.unknown",
        message: `Annotation target '${targetId}' does not exist in the document.`,
        severity: "error",
        ...(isSourceRange(sourceRange)
          ? { sourceRange: cloneSourceRange(sourceRange) }
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
  const targetRange = readProperty(target, "range");

  if (!isSourceRange(targetRange)) {
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

  const range = cloneSourceRange(targetRange);

  if (sourceRangeIsInvalid(range)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range ends before it starts.",
          severity: "error",
          sourceRange: range,
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
          sourceRange: range,
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
  const serializedTarget = serializableTarget(target);

  try {
    const serialized = JSON.stringify(serializedTarget);

    return serialized ?? String(serializedTarget);
  } catch {
    return objectTag(target);
  }
}

function serializableTarget(target: unknown): unknown {
  try {
    return normalizeSortValue(target, new WeakSet());
  } catch {
    return objectTag(target);
  }
}

function normalizeSortValue(value: unknown, path: WeakSet<object>): unknown {
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

  if (path.has(value)) {
    return "[Circular]";
  }

  path.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((item) => normalizeSortValue(item, path));
    }

    if (isPlainObject(value)) {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, normalizePropertyValue(value, key, path)]),
      );
    }

    return objectTag(value);
  } finally {
    path.delete(value);
  }
}

function normalizePropertyValue(
  value: Record<string, unknown>,
  key: string,
  path: WeakSet<object>,
): unknown {
  try {
    return normalizeSortValue(value[key], path);
  } catch {
    return "[Unserializable]";
  }
}

function cloneAnnotationTarget(target: EngineAnnotationTarget): EngineAnnotationTarget {
  if (isAnnotationTargetCandidate(target)) {
    const kind = readProperty(target, "kind");
    const nodeTarget = readProperty(target, "target");
    const range = readProperty(target, "range");

    if (kind === "node" && isNodeTarget(nodeTarget)) {
      return {
        kind: "node",
        target: cloneEngineTarget(nodeTarget),
      };
    }

    if (kind === "source" && isSourceRange(range)) {
      return {
        kind: "source",
        range: cloneSourceRange(range),
      };
    }
  }

  return serializableTarget(target) as EngineAnnotationTarget;
}

function cloneEngineTarget(target: EngineTarget): EngineTarget {
  const id = readProperty(target, "id");
  const path = readProperty(target, "path");
  const nodeType = readProperty(target, "nodeType");
  const sourceRange = readProperty(target, "sourceRange");

  return {
    kind: "node",
    id: typeof id === "string" ? id : "",
    ...(isTargetPath(path) ? { path: [...path] } : {}),
    ...(typeof nodeType === "string" ? { nodeType } : {}),
    ...(isSourceRange(sourceRange)
      ? { sourceRange: cloneSourceRange(sourceRange) }
      : {}),
  };
}

function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  const start = readProperty(sourceRange, "start");
  const end = readProperty(sourceRange, "end");

  return {
    start: isSourcePosition(start)
      ? cloneSourcePosition(start)
      : { line: 1, column: 1 },
    end: isSourcePosition(end)
      ? cloneSourcePosition(end)
      : { line: 1, column: 1 },
  };
}

function cloneSourcePosition(position: SourcePosition): SourcePosition {
  const line = readProperty(position, "line");
  const column = readProperty(position, "column");
  const offset = readProperty(position, "offset");

  return {
    line: isPositiveInteger(line) ? line : 1,
    column: isPositiveInteger(column) ? column : 1,
    ...(isNonNegativeInteger(offset) ? { offset } : {}),
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

  const kind = readProperty(target, "kind");
  const id = readProperty(target, "id");
  const path = readProperty(target, "path");
  const nodeType = readProperty(target, "nodeType");
  const sourceRange = readProperty(target, "sourceRange");

  if (kind !== "node" || typeof id !== "string") {
    return false;
  }

  if (path !== undefined && !isTargetPath(path)) {
    return false;
  }

  if (nodeType !== undefined && typeof nodeType !== "string") {
    return false;
  }

  return sourceRange === undefined || isSourceRange(sourceRange);
}

function isTargetPath(path: unknown): path is readonly number[] {
  try {
    return (
      Array.isArray(path) &&
      path.every(
        (segment) =>
          typeof segment === "number" &&
          Number.isInteger(segment) &&
          segment >= 0,
      )
    );
  } catch {
    return false;
  }
}

function isSourceRange(range: unknown): range is SourceRange {
  if (!isPlainObject(range)) {
    return false;
  }

  return (
    isSourcePosition(readProperty(range, "start")) &&
    isSourcePosition(readProperty(range, "end"))
  );
}

function isSourcePosition(position: unknown): position is SourcePosition {
  if (!isPlainObject(position)) {
    return false;
  }

  const line = readProperty(position, "line");
  const column = readProperty(position, "column");
  const offset = readProperty(position, "offset");

  return (
    isPositiveInteger(line) &&
    isPositiveInteger(column) &&
    (offset === undefined || isNonNegativeInteger(offset))
  );
}

function readProperty(value: object, key: string): unknown {
  try {
    return (value as Record<string, unknown>)[key];
  } catch {
    return unreadableProperty;
  }
}

function isUnreadableProperty(value: unknown): value is typeof unreadableProperty {
  return value === unreadableProperty;
}

function isPositiveInteger(value: unknown): value is number {
  return (
    !isUnreadableProperty(value) &&
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    !isUnreadableProperty(value) &&
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
  );
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

  let prototype: unknown;

  try {
    prototype = Object.getPrototypeOf(value);
  } catch {
    return false;
  }

  return prototype === Object.prototype || prototype === null;
}

function objectTag(value: unknown): string {
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return "[Unserializable]";
  }
}
