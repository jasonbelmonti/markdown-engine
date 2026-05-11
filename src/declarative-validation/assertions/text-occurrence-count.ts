import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import { countNonOverlappingLiteralOccurrences } from "./literal-text.js";

type TextOccurrenceCountAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "textOccurrenceCount" }
>;

export function evaluateTextOccurrenceCount(
  assertion: TextOccurrenceCountAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return context.selection.targets.flatMap((target, targetOrder) =>
    evaluateTextOccurrenceCountTarget(assertion, context, target, targetOrder),
  );
}

function evaluateTextOccurrenceCountTarget(
  assertion: TextOccurrenceCountAssertion,
  context: AssertionEvaluationContext,
  target: DeclarativeSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  const actualCount = countNonOverlappingLiteralOccurrences(
    target.text,
    assertion.text,
  );

  if (actualCount === assertion.count) {
    return [];
  }

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      `Selected ${target.kind} text must contain "${assertion.text}" exactly ${assertion.count} time(s); found ${actualCount}.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target,
        targetOrder,
      },
    ),
  ];
}
