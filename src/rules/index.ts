import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import {
  CODE_FENCE_LANGUAGES_RULE_ID,
  parseCodeFenceLanguagesRuleConfig,
  type CodeFenceLanguagesRuleConfig,
} from "./code-fence-languages-config.js";
import { evaluateCodeFenceLanguagesRule } from "./code-fence-languages.js";
import {
  HEADINGS_REQUIRED_RULE_ID,
  parseHeadingsRequiredRuleConfig,
  type HeadingsRequiredRuleConfig,
} from "./headings-required-config.js";
import { evaluateHeadingsRequiredRule } from "./headings-required.js";
import {
  LINKS_ALLOWED_SCHEMES_RULE_ID,
  parseLinksAllowedSchemesRuleConfig,
  type LinksAllowedSchemesRuleConfig,
} from "./links-allowed-schemes-config.js";
import { evaluateLinksAllowedSchemesRule } from "./links-allowed-schemes.js";
import {
  parseRawHtmlPolicyRuleConfig,
  RAW_HTML_POLICY_RULE_ID,
  type RawHtmlPolicyRuleConfig,
} from "./raw-html-policy-config.js";
import { evaluateRawHtmlPolicyRule } from "./raw-html-policy.js";
import {
  REQUIRED_FRONTMATTER_RULE_ID,
  parseRequiredFrontmatterRuleConfig,
  type RequiredFrontmatterRuleConfig,
} from "./required-frontmatter-config.js";
import { evaluateRequiredFrontmatterRule } from "./required-frontmatter.js";
import type { ParsedRuleConfig } from "./rule-config.js";

export type SupportedValidationRuleConfig =
  | CodeFenceLanguagesRuleConfig
  | HeadingsRequiredRuleConfig
  | LinksAllowedSchemesRuleConfig
  | RawHtmlPolicyRuleConfig
  | RequiredFrontmatterRuleConfig;

export function parseValidationRuleConfig(
  ruleId: string,
  config: unknown,
): ParsedRuleConfig<SupportedValidationRuleConfig> | undefined {
  switch (ruleId) {
    case CODE_FENCE_LANGUAGES_RULE_ID:
      return parseCodeFenceLanguagesRuleConfig(config);

    case HEADINGS_REQUIRED_RULE_ID:
      return parseHeadingsRequiredRuleConfig(config);

    case LINKS_ALLOWED_SCHEMES_RULE_ID:
      return parseLinksAllowedSchemesRuleConfig(config);

    case RAW_HTML_POLICY_RULE_ID:
      return parseRawHtmlPolicyRuleConfig(config);

    case REQUIRED_FRONTMATTER_RULE_ID:
      return parseRequiredFrontmatterRuleConfig(config);
  }

  return undefined;
}

export function evaluateConfiguredRules(
  document: EngineDocument,
  rules: readonly SupportedValidationRuleConfig[],
): ValidationRuleResult[] {
  return rules.map((rule) => {
    switch (rule.ruleId) {
      case CODE_FENCE_LANGUAGES_RULE_ID:
        return evaluateCodeFenceLanguagesRule(document, rule);

      case HEADINGS_REQUIRED_RULE_ID:
        return evaluateHeadingsRequiredRule(document, rule);

      case LINKS_ALLOWED_SCHEMES_RULE_ID:
        return evaluateLinksAllowedSchemesRule(document, rule);

      case RAW_HTML_POLICY_RULE_ID:
        return evaluateRawHtmlPolicyRule(document, rule);

      case REQUIRED_FRONTMATTER_RULE_ID:
        return evaluateRequiredFrontmatterRule(document, rule);
    }
  });
}
