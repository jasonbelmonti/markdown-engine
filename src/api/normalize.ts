import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument } from "./document.js";
import type { ParsedMarkdown } from "./parse.js";

export interface NormalizeOptions {
  preserveSourceLocations?: boolean;
}

export interface NormalizeResult {
  document: EngineDocument;
  diagnostics: MarkdownDiagnostic[];
}

export type NormalizeFunction = (
  parsed: ParsedMarkdown,
  options?: NormalizeOptions,
) => NormalizeResult;
