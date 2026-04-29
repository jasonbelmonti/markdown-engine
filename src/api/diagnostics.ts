export type MarkdownDiagnosticSeverity = "error" | "warning" | "info";

export interface SourcePosition {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface MarkdownDiagnostic {
  code: string;
  message: string;
  severity: MarkdownDiagnosticSeverity;
  sourceRange?: SourceRange;
}
