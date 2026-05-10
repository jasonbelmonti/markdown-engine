import type { SourcePosition, SourceRange } from "./diagnostics.js";
import type { OwnRuntimeProperty } from "./annotation-target-runtime.js";
import {
  isPlainObject,
  ownDataProperty,
  ownRuntimeProperty,
} from "./annotation-target-runtime.js";

export function cloneSourceRangeCandidate(
  range: unknown,
): SourceRange | undefined {
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

export function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: cloneSourcePosition(sourceRange.start),
    end: cloneSourcePosition(sourceRange.end),
  };
}

export function sourceRangeIsInvalid(range: SourceRange): boolean {
  return (
    compareLineAndColumn(range.end, range.start) < 0 ||
    sourceOffsetsAreInvalid(range)
  );
}

export function sourceRangeContains(
  container: SourceRange,
  target: SourceRange,
): boolean {
  return (
    compareLineAndColumn(container.start, target.start) <= 0 &&
    compareLineAndColumn(target.end, container.end) <= 0 &&
    sourceOffsetsAreContained(container, target)
  );
}

export function compareSourcePositions(
  left: SourcePosition,
  right: SourcePosition,
): number {
  return (
    left.line - right.line ||
    left.column - right.column ||
    compareOptionalOffsets(left.offset, right.offset)
  );
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

function compareLineAndColumn(
  left: SourcePosition,
  right: SourcePosition,
): number {
  return left.line - right.line || left.column - right.column;
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
