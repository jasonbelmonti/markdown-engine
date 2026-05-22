import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { ValidationRuleResult } from "./validate.js";
import {
  evaluateCompiledDeclarativeAllOfRule,
  evaluateCompiledDeclarativeRule,
  sortValidationRuleResults,
} from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import type {
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationGroupRuleV2,
  CompiledDeclarativeValidationRule,
} from "../declarative-validation/compiler/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import { materializeValidationProfile } from "../declarative-validation/profile/materialization.js";
import type {
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
import { createDeclarativeValidationResult } from "../declarative-validation/results/index.js";
import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";
import { resolveDeclarativeSelector } from "../declarative-validation/selectors/index.js";

export type {
  DeclarativeAssertion,
  DeclarativeValidationAllOfRule,
  DeclarativeValidationAnyOfRule,
  DeclarativeValidationBranch,
  DeclarativeValidationFlatRule,
  DeclarativeValidationGroupRule,
  DeclarativeValidationRuleFields,
  DeclarativeIdSource,
  DeclarativeOutputFormat,
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  DeclarativeSectionOrder,
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
  DeclarativeTableColumnCoverage,
  DeclarativeTableColumnCoverageSource,
  DeclarativeTableColumnCoverageTarget,
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
export type { DeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
export type {
  DeclarativeValidationAllOfEvaluationResult,
  DeclarativeValidationAnyOfEvaluationResult,
  DeclarativeValidationApplicabilityResult,
  DeclarativeValidationAssertionsEvaluationResult,
  DeclarativeValidationBranchReference,
  DeclarativeValidationBranchResult,
  DeclarativeValidationCliJsonResult,
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationOptions,
  DeclarativeValidationResultV1,
  DeclarativeValidationResultV2,
  DeclarativeValidationRuleEvaluationResult,
  DeclarativeValidationRuleResultV2,
  DeclarativeValidationRuleStatus,
  DeclarativeValidationSkippedEvaluationResult,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";

export interface DeclarativeValidationApi {
  parseValidationProfile(
    input: string | JsonSafeValue,
    options?: DeclarativeProfileParseOptions,
  ): DeclarativeProfileParseResult;
  validateWithProfile(
    document: EngineDocument,
    profile: ValidationProfile,
    options?: DeclarativeValidationOptions,
  ): DeclarativeValidationResult;
}

export function parseValidationProfile(
  input: string | JsonSafeValue,
  options: DeclarativeProfileParseOptions = {},
): DeclarativeProfileParseResult {
  return parseValidationProfileInput(input, options);
}

export function validateWithProfile(
  document: EngineDocument,
  profile: ValidationProfile,
  options: DeclarativeValidationOptions = {},
): DeclarativeValidationResult {
  const materializedProfile = materializeValidationProfile(
    profile,
    document.version,
  );
  if (materializedProfile.diagnostics.length > 0) {
    return createDeclarativeValidationResult({
      document,
      profile: materializedProfile.profile,
      ruleResults: [],
      diagnostics: materializedProfile.diagnostics,
      options,
    });
  }

  const profileDocumentVersion =
    materializedProfile.profile.documentVersion ?? document.version;
  const versionDiagnostics =
    profileDocumentVersion === document.version
      ? []
      : [documentVersionMismatchDiagnostic(profileDocumentVersion, document.version)];

  if (versionDiagnostics.length > 0) {
    return createDeclarativeValidationResult({
      document,
      profile: materializedProfile.profile,
      ruleResults: [],
      diagnostics: versionDiagnostics,
      options,
    });
  }

  const compileResult = compileValidationProfile(materializedProfile.profile);
  const compiledRules = compileResult.plan?.rules ?? [];
  const deferredGroupDiagnostics = compiledRules.flatMap(
    deferredGroupDiagnosticsForRule,
  );
  const ruleResults = sortValidationRuleResults(
    compiledRules.flatMap((rule) => evaluateCompiledRule(document, rule)),
  );
  const diagnostics = [
    ...compileResult.diagnostics,
    ...deferredGroupDiagnostics,
    ...ruleResults.flatMap((result) => result.diagnostics),
  ];
  return createDeclarativeValidationResult({
    document,
    profile: materializedProfile.profile,
    ruleResults,
    diagnostics,
    options,
  });
}

function isCompiledGroupRule(
  rule: CompiledDeclarativeValidationRule,
): rule is CompiledDeclarativeValidationGroupRuleV2 {
  return "kind" in rule && rule.kind !== "flat";
}

function evaluateCompiledRule(
  document: EngineDocument,
  rule: CompiledDeclarativeValidationRule,
): ValidationRuleResult[] {
  if (isCompiledAllOfRule(rule)) {
    return [evaluateCompiledDeclarativeAllOfRule(rule, document)];
  }

  if (isCompiledGroupRule(rule)) {
    return [];
  }

  return [
    evaluateCompiledDeclarativeRule(
      rule,
      resolveDeclarativeSelector(document, rule.selector),
    ),
  ];
}

function isCompiledAllOfRule(
  rule: CompiledDeclarativeValidationRule,
): rule is CompiledDeclarativeValidationAllOfRuleV2 {
  return "kind" in rule && rule.kind === "allOf";
}

function isDeferredGroupRule(
  rule: CompiledDeclarativeValidationRule,
): rule is Exclude<
  CompiledDeclarativeValidationGroupRuleV2,
  CompiledDeclarativeValidationAllOfRuleV2
> {
  return isCompiledGroupRule(rule) && !isCompiledAllOfRule(rule);
}

function deferredGroupDiagnosticsForRule(
  rule: CompiledDeclarativeValidationRule,
): MarkdownDiagnostic[] {
  return isDeferredGroupRule(rule) ? [deferredGroupDiagnostic(rule)] : [];
}

function deferredGroupDiagnostic(
  rule: CompiledDeclarativeValidationGroupRuleV2,
): MarkdownDiagnostic {
  return {
    code: "profile.validation.groupEvaluationDeferred",
    ruleId: rule.ruleId,
    message:
      "Grouped rule runtime evaluation is not implemented in this package slice.",
    severity: "error" as const,
  };
}

function documentVersionMismatchDiagnostic(
  profileDocumentVersion: EngineDocument["version"],
  documentVersion: EngineDocument["version"],
): MarkdownDiagnostic {
  return {
    code: "profile.config.documentVersionMismatch",
    message: `Profile documentVersion "${profileDocumentVersion}" does not match document version "${documentVersion}".`,
    severity: "error" as const,
  };
}
