import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { ValidationRuleResult } from "./validate.js";
import {
  evaluateCompiledDeclarativeAllOfRule,
  evaluateCompiledDeclarativeAnyOfRule,
  evaluateCompiledDeclarativeRule,
  sortValidationRuleResults,
} from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import type {
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationAnyOfRuleV2,
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
  DeclarativeValidationApplicability,
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
  const applicabilityDiagnostics =
    unsupportedApplicabilityRuntimeDiagnostics(compiledRules);
  const ruleResults = sortValidationRuleResults(
    applicabilityDiagnostics.length > 0
      ? []
      : compiledRules.flatMap((rule) => evaluateCompiledRule(document, rule)),
  );
  const diagnostics = [
    ...compileResult.diagnostics,
    ...applicabilityDiagnostics,
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

function unsupportedApplicabilityRuntimeDiagnostics(
  rules: readonly CompiledDeclarativeValidationRule[],
): MarkdownDiagnostic[] {
  return rules.flatMap((rule) =>
    hasCompiledApplicability(rule)
      ? [
          {
            code: "profile.compile.unsupportedApplicability",
            ruleId: rule.ruleId,
            message:
              "Rule-level when is supported by schema and compiler only; validation runtime applicability evaluation is not implemented.",
            severity: "error" as const,
          },
        ]
      : [],
  );
}

function hasCompiledApplicability(
  rule: CompiledDeclarativeValidationRule,
): boolean {
  return "applicability" in rule && rule.applicability !== undefined;
}

function evaluateCompiledRule(
  document: EngineDocument,
  rule: CompiledDeclarativeValidationRule,
): ValidationRuleResult[] {
  if (isCompiledAnyOfRule(rule)) {
    return [evaluateCompiledDeclarativeAnyOfRule(rule, document)];
  }

  if (isCompiledAllOfRule(rule)) {
    return [evaluateCompiledDeclarativeAllOfRule(rule, document)];
  }

  return [
    evaluateCompiledDeclarativeRule(
      rule,
      resolveDeclarativeSelector(document, rule.selector),
    ),
  ];
}

function isCompiledAnyOfRule(
  rule: CompiledDeclarativeValidationRule,
): rule is CompiledDeclarativeValidationAnyOfRuleV2 {
  return "kind" in rule && rule.kind === "anyOf";
}

function isCompiledAllOfRule(
  rule: CompiledDeclarativeValidationRule,
): rule is CompiledDeclarativeValidationAllOfRuleV2 {
  return "kind" in rule && rule.kind === "allOf";
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
