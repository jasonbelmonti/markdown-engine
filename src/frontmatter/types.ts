import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";

export interface FrontmatterBlock {
  raw: string;
  contentStart: SourcePosition;
  sourceRange: SourceRange;
  value?: unknown;
}

export interface FrontmatterParseResult {
  body: string;
  bodyStart: SourcePosition;
  diagnostics: MarkdownDiagnostic[];
  frontmatter?: FrontmatterBlock;
}
