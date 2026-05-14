import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { emptySelectionDiagnostic } from "./diagnostics.js";

export function evaluateExists(
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return [];
}
