import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { EngineDocument } from "../api/document.js";

export interface MarkdownBodyParseOptions {
  path?: string;
  lineOffset?: number;
  offsetOffset?: number;
}

export interface MarkdownBodyParseResult {
  document: EngineDocument;
  diagnostics: MarkdownDiagnostic[];
}
