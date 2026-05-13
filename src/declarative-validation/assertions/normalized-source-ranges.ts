import type { SourcePosition, SourceRange } from "../../api/diagnostics.js";

interface SourceCharacterSpan {
  startIndex: number;
  endIndex: number;
}

export function sourceRangeForNormalizedText(
  segmentRange: SourceRange,
  sourceText: string,
  normalizedText: string,
  normalizedStart: number,
  normalizedLength: number,
): SourceRange | undefined {
  if (normalizedLength <= 0) {
    return undefined;
  }

  const normalizedEnd = normalizedStart + normalizedLength - 1;

  if (normalizedStart < 0 || normalizedEnd >= normalizedText.length) {
    return undefined;
  }

  const sourceMap = normalizedSourceMap(sourceText, normalizedText);
  const start = sourceMap[normalizedStart];
  const end = sourceMap[normalizedEnd];

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return {
    start: sourcePositionAt(segmentRange.start, sourceText, start.startIndex),
    end: sourcePositionAt(segmentRange.start, sourceText, end.endIndex),
  };
}

function normalizedSourceMap(
  sourceText: string,
  normalizedText: string,
): SourceCharacterSpan[] {
  const sourceMap: SourceCharacterSpan[] = [];
  let sourceIndex = 0;
  let normalizedIndex = 0;

  while (
    sourceIndex < sourceText.length &&
    normalizedIndex < normalizedText.length
  ) {
    const sourceCharacter = sourceText[sourceIndex];
    const normalizedCharacter = normalizedText[normalizedIndex];

    if (sourceCharacter === normalizedCharacter) {
      sourceMap[normalizedIndex] = {
        startIndex: sourceIndex,
        endIndex: sourceIndex + 1,
      };
      sourceIndex += 1;
      normalizedIndex += 1;
      continue;
    }

    if (
      sourceCharacter === "\\" &&
      sourceText[sourceIndex + 1] === normalizedCharacter
    ) {
      sourceMap[normalizedIndex] = {
        startIndex: sourceIndex,
        endIndex: sourceIndex + 2,
      };
      sourceIndex += 2;
      normalizedIndex += 1;
      continue;
    }

    const linkDestinationEnd = linkDestinationEndIndex(sourceText, sourceIndex);

    if (linkDestinationEnd !== undefined) {
      sourceIndex = linkDestinationEnd;
      continue;
    }

    sourceIndex += 1;
  }

  return sourceMap;
}

function linkDestinationEndIndex(
  sourceText: string,
  sourceIndex: number,
): number | undefined {
  if (sourceText[sourceIndex] !== "]" || sourceText[sourceIndex + 1] !== "(") {
    return undefined;
  }

  let depth = 1;
  let cursor = sourceIndex + 2;

  while (cursor < sourceText.length) {
    const character = sourceText[cursor];

    if (character === "\\") {
      cursor += 2;
      continue;
    }

    if (character === "(") {
      depth += 1;
      cursor += 1;
      continue;
    }

    if (character === ")") {
      depth -= 1;
      cursor += 1;

      if (depth === 0) {
        return cursor;
      }

      continue;
    }

    cursor += 1;
  }

  return undefined;
}

function sourcePositionAt(
  segmentStart: SourcePosition,
  sourceText: string,
  sourceIndex: number,
): SourcePosition {
  let line = segmentStart.line;
  let column = segmentStart.column;

  for (const character of sourceText.slice(0, sourceIndex)) {
    if (character === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return {
    line,
    column,
    ...(segmentStart.offset !== undefined
      ? { offset: segmentStart.offset + sourceIndex }
      : {}),
  };
}
