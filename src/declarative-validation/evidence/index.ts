import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";

export interface DeclarativeValidationEvidence {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly ValidationRuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}
