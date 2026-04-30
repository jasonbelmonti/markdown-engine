import type { MarkdownDiagnosticSeverity } from "../api/diagnostics.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  invalidRuleConfig,
  parseNonEmptyStringArray,
  parseOptionalSeverity,
  type ParsedRuleConfig,
} from "./rule-config.js";

export const HEADINGS_REQUIRED_RULE_ID = "headings.required";

export interface HeadingsRequiredRuleConfig {
  ruleId: typeof HEADINGS_REQUIRED_RULE_ID;
  headings: string[];
  severity: MarkdownDiagnosticSeverity;
}

export function parseHeadingsRequiredRuleConfig(
  config: unknown,
): ParsedRuleConfig<HeadingsRequiredRuleConfig> {
  if (!isPlainRecord(config)) {
    return invalidRuleConfig(
      HEADINGS_REQUIRED_RULE_ID,
      "Rule headings.required must be an object with a headings array.",
    );
  }

  const headings = parseNonEmptyStringArray(config.headings);

  if (headings === undefined) {
    return invalidRuleConfig(
      HEADINGS_REQUIRED_RULE_ID,
      "Rule headings.required headings must be a non-empty string array.",
    );
  }

  const severity = parseOptionalSeverity(
    HEADINGS_REQUIRED_RULE_ID,
    config.severity,
  );

  if (severity.diagnostic !== undefined) {
    return severity;
  }

  return {
    rule: {
      ruleId: HEADINGS_REQUIRED_RULE_ID,
      headings,
      severity: severity.rule,
    },
  };
}
