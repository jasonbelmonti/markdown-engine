import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  unsupportedEvaluatorDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type TextAssertion = Extract<CompiledDeclarativeAssertion, { kind: "text" }>;

export function evaluateText(
  assertion: TextAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (hasUnsupportedTextEvaluatorPredicate(assertion)) {
    return [
      unsupportedEvaluatorDiagnostic(
        assertion,
        context.rule,
        context.assertionIndex,
      ),
    ];
  }

  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return context.selection.targets.flatMap((target, targetOrder) =>
    evaluateTextTarget(assertion, context, target, targetOrder),
  );
}

function evaluateTextTarget(
  assertion: TextAssertion,
  context: AssertionEvaluationContext,
  target: DeclarativeSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  if (assertion.contains === undefined || target.text.includes(assertion.contains)) {
    return [];
  }

  return [
    validationDiagnostic(
      "profile.validation.textMissing",
      `Selected ${target.kind} text must contain "${assertion.contains}".`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target,
        targetOrder,
      },
    ),
  ];
}

function hasUnsupportedTextEvaluatorPredicate(assertion: TextAssertion): boolean {
  return assertion.excludes !== undefined;
}
