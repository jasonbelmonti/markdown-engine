import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { validationDiagnostic } from "./diagnostics.js";

type SelectionCountAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "selectionCount" }
>;

export function evaluateSelectionCount(
  assertion: SelectionCountAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const actualCount = context.selection.targets.length;

  if (isCountWithinBounds(actualCount, assertion)) {
    return [];
  }

  const firstExcessTargetOrder = assertion.max;
  const firstExcessTarget =
    firstExcessTargetOrder === undefined
      ? undefined
      : context.selection.targets[firstExcessTargetOrder];

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      `Rule selector target count must be ${selectionCountRequirement(assertion)}; found ${actualCount}.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        ...(firstExcessTarget !== undefined && firstExcessTargetOrder !== undefined
          ? { target: firstExcessTarget, targetOrder: firstExcessTargetOrder }
          : { targetKey: "selection:count" }),
      },
    ),
  ];
}

function isCountWithinBounds(
  actualCount: number,
  assertion: SelectionCountAssertion,
): boolean {
  return (
    (assertion.min === undefined || actualCount >= assertion.min) &&
    (assertion.max === undefined || actualCount <= assertion.max)
  );
}

function selectionCountRequirement(assertion: SelectionCountAssertion): string {
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
