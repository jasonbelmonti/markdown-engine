import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument, EngineDocumentVersion } from "./document.js";
import type { ParsedMarkdown } from "./parse.js";
import { cloneDiagnostics } from "../diagnostics/index.js";
import { normalizeParsedMarkdown } from "../ir/index.js";

export interface NormalizeOptions {
  documentVersion?: EngineDocumentVersion;
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

export const normalize: NormalizeFunction = (parsed, options = {}) => ({
  document: normalizeParsedMarkdown(parsed, options),
  diagnostics: cloneDiagnostics(parsed.diagnostics),
});
