import type { SourceRange } from "./diagnostics.js";
import type { EngineTargetDiagnostic } from "./document.js";
import {
  FUNCTION_PLACEHOLDER,
  normalizeRuntimeValue,
  UNAVAILABLE_PLACEHOLDER,
} from "./annotation-target-runtime.js";
import { cloneDiagnosticTarget } from "./annotation-target-cloning.js";
import { compareSourcePositions } from "./annotation-source-range.js";

export interface SortableTargetDiagnostic {
  diagnostic: EngineTargetDiagnostic;
  order: number;
}

export function sortableDiagnostic(
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

export function compareSortableDiagnostics(
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
