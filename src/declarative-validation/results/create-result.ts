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
import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
  DeclarativeValidationResultV1,
  DeclarativeValidationResultV2,
  DeclarativeValidationRuleResultV2,
  DeclarativeValidationRuleStatus,
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
        ruleResults,
        diagnostics,
        options,
      )
    : withEvidence(
        createV1Result(document, profile, ruleResults, diagnostics),
        document,
        profile,
        ruleResults,
        diagnostics,
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
      evaluatedRuleCount: v2RuleResults.length,
      skippedRuleCount: 0,
    },
  };
}

function withEvidence<T extends DeclarativeValidationResult>(
  result: T,
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly ValidationRuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
  options: DeclarativeValidationOptions,
): T {
  if (
    options.includeEvidence !== true ||
    result.profile.syntaxVersion === PROFILE_SYNTAX_VERSION_V2_VALUE
  ) {
    return result;
  }

  return {
    ...result,
    evidence: createDeclarativeValidationEvidence(
      document,
      profile,
      ruleResults,
      diagnostics,
    ),
  };
}

function cloneRuleResults(
  ruleResults: readonly ValidationRuleResult[],
): ValidationRuleResult[] {
  return ruleResults.map((result) => ({
    ruleId: result.ruleId,
    passed: result.passed,
    diagnostics: cloneDiagnostics(result.diagnostics),
  }));
}

function cloneV2RuleResults(
  ruleResults: readonly ValidationRuleResult[],
): DeclarativeValidationRuleResultV2[] {
  return ruleResults.map((result) => {
    const status = statusFromRuleResult(result);
    const diagnostics = cloneDiagnostics(result.diagnostics);

    return {
      ruleId: result.ruleId,
      status,
      passed: passedFromStatus(status),
      diagnostics,
      evaluation: {
        kind: "assertions",
        diagnostics: cloneDiagnostics(diagnostics),
      },
    };
  });
}

function statusFromRuleResult(
  result: ValidationRuleResult,
): DeclarativeValidationRuleStatus {
  return result.diagnostics.length === 0 ? "passed" : "failed";
}

function passedFromStatus(status: DeclarativeValidationRuleStatus): boolean {
  return status !== "failed";
}
