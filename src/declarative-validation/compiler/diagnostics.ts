import type { MarkdownDiagnostic } from "../../api/diagnostics.js";

export function compileDiagnostic(
  code: string,
  message: string,
  ruleId: string,
): MarkdownDiagnostic {
  return {
    code,
    ruleId,
    message,
    severity: "error",
  };
}
