import type { EngineDocument } from "./document.js";
import type { ValidationRuleResult } from "./validate.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import { evaluateCompiledDeclarativeRule } from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import { createDeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import type {
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
import type {
  DeclarativeValidationOptions,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";
import { resolveDeclarativeSelector } from "../declarative-validation/selectors/index.js";

export type {
  DeclarativeAssertion,
  DeclarativeIdSource,
  DeclarativeOutputFormat,
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  DeclarativeSectionOrder,
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  JsonSafeValue,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
export type { DeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
export type {
  DeclarativeValidationCliJsonResult,
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationOptions,
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
  const compileResult = compileValidationProfile(profile);
  const ruleResults =
    compileResult.plan?.rules.map((rule) =>
      evaluateCompiledDeclarativeRule(
        rule,
        resolveDeclarativeSelector(document, rule.selector),
      ),
    ) ?? [];
  const diagnostics = [
    ...compileResult.diagnostics,
    ...ruleResults.flatMap((result) => result.diagnostics),
  ];
  const result = {
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics: cloneDiagnostics(diagnostics),
    ruleResults: cloneRuleResults(ruleResults),
    profile: {
      syntaxVersion: profile.syntaxVersion,
      documentVersion: profile.documentVersion ?? document.version,
      ruleCount: profile.rules.length,
    },
  };

  return options.includeEvidence === true
    ? {
        ...result,
        evidence: createDeclarativeValidationEvidence(
          document,
          profile,
          ruleResults,
          diagnostics,
        ),
      }
    : result;
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
