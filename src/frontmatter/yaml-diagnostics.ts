import { isNode } from "yaml";
import type { Range } from "yaml";

import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";

export interface YamlIssueLike {
  message?: unknown;
  pos?: unknown;
}

export function yamlIssueToDiagnostic(
  issue: YamlIssueLike,
  code: string,
  severity: MarkdownDiagnostic["severity"],
  raw: string,
  contentStart: SourcePosition,
  fallbackRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code,
    message: yamlIssueMessage(issue),
    severity,
    sourceRange: yamlIssueRange(issue, raw, contentStart) ?? fallbackRange,
  };
}

export function yamlMaterializationDiagnostic(
  error: unknown,
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message:
      error instanceof Error
        ? error.message
        : "YAML frontmatter could not be parsed.",
    severity: "error",
    sourceRange,
  };
}

export function nonStringYamlKeyDiagnostic(
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message: "YAML frontmatter mapping keys must be strings.",
    severity: "error",
    sourceRange,
  };
}

export function nonFiniteNumberDiagnostic(
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message:
      "YAML frontmatter contains non-finite numbers, which are not JSON-safe.",
    severity: "error",
    sourceRange,
  };
}

export function unsupportedJsonValueDiagnostic(
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message: "YAML frontmatter contains a value that is not JSON-safe.",
    severity: "error",
    sourceRange,
  };
}

export function cyclicYamlAliasDiagnostic(
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message:
      "YAML frontmatter contains cyclic alias references, which are not supported.",
    severity: "error",
    sourceRange,
  };
}

export function yamlNodeRange(
  node: unknown,
  raw: string,
  contentStart: SourcePosition,
): SourceRange | undefined {
  if (!isNode(node) || node.range === undefined || node.range === null) {
    return undefined;
  }

  return yamlRangeToSourceRange(node.range, raw, contentStart);
}

function yamlIssueMessage(issue: YamlIssueLike): string {
  if (typeof issue.message === "string") {
    return issue.message;
  }

  return "YAML frontmatter could not be parsed.";
}

function yamlIssueRange(
  issue: YamlIssueLike,
  raw: string,
  contentStart: SourcePosition,
): SourceRange | undefined {
  if (!Array.isArray(issue.pos) || typeof issue.pos[0] !== "number") {
    return undefined;
  }

  const startOffset = clampOffset(issue.pos[0], raw);
  let endOffset = startOffset;

  if (typeof issue.pos[1] === "number") {
    endOffset = clampOffset(issue.pos[1], raw);
  }

  return {
    start: positionFromOffset(raw, startOffset, contentStart),
    end: positionFromOffset(raw, Math.max(startOffset, endOffset), contentStart),
  };
}

function yamlRangeToSourceRange(
  range: Range,
  raw: string,
  contentStart: SourcePosition,
): SourceRange {
  const startOffset = clampOffset(range[0], raw);
  const endOffset = clampOffset(range[1], raw);

  return {
    start: positionFromOffset(raw, startOffset, contentStart),
    end: positionFromOffset(raw, Math.max(startOffset, endOffset), contentStart),
  };
}

function positionFromOffset(
  text: string,
  targetOffset: number,
  base: SourcePosition,
): SourcePosition {
  let line = base.line;
  let column = base.column;
  let offset = 0;

  while (offset < targetOffset) {
    const character = text[offset];

    if (character === "\r") {
      if (text[offset + 1] === "\n" && offset + 1 < targetOffset) {
        offset += 1;
      }

      line += 1;
      column = 1;
    } else if (character === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }

    offset += 1;
  }

  return {
    line,
    column,
    offset: (base.offset ?? 0) + targetOffset,
  };
}

function clampOffset(offset: number, text: string): number {
  return Math.max(0, Math.min(offset, text.length));
}
