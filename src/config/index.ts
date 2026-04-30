import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { ValidationConfig } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  parseRequiredFrontmatterRuleConfig,
  REQUIRED_FRONTMATTER_RULE_ID,
} from "../rules/required-frontmatter-config.js";
import type { SupportedValidationRuleConfig } from "../rules/index.js";

export interface LoadedValidationConfig {
  rules: SupportedValidationRuleConfig[];
  diagnostics: MarkdownDiagnostic[];
}

export function loadValidationConfig(
  config: ValidationConfig = {},
): LoadedValidationConfig {
  const rules = config.rules;

  if (rules === undefined) {
    return { rules: [], diagnostics: [] };
  }

  if (!isPlainRecord(rules)) {
    return {
      rules: [],
      diagnostics: [
        makeDiagnostic({
          code: "config.rules.invalid",
          message: "Validation config rules must be an object.",
          severity: "error",
        }),
      ],
    };
  }

  const loaded: LoadedValidationConfig = { rules: [], diagnostics: [] };

  for (const [ruleId, ruleConfig] of Object.entries(rules)) {
    if (ruleId !== REQUIRED_FRONTMATTER_RULE_ID) {
      loaded.diagnostics.push(
        makeDiagnostic({
          code: "config.rule.unsupported",
          ruleId,
          message: `Unsupported validation rule "${ruleId}".`,
          severity: "error",
        }),
      );
      continue;
    }

    const parsed = parseRequiredFrontmatterRuleConfig(ruleConfig);

    if (parsed.diagnostic !== undefined) {
      loaded.diagnostics.push(parsed.diagnostic);
      continue;
    }

    loaded.rules.push(parsed.rule);
  }

  return loaded;
}
