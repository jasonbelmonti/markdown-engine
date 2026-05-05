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

const ACCESSOR_PLACEHOLDER = "[Accessor]";
const UNAVAILABLE_PLACEHOLDER = "[Unavailable]";

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
  const nodeTarget = cloneEngineTargetCandidate(annotationTargetValue(target));

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

function sourceTargetDiagnostics(
  target: AnnotationTargetCandidate,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  const range = cloneSourceRangeCandidate(annotationTargetRange(target));

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
    const serialized = JSON.stringify(normalizeSortValue(target, new WeakSet()));

    return serialized ?? String(target);
  } catch {
    return typeof target === "object" && target !== null
      ? objectTag(target)
      : String(target);
  }
}

function serializableTarget(target: unknown): unknown {
  return normalizeSortValue(target, new WeakSet());
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
      return normalizeArrayValue(value, path);
    }

    if (isPlainObject(value)) {
      const keys = enumerableOwnKeys(value);

      if (keys === undefined) {
        return UNAVAILABLE_PLACEHOLDER;
      }

      return Object.fromEntries(
        keys
          .sort(compareStrings)
          .map((key) => [key, normalizePlainObjectProperty(value, key, path)]),
      );
    }

    return objectTag(value);
  } finally {
    path.delete(value);
  }
}

function normalizeArrayValue(
  value: readonly unknown[],
  path: WeakSet<object>,
): unknown {
  const length = arrayLength(value);

  if (length === undefined) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return Array.from({ length }, (_item, index) =>
    normalizeArrayProperty(value, index, path),
  );
}

function arrayLength(value: readonly unknown[]): number | undefined {
  const descriptor = ownPropertyDescriptor(
    value as unknown as Record<string, unknown>,
    "length",
  );

  return descriptor !== undefined &&
    "value" in descriptor &&
    isNonNegativeInteger(descriptor.value)
    ? descriptor.value
    : undefined;
}

function normalizeArrayProperty(
  value: readonly unknown[],
  index: number,
  path: WeakSet<object>,
): unknown {
  const descriptor = ownPropertyDescriptor(
    value as unknown as Record<string, unknown>,
    String(index),
  );

  if (descriptor === undefined) {
    return undefined;
  }

  if (!("value" in descriptor)) {
    return ACCESSOR_PLACEHOLDER;
  }

  return normalizeSortValue(descriptor.value, path);
}

function normalizePlainObjectProperty(
  value: Record<string, unknown>,
  key: string,
  path: WeakSet<object>,
): unknown {
  const descriptor = ownPropertyDescriptor(value, key);

  if (descriptor === undefined) {
    return undefined;
  }

  if (!("value" in descriptor)) {
    return ACCESSOR_PLACEHOLDER;
  }

  return normalizeSortValue(descriptor.value, path);
}

function annotationTargetKind(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "kind");
}

function annotationTargetValue(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "target");
}

function annotationTargetRange(target: AnnotationTargetCandidate): unknown {
  return ownDataProperty(target, "range");
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
    const nodeTarget = cloneEngineTargetCandidate(annotationTargetValue(target));

    if (nodeTarget === undefined) {
      return undefined;
    }

    return {
      kind: "node",
      target: nodeTarget,
    };
  }

  if (kind === "source") {
    const range = cloneSourceRangeCandidate(annotationTargetRange(target));

    if (range === undefined) {
      return undefined;
    }

    return {
      kind: "source",
      range,
    };
  }

  return undefined;
}

function cloneEngineTargetCandidate(target: unknown): EngineTarget | undefined {
  if (!isPlainObject(target)) {
    return undefined;
  }

  const kind = ownDataProperty(target, "kind");
  const id = ownDataProperty(target, "id");
  const path = ownDataProperty(target, "path");
  const nodeType = ownDataProperty(target, "nodeType");
  const sourceRange = ownDataProperty(target, "sourceRange");

  if (kind !== "node" || typeof id !== "string") {
    return undefined;
  }

  const clonedPath = path !== undefined ? cloneTargetPathCandidate(path) : undefined;
  const clonedSourceRange =
    sourceRange !== undefined ? cloneSourceRangeCandidate(sourceRange) : undefined;

  if (
    (path !== undefined && clonedPath === undefined) ||
    (nodeType !== undefined && typeof nodeType !== "string") ||
    (sourceRange !== undefined && clonedSourceRange === undefined)
  ) {
    return undefined;
  }

  return {
    kind,
    id,
    ...(clonedPath !== undefined ? { path: clonedPath } : {}),
    ...(typeof nodeType === "string" ? { nodeType } : {}),
    ...(clonedSourceRange !== undefined ? { sourceRange: clonedSourceRange } : {}),
  };
}

function cloneTargetPathCandidate(path: unknown): readonly number[] | undefined {
  if (!Array.isArray(path)) {
    return undefined;
  }

  try {
    return path.every(
      (segment) =>
        typeof segment === "number" &&
        Number.isInteger(segment) &&
        segment >= 0,
    )
      ? [...path]
      : undefined;
  } catch {
    return undefined;
  }
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
  const offset = ownDataProperty(position, "offset");

  if (
    !isPositiveInteger(line) ||
    !isPositiveInteger(column) ||
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
  return typeof target === "object" && target !== null && !Array.isArray(target);
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

  const prototype = objectPrototype(value);

  return prototype === Object.prototype || prototype === null;
}

function ownDataProperty(
  value: Record<string, unknown>,
  key: string,
): unknown {
  const descriptor = ownPropertyDescriptor(value, key);

  return descriptor !== undefined && "value" in descriptor
    ? descriptor.value
    : undefined;
}

function ownPropertyDescriptor(
  value: Record<string, unknown>,
  key: string,
): PropertyDescriptor | undefined {
  try {
    return Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return undefined;
  }
}

function enumerableOwnKeys(value: Record<string, unknown>): string[] | undefined {
  try {
    return Object.keys(value);
  } catch {
    return undefined;
  }
}

function objectPrototype(value: object): object | null | undefined {
  try {
    return Object.getPrototypeOf(value);
  } catch {
    return undefined;
  }
}

function objectTag(value: object): string {
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return UNAVAILABLE_PLACEHOLDER;
  }
}
