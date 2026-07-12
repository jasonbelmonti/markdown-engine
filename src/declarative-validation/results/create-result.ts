import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../../diagnostics/index.js";
import { createDeclarativeValidationEvidence } from "../evidence/index.js";
import type { ValidationProfile } from "../profile/index.js";
import {
  PROFILE_SYNTAX_VERSION as PROFILE_SYNTAX_VERSION_VALUE,
  PROFILE_SYNTAX_VERSION_V2 as PROFILE_SYNTAX_VERSION_V2_VALUE,
} from "../profile/syntax-version.js";
import {
  cloneBaseValidationRuleResult,
  cloneV2ValidationRuleResult,
} from "./clone-rule-result.js";
import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
  DeclarativeValidationResultV1,
  DeclarativeValidationResultV2,
  DeclarativeValidationRuleResultV2,
} from "./types.js";

interface CreateDeclarativeValidationResultInput {
  document: EngineDocument;
  profile: ValidationProfile;
  ruleResults: readonly ValidationRuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
  options: DeclarativeValidationOptions;
}

export function createDeclarativeValidationResult({
  document,
  profile,
  ruleResults,
  diagnostics,
  options,
}: CreateDeclarativeValidationResultInput): DeclarativeValidationResult {
  return profile.syntaxVersion === PROFILE_SYNTAX_VERSION_V2_VALUE
    ? withEvidence(
        createV2Result(document, profile, ruleResults, diagnostics),
        document,
        profile,
        options,
      )
    : withEvidence(
        createV1Result(document, profile, ruleResults, diagnostics),
        document,
        profile,
        options,
      );
}

function createV1Result(
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly ValidationRuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationResultV1 {
  return {
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics: cloneDiagnostics(diagnostics),
    ruleResults: cloneRuleResults(ruleResults),
    profile: {
      syntaxVersion: PROFILE_SYNTAX_VERSION_VALUE,
      documentVersion: profile.documentVersion ?? document.version,
      ruleCount: profile.rules.length,
    },
  };
}

function createV2Result(
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly ValidationRuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationResultV2 {
  const v2RuleResults = cloneV2RuleResults(ruleResults);

  return {
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics: cloneDiagnostics(diagnostics),
    ruleResults: v2RuleResults,
    profile: {
      syntaxVersion: PROFILE_SYNTAX_VERSION_V2_VALUE,
      documentVersion: profile.documentVersion ?? document.version,
      ruleCount: profile.rules.length,
      evaluatedRuleCount: countEvaluatedV2RuleResults(v2RuleResults),
      skippedRuleCount: countSkippedV2RuleResults(v2RuleResults),
    },
  };
}

function withEvidence<T extends DeclarativeValidationResult>(
  result: T,
  document: EngineDocument,
  profile: ValidationProfile,
  options: DeclarativeValidationOptions,
): T {
  if (options.includeEvidence !== true) {
    return result;
  }

  return {
    ...result,
    evidence: createDeclarativeValidationEvidence(
      document,
      profile,
      result.ruleResults,
      result.diagnostics,
      options.sourceText,
    ),
  };
}

function cloneRuleResults(
  ruleResults: readonly ValidationRuleResult[],
): ValidationRuleResult[] {
  return ruleResults.map(cloneBaseValidationRuleResult);
}

function cloneV2RuleResults(
  ruleResults: readonly ValidationRuleResult[],
): DeclarativeValidationRuleResultV2[] {
  return ruleResults.map(cloneV2ValidationRuleResult);
}

function countEvaluatedV2RuleResults(
  ruleResults: readonly DeclarativeValidationRuleResultV2[],
): number {
  return ruleResults.length - countSkippedV2RuleResults(ruleResults);
}

function countSkippedV2RuleResults(
  ruleResults: readonly DeclarativeValidationRuleResultV2[],
): number {
  return ruleResults.filter((result) => result.status === "skipped").length;
}
