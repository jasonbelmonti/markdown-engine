import type { MarkdownDiagnostic } from "../../api/diagnostics.js";

export type DeclarativeValidationStage = "profile" | "compile" | "validation";

/** @internal Diagnostic construction remains centralized for later stages. */
export interface DeclarativeValidationDiagnostic extends MarkdownDiagnostic {
  stage: DeclarativeValidationStage;
}
