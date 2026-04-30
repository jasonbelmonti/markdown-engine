import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { hasOwnProperty, isPlainRecord } from "../internal/plain-record.js";
import type { RequiredFrontmatterRuleConfig } from "./required-frontmatter-config.js";

export function evaluateRequiredFrontmatterRule(
  document: EngineDocument,
  config: RequiredFrontmatterRuleConfig,
): ValidationRuleResult {
  const diagnostics = config.fields
    .filter((field) => !hasFrontmatterField(document.frontmatter, field))
    .map((field) =>
      makeDiagnostic({
        code: "frontmatter.required.missing",
        ruleId: config.ruleId,
        message: `Required frontmatter field "${field}" is missing.`,
        severity: config.severity,
      }),
    );

  return {
    ruleId: config.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}

function hasFrontmatterField(frontmatter: unknown, field: string): boolean {
  return isPlainRecord(frontmatter) && hasOwnProperty(frontmatter, field);
}
