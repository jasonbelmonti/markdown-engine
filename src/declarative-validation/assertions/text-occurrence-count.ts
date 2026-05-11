import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

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

function countNonOverlappingLiteralOccurrences(
  text: string,
  literal: string,
): number {
  let count = 0;
  let searchStart = 0;

  while (searchStart <= text.length) {
    const occurrenceIndex = text.indexOf(literal, searchStart);
    if (occurrenceIndex === -1) {
      return count;
    }

    count += 1;
    searchStart = occurrenceIndex + literal.length;
  }

  return count;
}
