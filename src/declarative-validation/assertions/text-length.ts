import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type TextLengthAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "textLength" }
>;

export function evaluateTextLength(
  assertion: TextLengthAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return context.selection.targets.flatMap((target, targetOrder) =>
    evaluateTextLengthTarget(assertion, context, target, targetOrder),
  );
}

function evaluateTextLengthTarget(
  assertion: TextLengthAssertion,
  context: AssertionEvaluationContext,
  target: DeclarativeSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  const actualLength = target.text.length;

  if (isLengthWithinBounds(actualLength, assertion)) {
    return [];
  }

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      textLengthMessage(target.kind, actualLength, assertion),
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target,
        targetOrder,
      },
    ),
  ];
}

function isLengthWithinBounds(
  actualLength: number,
  assertion: TextLengthAssertion,
): boolean {
  return (
    (assertion.min === undefined || actualLength >= assertion.min) &&
    (assertion.max === undefined || actualLength <= assertion.max)
  );
}

function textLengthMessage(
  targetKind: DeclarativeSelectionTarget["kind"],
  actualLength: number,
  assertion: TextLengthAssertion,
): string {
  return `Selected ${targetKind} text length must be ${textLengthRequirement(assertion)}; found ${actualLength}.`;
}

function textLengthRequirement(assertion: TextLengthAssertion): string {
  if (assertion.min !== undefined && assertion.max !== undefined) {
    return `between ${assertion.min} and ${assertion.max}`;
  }

  if (assertion.min !== undefined) {
    return `at least ${assertion.min}`;
  }

  if (assertion.max !== undefined) {
    return `at most ${assertion.max}`;
  }

  return "within configured bounds";
}
