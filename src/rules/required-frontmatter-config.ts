import type { MarkdownDiagnosticSeverity } from "../api/diagnostics.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  invalidRuleConfig,
  parseNonEmptyStringArray,
  parseOptionalSeverity,
  type ParsedRuleConfig,
} from "./rule-config.js";

export const REQUIRED_FRONTMATTER_RULE_ID = "frontmatter.required";

export interface RequiredFrontmatterRuleConfig {
  ruleId: typeof REQUIRED_FRONTMATTER_RULE_ID;
  fields: string[];
  severity: MarkdownDiagnosticSeverity;
}

export function parseRequiredFrontmatterRuleConfig(
  config: unknown,
): ParsedRuleConfig<RequiredFrontmatterRuleConfig> {
  if (!isPlainRecord(config)) {
    return invalidRuleConfig(
      REQUIRED_FRONTMATTER_RULE_ID,
      "Rule frontmatter.required must be an object with a fields array.",
    );
  }

  const fields = parseNonEmptyStringArray(config.fields);

  if (fields === undefined) {
    return invalidRuleConfig(
      REQUIRED_FRONTMATTER_RULE_ID,
      "Rule frontmatter.required fields must be a non-empty string array.",
    );
  }

  const severity = parseOptionalSeverity(
    REQUIRED_FRONTMATTER_RULE_ID,
    config.severity,
  );

  if (severity.diagnostic !== undefined) {
    return severity;
  }

  return {
    rule: {
      ruleId: REQUIRED_FRONTMATTER_RULE_ID,
      fields,
      severity: severity.rule,
    },
  };
}
