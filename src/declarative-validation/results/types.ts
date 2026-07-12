import type { EngineDocumentVersion } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  ValidationResult,
  ValidationRuleResult,
} from "../../api/validate.js";
import type { DeclarativeValidationEvidence } from "../evidence/index.js";
import type {
  PROFILE_SYNTAX_VERSION,
  PROFILE_SYNTAX_VERSION_V2,
} from "../profile/syntax-version.js";

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
  sourceText?: string;
}

export type DeclarativeValidationResult =
  | DeclarativeValidationResultV1
  | DeclarativeValidationResultV2;

export interface DeclarativeValidationResultV1 extends ValidationResult {
  profile: {
    syntaxVersion: typeof PROFILE_SYNTAX_VERSION;
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
  };
  evidence?: DeclarativeValidationEvidence<ValidationRuleResult>;
}

export type DeclarativeValidationRuleStatus = "passed" | "failed" | "skipped";

export interface DeclarativeValidationRuleResultV2
  extends ValidationRuleResult {
  status: DeclarativeValidationRuleStatus;
  when?: DeclarativeValidationApplicabilityResult;
  evaluation: DeclarativeValidationRuleEvaluationResult;
}

export type DeclarativeValidationRuleEvaluationResult =
  | DeclarativeValidationSkippedEvaluationResult
  | DeclarativeValidationAssertionsEvaluationResult
  | DeclarativeValidationAnyOfEvaluationResult
  | DeclarativeValidationAllOfEvaluationResult;

export interface DeclarativeValidationApplicabilityResult {
  status: "matched" | "notMatched";
  diagnostics: MarkdownDiagnostic[];
}

export interface DeclarativeValidationSkippedEvaluationResult {
  kind: "skipped";
  reason: "whenNotMatched";
}

export interface DeclarativeValidationAssertionsEvaluationResult {
  kind: "assertions";
  diagnostics: MarkdownDiagnostic[];
}

export interface DeclarativeValidationAnyOfEvaluationResult {
  kind: "anyOf";
  selectedBranch?: DeclarativeValidationBranchReference;
  branches: DeclarativeValidationBranchResult[];
}

export interface DeclarativeValidationAllOfEvaluationResult {
  kind: "allOf";
  branches: DeclarativeValidationBranchResult[];
}

export interface DeclarativeValidationBranchReference {
  branchIndex: number;
  label?: string;
}

export interface DeclarativeValidationBranchResult {
  branchIndex: number;
  label?: string;
  status: Exclude<DeclarativeValidationRuleStatus, "skipped">;
  diagnostics: MarkdownDiagnostic[];
}

export interface DeclarativeValidationResultV2 extends ValidationResult {
  ruleResults: DeclarativeValidationRuleResultV2[];
  profile: {
    syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2;
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
    evaluatedRuleCount: number;
    skippedRuleCount: number;
  };
  evidence?: DeclarativeValidationEvidence<DeclarativeValidationRuleResultV2>;
}
