import { isPlainRecord } from "../internal/plain-record.js";
import { invalidRuleConfig, type ParsedRuleConfig } from "./rule-config.js";

export const RAW_HTML_POLICY_RULE_ID = "rawHtml.policy";

export type RawHtmlPolicy = "allow" | "warn" | "deny";

export interface RawHtmlPolicyRuleConfig {
  ruleId: typeof RAW_HTML_POLICY_RULE_ID;
  policy: RawHtmlPolicy;
}

export function parseRawHtmlPolicyRuleConfig(
  config: unknown,
): ParsedRuleConfig<RawHtmlPolicyRuleConfig> {
  if (!isPlainRecord(config)) {
    return invalidRuleConfig(
      RAW_HTML_POLICY_RULE_ID,
      "Rule rawHtml.policy must be an object with a policy value.",
    );
  }

  if (
    config.policy !== "allow" &&
    config.policy !== "warn" &&
    config.policy !== "deny"
  ) {
    return invalidRuleConfig(
      RAW_HTML_POLICY_RULE_ID,
      "Rule rawHtml.policy policy must be allow, warn, or deny.",
    );
  }

  return {
    rule: {
      ruleId: RAW_HTML_POLICY_RULE_ID,
      policy: config.policy,
    },
  };
}
