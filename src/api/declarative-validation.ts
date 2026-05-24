import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { ValidationRuleResult } from "./validate.js";
import { classifyCompiledDeclarativeRuleApplicability } from "../declarative-validation/applicability/index.js";
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
  const ruleResults = sortValidationRuleResults(
    compiledRules.flatMap((rule) => evaluateApplicableCompiledRule(document, rule)),
  );
  const diagnostics = [
    ...compileResult.diagnostics,
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

function evaluateApplicableCompiledRule(
  document: EngineDocument,
  rule: CompiledDeclarativeValidationRule,
): ValidationRuleResult[] {
  const applicability = classifyCompiledDeclarativeRuleApplicability(
    rule,
    document,
  );

  return applicability.status === "notMatched"
    ? []
    : evaluateCompiledRule(document, rule);
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
