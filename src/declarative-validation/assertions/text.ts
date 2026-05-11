import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import { countNonOverlappingLiteralOccurrences } from "./literal-text.js";

type TextAssertion = Extract<CompiledDeclarativeAssertion, { kind: "text" }>;

export function evaluateText(
  assertion: TextAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
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
  const diagnostics: AssertionDiagnostic[] = [];

  if (
    assertion.contains !== undefined &&
    !target.text.includes(assertion.contains)
  ) {
    diagnostics.push(
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
    );
  }

  diagnostics.push(
    ...excludedTextDiagnostics(assertion, context, target, targetOrder),
  );

  return diagnostics;
}

function excludedTextDiagnostics(
  assertion: TextAssertion,
  context: AssertionEvaluationContext,
  target: DeclarativeSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  return (assertion.excludes ?? [])
    .filter(
      (excludedText) =>
        countNonOverlappingLiteralOccurrences(target.text, excludedText) > 0,
    )
    .map((excludedText, excludedIndex) =>
      validationDiagnostic(
        "profile.validation.textExcluded",
        `Selected ${target.kind} text must not contain "${excludedText}".`,
        context.rule,
        {
          assertionIndex: context.assertionIndex,
          target,
          targetOrder,
          diagnosticOrder: excludedIndex + 1,
        },
      ),
    );
}
