import type { EngineTable, EngineTableCell } from "../../api/document.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type TableColumnsExactAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "tableColumnsExact" }
>;

type TableSelectionTarget = Extract<
  DeclarativeSelectionTarget,
  { kind: "table" }
>;

export function evaluateTableColumnsExact(
  assertion: TableColumnsExactAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return context.selection.targets.flatMap((target, targetOrder) =>
    target.kind === "table"
      ? exactColumnDiagnostic(assertion, context, target, targetOrder)
      : [],
  );
}

function exactColumnDiagnostic(
  assertion: TableColumnsExactAssertion,
  context: AssertionEvaluationContext,
  target: TableSelectionTarget,
  targetOrder: number,
): AssertionDiagnostic[] {
  const actualCells = headerCells(target.table);
  const actualColumns = actualCells.map((cell) => cell.text);

  if (headerSequencesEqual(assertion.columns, actualColumns)) {
    return [];
  }

  const mismatchedCell = firstMismatchedOrExcessCell(
    assertion.columns,
    actualCells,
  );

  return [
    validationDiagnostic(
      "profile.validation.assertionFailed",
      `Selected table columns must exactly match ${headerSequence(assertion.columns)}; found ${headerSequence(actualColumns)}.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target,
        targetOrder,
        targetKey: `table:${target.table.target.id}:columns`,
        ...(mismatchedCell?.sourceRange === undefined
          ? {}
          : { sourceRange: mismatchedCell.sourceRange }),
      },
    ),
  ];
}

function headerSequencesEqual(
  expected: readonly string[],
  actual: readonly string[],
): boolean {
  return (
    expected.length === actual.length &&
    expected.every((column, index) => column === actual[index])
  );
}

function firstMismatchedOrExcessCell(
  expected: readonly string[],
  actualCells: readonly EngineTableCell[],
): EngineTableCell | undefined {
  return actualCells.find((cell, index) => expected[index] !== cell.text);
}

function headerCells(table: EngineTable): readonly EngineTableCell[] {
  return [...table.cells]
    .filter((cell) => cell.header)
    .sort((left, right) => left.columnIndex - right.columnIndex);
}

function headerSequence(columns: readonly string[]): string {
  return JSON.stringify(columns);
}
