import { parseDocument } from "yaml";

import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";

interface YamlIssueLike {
  message?: unknown;
  pos?: unknown;
}

interface ParsedYamlFrontmatter {
  value?: unknown;
  valueParsed: boolean;
  diagnostics: MarkdownDiagnostic[];
}

export function parseYamlFrontmatter(
  raw: string,
  contentStart: SourcePosition,
  fallbackRange: SourceRange,
): ParsedYamlFrontmatter {
  if (raw.trim().length === 0) {
    return {
      value: {},
      valueParsed: true,
      diagnostics: [],
    };
  }

  const document = parseDocument(raw, {
    prettyErrors: false,
  });

  const errorDiagnostics = document.errors.map((error) =>
    yamlIssueToDiagnostic(
      error,
      "frontmatter.yaml.invalid",
      "error",
      raw,
      contentStart,
      fallbackRange,
    ),
  );
  const warningDiagnostics = document.warnings.map((warning) =>
    yamlIssueToDiagnostic(
      warning,
      "frontmatter.yaml.warning",
      "warning",
      raw,
      contentStart,
      fallbackRange,
    ),
  );
  const diagnostics: MarkdownDiagnostic[] = [
    ...errorDiagnostics,
    ...warningDiagnostics,
  ];

  if (document.errors.length > 0) {
    return {
      valueParsed: false,
      diagnostics,
    };
  }

  try {
    const value = document.toJSON();

    if (containsCycle(value)) {
      return {
        valueParsed: false,
        diagnostics: [
          ...diagnostics,
          cyclicYamlAliasDiagnostic(fallbackRange),
        ],
      };
    }

    return {
      value,
      valueParsed: true,
      diagnostics,
    };
  } catch (error) {
    return {
      valueParsed: false,
      diagnostics: [
        ...diagnostics,
        yamlMaterializationDiagnostic(error, fallbackRange),
      ],
    };
  }
}

function yamlIssueToDiagnostic(
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

function yamlIssueMessage(issue: YamlIssueLike): string {
  if (typeof issue.message === "string") {
    return issue.message;
  }

  return "YAML frontmatter could not be parsed.";
}

function yamlMaterializationDiagnostic(
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

function cyclicYamlAliasDiagnostic(sourceRange: SourceRange): MarkdownDiagnostic {
  return {
    code: "frontmatter.yaml.invalid",
    message:
      "YAML frontmatter contains cyclic alias references, which are not supported.",
    severity: "error",
    sourceRange,
  };
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

function containsCycle(value: unknown): boolean {
  return containsCycleInPath(value, new WeakSet<object>());
}

function containsCycleInPath(
  value: unknown,
  ancestors: WeakSet<object>,
): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (ancestors.has(value)) {
    return true;
  }

  ancestors.add(value);

  for (const child of Object.values(value)) {
    if (containsCycleInPath(child, ancestors)) {
      return true;
    }
  }

  ancestors.delete(value);

  return false;
}
