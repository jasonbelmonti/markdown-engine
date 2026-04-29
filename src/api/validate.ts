import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument } from "./document.js";

export interface ValidationConfig {
  rules?: Record<string, unknown>;
}

export interface ValidateOptions {
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: MarkdownDiagnostic[];
}

export type ValidateFunction = (
  document: EngineDocument,
  config?: ValidationConfig,
  options?: ValidateOptions,
) => ValidationResult;
