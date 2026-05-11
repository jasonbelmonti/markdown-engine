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

type BuiltInValidationRuleId = SupportedValidationRuleConfig["ruleId"];

interface BuiltInValidationRuleDefinitionInput<
  Config extends SupportedValidationRuleConfig,
> {
  readonly ruleId: Config["ruleId"];
  readonly parseConfig: (
    config: unknown,
  ) => ParsedRuleConfig<Config>;
  readonly evaluate: (
    document: EngineDocument,
    config: Config,
  ) => ValidationRuleResult;
}

interface BuiltInValidationRuleDefinition {
  readonly ruleId: BuiltInValidationRuleId;
  readonly parseConfig: (
    config: unknown,
  ) => ParsedRuleConfig<SupportedValidationRuleConfig>;
  readonly evaluate: (
    document: EngineDocument,
    config: SupportedValidationRuleConfig,
  ) => ValidationRuleResult;
}

const builtInValidationRuleDefinitions = [
  defineBuiltInValidationRule({
    ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
    parseConfig: parseCodeFenceLanguagesRuleConfig,
    evaluate: evaluateCodeFenceLanguagesRule,
  }),
  defineBuiltInValidationRule({
    ruleId: HEADINGS_REQUIRED_RULE_ID,
    parseConfig: parseHeadingsRequiredRuleConfig,
    evaluate: evaluateHeadingsRequiredRule,
  }),
  defineBuiltInValidationRule({
    ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
    parseConfig: parseLinksAllowedSchemesRuleConfig,
    evaluate: evaluateLinksAllowedSchemesRule,
  }),
  defineBuiltInValidationRule({
    ruleId: RAW_HTML_POLICY_RULE_ID,
    parseConfig: parseRawHtmlPolicyRuleConfig,
    evaluate: evaluateRawHtmlPolicyRule,
  }),
  defineBuiltInValidationRule({
    ruleId: REQUIRED_FRONTMATTER_RULE_ID,
    parseConfig: parseRequiredFrontmatterRuleConfig,
    evaluate: evaluateRequiredFrontmatterRule,
  }),
] as const;

const builtInValidationRuleDefinitionById: ReadonlyMap<
  string,
  BuiltInValidationRuleDefinition
> = new Map(
  builtInValidationRuleDefinitions.map((definition): [
    string,
    BuiltInValidationRuleDefinition,
  ] => [
    definition.ruleId,
    definition,
  ]),
);

export function parseBuiltInValidationRuleConfig(
  ruleId: string,
  config: unknown,
): ParsedRuleConfig<SupportedValidationRuleConfig> | undefined {
  return builtInValidationRuleDefinitionById.get(ruleId)?.parseConfig(config);
}

export function evaluateBuiltInValidationRule(
  document: EngineDocument,
  rule: SupportedValidationRuleConfig,
): ValidationRuleResult {
  const definition = builtInValidationRuleDefinitionById.get(rule.ruleId);

  if (definition === undefined) {
    throw new Error(`No evaluator registered for validation rule "${rule.ruleId}".`);
  }

  return definition.evaluate(document, rule);
}

function defineBuiltInValidationRule<
  Config extends SupportedValidationRuleConfig,
>(
  definition: BuiltInValidationRuleDefinitionInput<Config>,
): BuiltInValidationRuleDefinition {
  return {
    ruleId: definition.ruleId,
    parseConfig: definition.parseConfig,
    evaluate(document, config) {
      return definition.evaluate(document, config as Config);
    },
  };
}
