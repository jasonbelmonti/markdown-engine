import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { isPlainRecord } from "../internal/plain-record.js";
import {
  parseValidationRuleConfig,
  type SupportedValidationRuleConfig,
} from "../rules/index.js";

export interface LoadedValidationConfig {
  rules: SupportedValidationRuleConfig[];
  diagnostics: MarkdownDiagnostic[];
}

export function loadValidationConfig(
  config: unknown = {},
): LoadedValidationConfig {
  if (!isPlainRecord(config)) {
    return {
      rules: [],
      diagnostics: [
        makeDiagnostic({
          code: "config.invalid",
          message: "Validation config must be an object.",
          severity: "error",
        }),
      ],
    };
  }

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
    const parsed = parseValidationRuleConfig(ruleId, ruleConfig);

    if (parsed === undefined) {
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

    if (parsed.diagnostic !== undefined) {
      loaded.diagnostics.push(parsed.diagnostic);
      continue;
    }

    loaded.rules.push(parsed.rule);
  }

  return loaded;
}
