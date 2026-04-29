import type { SourcePosition, SourceRange } from "../api/diagnostics.js";
import type { FrontmatterBlock, FrontmatterParseResult } from "./types.js";

interface LineSlice {
  content: string;
  contentStart: number;
  contentEnd: number;
  nextOffset: number;
}

export function extractFrontmatter(markdown: string): FrontmatterParseResult {
  const contentOffset = initialContentOffset(markdown);
  const contentStart = startPosition(contentOffset);
  const openingLine = readLine(markdown, contentOffset);

  if (openingLine?.content !== "---") {
    return {
      body: markdown.slice(contentOffset),
      bodyStart: contentStart,
      diagnostics: [],
    };
  }

  const frontmatterContentStart: SourcePosition = {
    line: 2,
    column: 1,
    offset: openingLine.nextOffset,
  };

  let currentOffset = openingLine.nextOffset;
  let currentLine = 2;

  while (currentOffset < markdown.length) {
    const line = readLine(markdown, currentOffset);

    if (line === undefined) {
      break;
    }

    if (line.content === "---") {
      const sourceRange: SourceRange = {
        start: contentStart,
        end: {
          line: currentLine,
          column: line.content.length + 1,
          offset: line.contentEnd,
        },
      };
      const frontmatter: FrontmatterBlock = {
        raw: markdown.slice(openingLine.nextOffset, line.contentStart),
        contentStart: frontmatterContentStart,
        sourceRange,
      };

      return {
        body: markdown.slice(line.nextOffset),
        bodyStart: bodyStartAfterClosingDelimiter(line, currentLine),
        diagnostics: [],
        frontmatter,
      };
    }

    currentOffset = line.nextOffset;
    currentLine += 1;
  }

  return {
    body: markdown.slice(contentOffset),
    bodyStart: contentStart,
    diagnostics: [],
  };
}

function initialContentOffset(markdown: string): number {
  return markdown.startsWith("\uFEFF") ? 1 : 0;
}

function startPosition(offset: number): SourcePosition {
  return {
    line: 1,
    column: 1,
    offset,
  };
}

function bodyStartAfterClosingDelimiter(
  line: LineSlice,
  lineNumber: number,
): SourcePosition {
  if (line.nextOffset === line.contentEnd) {
    return {
      line: lineNumber,
      column: line.content.length + 1,
      offset: line.contentEnd,
    };
  }

  return {
    line: lineNumber + 1,
    column: 1,
    offset: line.nextOffset,
  };
}

function readLine(text: string, offset: number): LineSlice | undefined {
  if (offset > text.length) {
    return undefined;
  }

  const contentStart = offset;
  let contentEnd = offset;

  while (contentEnd < text.length && !isLineBreak(text[contentEnd])) {
    contentEnd += 1;
  }

  let nextOffset = contentEnd;

  if (text[nextOffset] === "\r" && text[nextOffset + 1] === "\n") {
    nextOffset += 2;
  } else if (text[nextOffset] === "\n" || text[nextOffset] === "\r") {
    nextOffset += 1;
  }

  return {
    content: text.slice(contentStart, contentEnd),
    contentStart,
    contentEnd,
    nextOffset,
  };
}

function isLineBreak(character: string | undefined): boolean {
  return character === "\n" || character === "\r";
}
