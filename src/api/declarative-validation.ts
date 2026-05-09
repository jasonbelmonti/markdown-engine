import type { EngineDocument } from "./document.js";
import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { ValidationRuleResult } from "./validate.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import { evaluateCompiledDeclarativeRule } from "../declarative-validation/assertions/index.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import {
  PROFILE_SYNTAX_VERSION,
  unsupportedSyntaxVersion,
} from "../declarative-validation/diagnostics/profile-config-diagnostics.js";
import { createDeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import {
  closeProfileDataTree,
  DATA_CLOSURE_FAILED,
} from "../declarative-validation/profile/data-closure.js";
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
import { isPlainRecord } from "../internal/plain-record.js";

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
  const materializedProfile = materializeValidationProfile(profile, document);
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
  return validationResult(
    document,
    materializedProfile.profile,
    ruleResults,
    diagnostics,
    options,
  );
}

interface MaterializedValidationProfile {
  profile: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}

function materializeValidationProfile(
  profile: ValidationProfile,
  document: EngineDocument,
): MaterializedValidationProfile {
  const diagnostics: MarkdownDiagnostic[] = [];
  const closedProfile = closeProfileDataTree(profile, "Profile", diagnostics);
  if (closedProfile === DATA_CLOSURE_FAILED || !isPlainRecord(closedProfile)) {
    if (diagnostics.length === 0) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: "Profile must be an object.",
        severity: "error",
      });
    }

    return { profile: fallbackProfile(document), diagnostics };
  }

  const syntaxVersion =
    closedProfile.syntaxVersion === PROFILE_SYNTAX_VERSION
      ? PROFILE_SYNTAX_VERSION
      : undefined;
  if (syntaxVersion === undefined) {
    diagnostics.push(unsupportedSyntaxVersion());
  }

  const documentVersion =
    closedProfile.documentVersion === undefined
      ? undefined
      : documentVersionFromValue(closedProfile.documentVersion, diagnostics);
  const rules = rulesFromValue(closedProfile.rules, diagnostics);

  return {
    profile: {
      syntaxVersion: PROFILE_SYNTAX_VERSION,
      ...(documentVersion !== undefined ? { documentVersion } : {}),
      rules: rules ?? [],
    },
    diagnostics,
  };
}

function fallbackProfile(document: EngineDocument): ValidationProfile {
  return {
    syntaxVersion: PROFILE_SYNTAX_VERSION,
    documentVersion: document.version,
    rules: [],
  };
}

function documentVersionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): EngineDocument["version"] | undefined {
  if (value === "0.0.0" || value === "1.0.0") {
    return value;
  }

  diagnostics.push({
    code: "profile.config.invalidShape",
    message: 'Profile documentVersion must be "0.0.0" or "1.0.0" when provided.',
    severity: "error",
  });

  return undefined;
}

function rulesFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): ValidationProfile["rules"] | undefined {
  if (!Array.isArray(value)) {
    diagnostics.push({
      code: "profile.config.invalidShape",
      message: "Profile rules must be an array.",
      severity: "error",
    });

    return undefined;
  }

  return value as ValidationProfile["rules"];
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
