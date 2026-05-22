import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import {
  evaluateCompiledDeclarativeRule,
  sortValidationRuleResults,
} from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import type {
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
  DeclarativeValidationAssertionsEvaluationResult,
  DeclarativeValidationCliJsonResult,
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationOptions,
  DeclarativeValidationResultV1,
  DeclarativeValidationResultV2,
  DeclarativeValidationRuleEvaluationResult,
  DeclarativeValidationRuleResultV2,
  DeclarativeValidationRuleStatus,
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
  const deferredGroupDiagnostics = compiledRules.flatMap((rule) =>
    isCompiledGroupRule(rule)
      ? [
          {
            code: "profile.validation.groupEvaluationDeferred",
            ruleId: rule.ruleId,
            message:
              "Grouped rule runtime evaluation is not implemented in this package slice.",
            severity: "error" as const,
          },
        ]
      : [],
  );
  const ruleResults = sortValidationRuleResults(
    compiledRules.flatMap((rule) =>
      isCompiledGroupRule(rule)
        ? []
        : [
            evaluateCompiledDeclarativeRule(
              rule,
              resolveDeclarativeSelector(document, rule.selector),
            ),
          ],
    ),
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
