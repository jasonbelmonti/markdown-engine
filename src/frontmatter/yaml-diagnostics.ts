import { isNode } from "yaml";
import type { Range } from "yaml";

import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";
import {
  createYamlSourcePositionIndex,
  type YamlSourcePositionIndex,
} from "./yaml-source-positions.js";

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
  return yamlIssueToDiagnosticFromIndex(
    issue,
    code,
    severity,
    createYamlSourcePositionIndex(raw, contentStart),
    fallbackRange,
  );
}

export function yamlIssueToDiagnosticFromIndex(
  issue: YamlIssueLike,
  code: string,
  severity: MarkdownDiagnostic["severity"],
  sourcePositions: YamlSourcePositionIndex,
  fallbackRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code,
    message: yamlIssueMessage(issue),
    severity,
    sourceRange: yamlIssueRange(issue, sourcePositions) ?? fallbackRange,
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
  return yamlNodeRangeFromIndex(
    node,
    createYamlSourcePositionIndex(raw, contentStart),
  );
}

export function yamlNodeRangeFromIndex(
  node: unknown,
  sourcePositions: YamlSourcePositionIndex,
): SourceRange | undefined {
  if (!isNode(node) || node.range === undefined || node.range === null) {
    return undefined;
  }

  return yamlRangeToSourceRange(node.range, sourcePositions);
}

function yamlIssueMessage(issue: YamlIssueLike): string {
  if (typeof issue.message === "string") {
    return issue.message;
  }

  return "YAML frontmatter could not be parsed.";
}

function yamlIssueRange(
  issue: YamlIssueLike,
  sourcePositions: YamlSourcePositionIndex,
): SourceRange | undefined {
  if (!Array.isArray(issue.pos) || typeof issue.pos[0] !== "number") {
    return undefined;
  }

  const startOffset = issue.pos[0];
  let endOffset = startOffset;

  if (typeof issue.pos[1] === "number") {
    endOffset = issue.pos[1];
  }

  return sourcePositions.range(startOffset, endOffset);
}

function yamlRangeToSourceRange(
  range: Range,
  sourcePositions: YamlSourcePositionIndex,
): SourceRange {
  return sourcePositions.range(range[0], range[1]);
}
