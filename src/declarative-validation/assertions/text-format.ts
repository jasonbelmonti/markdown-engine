import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type TextFormatAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "textFormat" }
>;

export function evaluateTextFormat(
  assertion: TextFormatAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  switch (assertion.format) {
    case "isoDate":
      return context.selection.targets.flatMap((target, targetOrder) =>
        evaluateIsoDateTarget(context, target, targetOrder),
      );
  }
}

function evaluateIsoDateTarget(
  context: AssertionEvaluationContext,
  target: DeclarativeSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  if (isIsoDateText(target.text)) {
    return [];
  }

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      `Selected ${target.kind} text must be an exact ISO date in YYYY-MM-DD form.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target,
        targetOrder,
      },
    ),
  ];
}

function isIsoDateText(text: string): boolean {
  if (
    text.length !== 10 ||
    text[4] !== "-" ||
    text[7] !== "-"
  ) {
    return false;
  }

  const year = decimalValue(text, 0, 4);
  const month = decimalValue(text, 5, 7);
  const day = decimalValue(text, 8, 10);

  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const maximumDay = daysInMonth(year, month);

  return maximumDay !== undefined && day >= 1 && day <= maximumDay;
}

function decimalValue(
  text: string,
  start: number,
  end: number,
): number | undefined {
  const zeroCode = 48;
  const nineCode = 57;
  let value = 0;

  for (let index = start; index < end; index += 1) {
    const charCode = text.charCodeAt(index);

    if (charCode < zeroCode || charCode > nineCode) {
      return undefined;
    }

    value = value * 10 + (charCode - zeroCode);
  }

  return value;
}

function daysInMonth(year: number, month: number): number | undefined {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;

    case 4:
    case 6:
    case 9:
    case 11:
      return 30;

    case 2:
      return isLeapYear(year) ? 29 : 28;

    default:
      return undefined;
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
