import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  sourceUnavailableDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type SourceLengthAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "sourceLength" }
>;

export function evaluateSourceLength(
  assertion: SourceLengthAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.sourceText === undefined) {
    return [sourceUnavailableDiagnostic(context.rule, context.assertionIndex)];
  }

  const actualLength = context.sourceText.length;

  if (isLengthWithinBounds(actualLength, assertion)) {
    return [];
  }

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      `Document source length must be ${sourceLengthRequirement(assertion)}; found ${actualLength}.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        targetKey: "document:source",
      },
    ),
  ];
}

function isLengthWithinBounds(
  actualLength: number,
  assertion: SourceLengthAssertion,
): boolean {
  return (
    (assertion.min === undefined || actualLength >= assertion.min) &&
    (assertion.max === undefined || actualLength <= assertion.max)
  );
}

function sourceLengthRequirement(assertion: SourceLengthAssertion): string {
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
