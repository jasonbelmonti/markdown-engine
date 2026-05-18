import type { EngineDocumentVersion } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedSyntaxVersion } from "../diagnostics/profile-config-diagnostics.js";
import {
  closeProfileDataTree,
  DATA_CLOSURE_FAILED,
} from "./data-closure.js";
import {
  directProfileDataPropertyValue,
  pushDirectProfileUnsupportedKeyDiagnostics,
} from "./direct-profile-diagnostics.js";
import type {
  DeclarativeValidationRule,
  ValidationProfile,
} from "./index.js";
import {
  PROFILE_SYNTAX_VERSION,
  isValidationProfileSyntaxVersion,
  type ValidationProfileSyntaxVersion,
} from "./syntax-version.js";

export interface MaterializedValidationProfile {
  profile: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}

export function materializeValidationProfile(
  profile: ValidationProfile,
  fallbackDocumentVersion: EngineDocumentVersion,
): MaterializedValidationProfile {
  const diagnostics: MarkdownDiagnostic[] = [];
  const fallbackSyntaxVersion = syntaxVersionFromValue(
    directProfileDataPropertyValue(profile, "syntaxVersion"),
  );

  if (pushDirectProfileUnsupportedKeyDiagnostics(profile, diagnostics)) {
    return {
      profile: fallbackProfile(fallbackDocumentVersion, fallbackSyntaxVersion),
      diagnostics,
    };
  }

  const closedProfile = closeProfileDataTree(profile, "Profile", diagnostics);
  if (closedProfile === DATA_CLOSURE_FAILED || !isPlainRecord(closedProfile)) {
    if (diagnostics.length === 0) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: "Profile must be an object.",
        severity: "error",
      });
    }

    return {
      profile: fallbackProfile(fallbackDocumentVersion, fallbackSyntaxVersion),
      diagnostics,
    };
  }

  const syntaxVersion = syntaxVersionFromValue(closedProfile.syntaxVersion);
  if (syntaxVersion === undefined) {
    diagnostics.push(unsupportedSyntaxVersion());
  }

  const documentVersion =
    closedProfile.documentVersion === undefined
      ? undefined
      : documentVersionFromValue(closedProfile.documentVersion, diagnostics);
  const rules = rulesFromValue(closedProfile.rules, diagnostics);
  pushDuplicateRuleIdDiagnostics(rules, diagnostics);

  return {
    profile: {
      syntaxVersion: syntaxVersion ?? PROFILE_SYNTAX_VERSION,
      ...(documentVersion !== undefined ? { documentVersion } : {}),
      rules: rules ?? [],
    },
    diagnostics,
  };
}

function fallbackProfile(
  documentVersion: EngineDocumentVersion,
  syntaxVersion: ValidationProfileSyntaxVersion = PROFILE_SYNTAX_VERSION,
): ValidationProfile {
  return {
    syntaxVersion,
    documentVersion,
    rules: [],
  };
}

function syntaxVersionFromValue(
  value: unknown,
): ValidationProfileSyntaxVersion | undefined {
  return isValidationProfileSyntaxVersion(value) ? value : undefined;
}

function documentVersionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): EngineDocumentVersion | undefined {
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

  const rules: DeclarativeValidationRule[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const rule = value[index];
    if (!isPlainRecord(rule)) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: `Profile rule at index ${index} must be an object.`,
        severity: "error",
      });

      continue;
    }

    rules.push(rule as unknown as DeclarativeValidationRule);
  }

  return rules;
}

function pushDuplicateRuleIdDiagnostics(
  rules: ValidationProfile["rules"] | undefined,
  diagnostics: MarkdownDiagnostic[],
): void {
  if (rules === undefined) {
    return;
  }

  const seenRuleIds = new Set<string>();
  for (let index = 0; index < rules.length; index += 1) {
    const ruleId = rules[index]?.id;
    if (typeof ruleId !== "string") {
      continue;
    }

    if (seenRuleIds.has(ruleId)) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: `Profile rule at index ${index} duplicates rule id "${ruleId}".`,
        severity: "error",
      });
    }

    seenRuleIds.add(ruleId);
  }
}
