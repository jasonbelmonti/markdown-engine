import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import {
  evaluateBuiltInValidationRule,
  parseBuiltInValidationRuleConfig,
  type SupportedValidationRuleConfig,
} from "./registry.js";
import type { ParsedRuleConfig } from "./rule-config.js";

export type { SupportedValidationRuleConfig } from "./registry.js";

export function parseValidationRuleConfig(
  ruleId: string,
  config: unknown,
): ParsedRuleConfig<SupportedValidationRuleConfig> | undefined {
  return parseBuiltInValidationRuleConfig(ruleId, config);
}

export function evaluateConfiguredRules(
  document: EngineDocument,
  rules: readonly SupportedValidationRuleConfig[],
): ValidationRuleResult[] {
  return rules.map((rule) => evaluateBuiltInValidationRule(document, rule));
}
