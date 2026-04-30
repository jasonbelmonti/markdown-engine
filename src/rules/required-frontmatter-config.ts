import type {
  MarkdownDiagnostic,
  MarkdownDiagnosticSeverity,
} from "../api/diagnostics.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { isPlainRecord } from "../internal/plain-record.js";

export const REQUIRED_FRONTMATTER_RULE_ID = "frontmatter.required";

export interface RequiredFrontmatterRuleConfig {
  ruleId: typeof REQUIRED_FRONTMATTER_RULE_ID;
  fields: string[];
  severity: MarkdownDiagnosticSeverity;
}

export function parseRequiredFrontmatterRuleConfig(
  config: unknown,
):
  | { rule: RequiredFrontmatterRuleConfig; diagnostic?: undefined }
  | { rule?: undefined; diagnostic: MarkdownDiagnostic } {
  if (!isPlainRecord(config)) {
    return invalidRequiredFrontmatterRule(
      "Rule frontmatter.required must be an object with a fields array.",
    );
  }

  const fields = config.fields;

  if (
    !Array.isArray(fields) ||
    fields.length === 0 ||
    !fields.every(isNonEmptyString)
  ) {
    return invalidRequiredFrontmatterRule(
      "Rule frontmatter.required fields must be a non-empty string array.",
    );
  }

  const severity = parseSeverity(config.severity);

  if (severity === undefined) {
    return invalidRequiredFrontmatterRule(
      "Rule frontmatter.required severity must be error, warning, or info.",
    );
  }

  return {
    rule: {
      ruleId: REQUIRED_FRONTMATTER_RULE_ID,
      fields,
      severity,
    },
  };
}

function invalidRequiredFrontmatterRule(
  message: string,
): { diagnostic: MarkdownDiagnostic } {
  return {
    diagnostic: makeDiagnostic({
      code: "config.rule.invalid",
      ruleId: REQUIRED_FRONTMATTER_RULE_ID,
      message,
      severity: "error",
    }),
  };
}

function parseSeverity(
  severity: unknown,
): MarkdownDiagnosticSeverity | undefined {
  if (severity === undefined) {
    return "error";
  }

  if (severity === "error" || severity === "warning" || severity === "info") {
    return severity;
  }

  return undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
