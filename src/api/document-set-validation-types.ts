import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
  JsonSafeValue,
  ValidationProfile,
} from "./declarative-validation.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { NormalizeOptions } from "./normalize.js";

export type ValidateDocumentSetProfileInput =
  | string
  | JsonSafeValue
  | ValidationProfile;

export interface ValidateDocumentSetEntry {
  path: string;
  markdown: string;
  profile: ValidateDocumentSetProfileInput;
  profilePath?: string;
}

export interface ValidateDocumentSetOptions {
  documentVersion?: NormalizeOptions["documentVersion"];
  preserveSourceLocations?: NormalizeOptions["preserveSourceLocations"];
  includeEvidence?: DeclarativeValidationOptions["includeEvidence"];
}

export interface ValidateDocumentSetEntryResult {
  path: string;
  profilePath?: string;
  diagnostics: MarkdownDiagnostic[];
  parseDiagnostics: MarkdownDiagnostic[];
  normalizationDiagnostics: MarkdownDiagnostic[];
  profileDiagnostics: MarkdownDiagnostic[];
  validationDiagnostics: MarkdownDiagnostic[];
  validationResult?: DeclarativeValidationResult;
}

export interface ValidateDocumentSetResult {
  valid: boolean;
  diagnostics: MarkdownDiagnostic[];
  entries: ValidateDocumentSetEntryResult[];
}

export type ValidateDocumentSetFunction = (
  entries: readonly ValidateDocumentSetEntry[],
  options?: ValidateDocumentSetOptions,
) => ValidateDocumentSetResult;
