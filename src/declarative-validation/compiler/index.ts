import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationProfile } from "../profile/index.js";

/** @internal Private compiled plans must not be exported from the package root. */
export interface CompiledDeclarativeValidationPlan {
  profile: ValidationProfile;
  rules: readonly CompiledDeclarativeValidationRule[];
}

/** @internal Private rule-plan records are owned by the compiler package. */
export interface CompiledDeclarativeValidationRule {
  ruleId: string;
}

/** @internal */
export interface DeclarativeValidationCompileResult {
  plan?: CompiledDeclarativeValidationPlan;
  diagnostics: readonly MarkdownDiagnostic[];
}
