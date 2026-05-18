import type { EngineDocumentVersion } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationResult } from "../../api/validate.js";
import type { DeclarativeValidationEvidence } from "../evidence/index.js";
import type { ValidationProfileSyntaxVersion } from "../profile/syntax-version.js";

export type DeclarativeValidationCliJsonResult =
  | DeclarativeValidationResult
  | DeclarativeValidationConfigErrorResult;

export interface DeclarativeValidationConfigErrorResult {
  valid: false;
  stage: "profile";
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly [];
  profile?: undefined;
  evidence?: undefined;
}

export interface DeclarativeValidationOptions {
  path?: string;
  includeEvidence?: boolean;
}

export interface DeclarativeValidationResult extends ValidationResult {
  profile: {
    syntaxVersion: ValidationProfileSyntaxVersion;
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
  };
  evidence?: DeclarativeValidationEvidence;
}
