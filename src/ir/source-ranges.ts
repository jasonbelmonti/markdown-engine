import type { SourceRange } from "../api/diagnostics.js";

export interface SourceOffsetBounds {
  startOffset: number;
  endOffset: number;
}

export function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: { ...sourceRange.start },
    end: { ...sourceRange.end },
  };
}

export function sourceOffsetBounds(
  sourceRange: SourceRange | undefined,
  sourceLength: number,
): SourceOffsetBounds | undefined {
  const startOffset = sourceRange?.start.offset;
  const endOffset = sourceRange?.end.offset;

  if (
    typeof startOffset !== "number" ||
    typeof endOffset !== "number" ||
    !Number.isInteger(startOffset) ||
    !Number.isInteger(endOffset) ||
    startOffset < 0 ||
    endOffset < startOffset ||
    endOffset > sourceLength
  ) {
    return undefined;
  }

  return { startOffset, endOffset };
}
