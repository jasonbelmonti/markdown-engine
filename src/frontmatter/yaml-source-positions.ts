import type {
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";

interface SourceLineMarker {
  column: number;
  line: number;
  offset: number;
}

export interface YamlSourcePositionIndex {
  position(offset: number): SourcePosition;
  range(startOffset: number, endOffset: number): SourceRange;
}

export function createYamlSourcePositionIndex(
  text: string,
  base: SourcePosition,
): YamlSourcePositionIndex {
  let markers: SourceLineMarker[] | undefined;
  const baseOffset = base.offset ?? 0;

  function position(rawOffset: number): SourcePosition {
    const offset = clampOffset(rawOffset, text.length);
    const marker = markerAtOffset(
      (markers ??= sourceLineMarkers(text, base)),
      offset,
    );

    return {
      line: marker.line,
      column: marker.column + offset - marker.offset,
      offset: baseOffset + offset,
    };
  }

  return {
    position,
    range(startOffset, endOffset) {
      const start = clampOffset(startOffset, text.length);
      const end = clampOffset(Math.max(start, endOffset), text.length);

      return {
        start: position(start),
        end: position(end),
      };
    },
  };
}

function sourceLineMarkers(
  text: string,
  base: SourcePosition,
): SourceLineMarker[] {
  const markers: SourceLineMarker[] = [
    {
      column: base.column,
      line: base.line,
      offset: 0,
    },
  ];
  let line = base.line;

  for (let offset = 0; offset < text.length; offset += 1) {
    const character = text[offset];

    if (character === "\r") {
      line += 1;
      markers.push({ column: 1, line, offset: offset + 1 });

      if (text[offset + 1] === "\n") {
        markers.push({ column: 1, line, offset: offset + 2 });
        offset += 1;
      }
    } else if (character === "\n") {
      line += 1;
      markers.push({ column: 1, line, offset: offset + 1 });
    }
  }

  return markers;
}

function markerAtOffset(
  markers: readonly SourceLineMarker[],
  targetOffset: number,
): SourceLineMarker {
  let low = 0;
  let high = markers.length - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);

    if ((markers[middle]?.offset ?? 0) <= targetOffset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return markers[low] ?? { column: 1, line: 1, offset: 0 };
}

function clampOffset(offset: number, length: number): number {
  return Math.max(0, Math.min(offset, length));
}
