import type { EngineTable, EngineTableCell } from "../../api/document.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";

type TableColumnsRequiredAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "tableColumnsRequired" }
>;

export function evaluateTableColumnsRequired(
  assertion: TableColumnsRequiredAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return context.selection.targets.flatMap((target, targetOrder) =>
    target.kind === "table"
      ? missingColumnDiagnostics(assertion, context, target, targetOrder)
      : [],
  );
}

function missingColumnDiagnostics(
  assertion: TableColumnsRequiredAssertion,
  context: AssertionEvaluationContext,
  target: Extract<DeclarativeSelectionTarget, { kind: "table" }>,
  targetOrder: number,
): AssertionDiagnostic[] {
  const availableColumns = headerCells(target.table).map((cell) => cell.text);

  return assertion.columns
    .filter((column) => !availableColumns.includes(column))
    .map((column, diagnosticOrder) =>
      validationDiagnostic(
        "profile.validation.assertionFailed",
        `Selected table must include column "${column}".`,
        context.rule,
        {
          assertionIndex: context.assertionIndex,
          target,
          targetOrder,
          targetKey: tableColumnSortKey(target.table, diagnosticOrder, column),
          diagnosticOrder,
        },
      ),
    );
}

function headerCells(table: EngineTable): readonly EngineTableCell[] {
  return [...table.cells]
    .filter((cell) => cell.header)
    .sort((left, right) => left.columnIndex - right.columnIndex);
}

function tableColumnSortKey(
  table: EngineTable,
  diagnosticOrder: number,
  column: string,
): string {
  return `table:${table.target.id}:column:${diagnosticOrder}:${column}`;
}
