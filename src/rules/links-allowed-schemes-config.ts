import type { MarkdownDiagnosticSeverity } from "../api/diagnostics.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  invalidRuleConfig,
  parseNonEmptyStringArray,
  parseOptionalSeverity,
  type ParsedRuleConfig,
} from "./rule-config.js";

export const LINKS_ALLOWED_SCHEMES_RULE_ID = "links.allowedSchemes";

export interface LinksAllowedSchemesRuleConfig {
  ruleId: typeof LINKS_ALLOWED_SCHEMES_RULE_ID;
  schemes: string[];
  severity: MarkdownDiagnosticSeverity;
}

export function parseLinksAllowedSchemesRuleConfig(
  config: unknown,
): ParsedRuleConfig<LinksAllowedSchemesRuleConfig> {
  if (!isPlainRecord(config)) {
    return invalidRuleConfig(
      LINKS_ALLOWED_SCHEMES_RULE_ID,
      "Rule links.allowedSchemes must be an object with a schemes array.",
    );
  }

  const schemes = parseNonEmptyStringArray(config.schemes);

  if (schemes === undefined) {
    return invalidRuleConfig(
      LINKS_ALLOWED_SCHEMES_RULE_ID,
      "Rule links.allowedSchemes schemes must be a non-empty string array.",
    );
  }

  const severity = parseOptionalSeverity(
    LINKS_ALLOWED_SCHEMES_RULE_ID,
    config.severity,
  );

  if (severity.diagnostic !== undefined) {
    return severity;
  }

  return {
    rule: {
      ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
      schemes: schemes.map((scheme) => scheme.toLowerCase()),
      severity: severity.rule,
    },
  };
}
