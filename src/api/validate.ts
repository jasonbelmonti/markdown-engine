import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument } from "./document.js";
import { loadValidationConfig } from "../config/index.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import { evaluateConfiguredRules } from "../rules/index.js";

export interface ValidationConfig {
  rules?: Record<string, unknown>;
}

export interface ValidateOptions {
  path?: string;
}

export interface ValidationRuleResult {
  ruleId: string;
  passed: boolean;
  diagnostics: MarkdownDiagnostic[];
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: MarkdownDiagnostic[];
  ruleResults: ValidationRuleResult[];
}

export type ValidateFunction = (
  document: EngineDocument,
  config?: ValidationConfig,
  options?: ValidateOptions,
) => ValidationResult;

export const validate: ValidateFunction = (
  document,
  config = {},
  _options = {},
) => {
  const loadedConfig = loadValidationConfig(config);
  const ruleResults = evaluateConfiguredRules(document, loadedConfig.rules);
  const diagnostics = [
    ...loadedConfig.diagnostics,
    ...ruleResults.flatMap((result) => result.diagnostics),
  ];

  return {
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics: cloneDiagnostics(diagnostics),
    ruleResults: ruleResults.map((result) => ({
      ruleId: result.ruleId,
      passed: result.passed,
      diagnostics: cloneDiagnostics(result.diagnostics),
    })),
  };
};
