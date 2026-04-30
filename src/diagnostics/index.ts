import type { MarkdownDiagnostic, SourceRange } from "../api/diagnostics.js";

export function makeDiagnostic(
  diagnostic: MarkdownDiagnostic,
): MarkdownDiagnostic {
  return cloneDiagnostic(diagnostic);
}

export function cloneDiagnostics(
  diagnostics: readonly MarkdownDiagnostic[],
): MarkdownDiagnostic[] {
  return diagnostics.map((diagnostic) => cloneDiagnostic(diagnostic));
}

export function cloneDiagnostic(
  diagnostic: MarkdownDiagnostic,
): MarkdownDiagnostic {
  return {
    code: diagnostic.code,
    ...(diagnostic.ruleId !== undefined ? { ruleId: diagnostic.ruleId } : {}),
    message: diagnostic.message,
    severity: diagnostic.severity,
    ...(diagnostic.sourceRange !== undefined
      ? { sourceRange: cloneSourceRange(diagnostic.sourceRange) }
      : {}),
  };
}

export function hasErrorDiagnostic(
  diagnostics: readonly MarkdownDiagnostic[],
): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function cloneSourceRange(sourceRange: SourceRange): SourceRange {
  return {
    start: { ...sourceRange.start },
    end: { ...sourceRange.end },
  };
}
