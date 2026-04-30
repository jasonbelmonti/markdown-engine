import type { MarkdownDiagnosticSeverity } from "../api/diagnostics.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  invalidRuleConfig,
  parseNonEmptyStringArray,
  parseOptionalSeverity,
  type ParsedRuleConfig,
} from "./rule-config.js";

export const CODE_FENCE_LANGUAGES_RULE_ID = "codeFences.languages";

export interface CodeFenceLanguagesRuleConfig {
  ruleId: typeof CODE_FENCE_LANGUAGES_RULE_ID;
  allowed?: string[];
  requireLanguage: boolean;
  severity: MarkdownDiagnosticSeverity;
}

export function parseCodeFenceLanguagesRuleConfig(
  config: unknown,
): ParsedRuleConfig<CodeFenceLanguagesRuleConfig> {
  if (!isPlainRecord(config)) {
    return invalidRuleConfig(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages must be an object.",
    );
  }

  const allowed = parseAllowedLanguages(config.allowed);

  if (allowed === "invalid") {
    return invalidRuleConfig(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages allowed must be a non-empty string array.",
    );
  }

  const requireLanguage = config.requireLanguage ?? false;

  if (typeof requireLanguage !== "boolean") {
    return invalidRuleConfig(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages requireLanguage must be a boolean.",
    );
  }

  if (allowed === undefined && !requireLanguage) {
    return invalidRuleConfig(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages must set allowed or requireLanguage.",
    );
  }

  const severity = parseOptionalSeverity(
    CODE_FENCE_LANGUAGES_RULE_ID,
    config.severity,
  );

  if (severity.diagnostic !== undefined) {
    return severity;
  }

  return {
    rule: {
      ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
      ...(allowed !== undefined ? { allowed } : {}),
      requireLanguage,
      severity: severity.rule,
    },
  };
}

function parseAllowedLanguages(
  value: unknown,
): string[] | "invalid" | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseNonEmptyStringArray(value) ?? "invalid";
}
