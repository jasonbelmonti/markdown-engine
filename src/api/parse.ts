import type { MarkdownDiagnostic } from "./diagnostics.js";

export interface ParseOptions {
  path?: string;
}

export interface ParsedMarkdown {
  markdown: string;
  path?: string;
  frontmatter?: unknown;
  diagnostics: MarkdownDiagnostic[];
}

export interface ParseResult {
  parsed: ParsedMarkdown;
  diagnostics: MarkdownDiagnostic[];
}

export type ParseFunction = (
  markdown: string,
  options?: ParseOptions,
) => ParseResult;
