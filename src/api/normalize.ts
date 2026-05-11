import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument, EngineDocumentVersion } from "./document.js";
import type { ParsedMarkdown } from "./parse.js";
import { cloneDiagnostics } from "../diagnostics/index.js";
import { hasOwnProperty } from "../internal/plain-record.js";
import { normalizeParsedMarkdown } from "../ir/index.js";
import type {
  NormalizationInput,
  NormalizationOptions,
} from "../ir/index.js";

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
  document: normalizeParsedMarkdown(
    toNormalizationInput(parsed),
    toNormalizationOptions(options),
  ),
  diagnostics: cloneDiagnostics(parsed.diagnostics),
});

function toNormalizationInput(parsed: ParsedMarkdown): NormalizationInput {
  return {
    markdown: parsed.markdown,
    ...(parsed.path !== undefined ? { path: parsed.path } : {}),
    ...(hasOwnProperty(parsed, "frontmatter")
      ? { frontmatter: parsed.frontmatter }
      : {}),
    document: parsed.document,
  };
}

function toNormalizationOptions(
  options: NormalizeOptions,
): NormalizationOptions {
  return {
    ...(options.documentVersion !== undefined
      ? { documentVersion: options.documentVersion }
      : {}),
    ...(options.preserveSourceLocations !== undefined
      ? { preserveSourceLocations: options.preserveSourceLocations }
      : {}),
  };
}
