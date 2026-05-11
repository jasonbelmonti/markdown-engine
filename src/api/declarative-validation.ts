import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { ValidationRuleResult } from "./validate.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import {
  evaluateCompiledDeclarativeRule,
  sortValidationRuleResults,
} from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import { createDeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import { materializeValidationProfile } from "../declarative-validation/profile/materialization.js";
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
  const materializedProfile = materializeValidationProfile(
    profile,
    document.version,
  );
  if (materializedProfile.diagnostics.length > 0) {
    return validationResult(
      document,
      materializedProfile.profile,
      [],
      materializedProfile.diagnostics,
      options,
    );
  }

  const profileDocumentVersion =
    materializedProfile.profile.documentVersion ?? document.version;
  const versionDiagnostics =
    profileDocumentVersion === document.version
      ? []
      : [documentVersionMismatchDiagnostic(profileDocumentVersion, document.version)];

  if (versionDiagnostics.length > 0) {
    return validationResult(
      document,
      materializedProfile.profile,
      [],
      versionDiagnostics,
      options,
    );
  }

  const compileResult = compileValidationProfile(materializedProfile.profile);
  const ruleResults = sortValidationRuleResults(
    compileResult.plan?.rules.map((rule) =>
      evaluateCompiledDeclarativeRule(
        rule,
        resolveDeclarativeSelector(document, rule.selector),
      ),
    ) ?? [],
  );
  const diagnostics = [
    ...compileResult.diagnostics,
    ...ruleResults.flatMap((result) => result.diagnostics),
  ];
  return validationResult(
    document,
    materializedProfile.profile,
    ruleResults,
    diagnostics,
    options,
  );
}

function validationResult(
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly ValidationRuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
  options: DeclarativeValidationOptions,
): DeclarativeValidationResult {
  const result: DeclarativeValidationResult = {
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

function cloneRuleResults(
  ruleResults: readonly ValidationRuleResult[],
): ValidationRuleResult[] {
  return ruleResults.map((result) => ({
    ruleId: result.ruleId,
    passed: result.passed,
    diagnostics: cloneDiagnostics(result.diagnostics),
  }));
}
