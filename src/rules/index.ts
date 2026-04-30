import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import {
  REQUIRED_FRONTMATTER_RULE_ID,
  type RequiredFrontmatterRuleConfig,
} from "./required-frontmatter-config.js";
import { evaluateRequiredFrontmatterRule } from "./required-frontmatter.js";

export type SupportedValidationRuleConfig = RequiredFrontmatterRuleConfig;

export function evaluateConfiguredRules(
  document: EngineDocument,
  rules: readonly SupportedValidationRuleConfig[],
): ValidationRuleResult[] {
  return rules.map((rule) => {
    switch (rule.ruleId) {
      case REQUIRED_FRONTMATTER_RULE_ID:
        return evaluateRequiredFrontmatterRule(document, rule);
    }
  });
}
