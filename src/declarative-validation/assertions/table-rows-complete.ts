import type { EngineTable, EngineTableCell } from "../../api/document.js";
import type { AssertionEvaluationContext } from "./context.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
  type AssertionDiagnostic,
} from "./diagnostics.js";

export function evaluateTableRowsComplete(
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }
  return context.selection.targets.flatMap((target, targetOrder) =>
    target.kind === "table"
      ? incompleteRows(target.table, context, targetOrder)
      : [],
  );
}

function incompleteRows(
  table: EngineTable,
  context: AssertionEvaluationContext,
  targetOrder: number,
): AssertionDiagnostic[] {
  const expected = columnIndexes(table.cells.filter((cell) => cell.header));
  const rows = new Map<number, EngineTableCell[]>();
  for (const cell of table.cells) {
    if (!cell.header) {
      const cells = rows.get(cell.rowIndex) ?? [];
      cells.push(cell);
      rows.set(cell.rowIndex, cells);
    }
  }
  return [...rows].sort(([left], [right]) => left - right).flatMap(([rowIndex, cells]) => {
    const actual = columnIndexes(cells);
    if (expected.length === actual.length && expected.every((column, i) => column === actual[i])) {
      return [];
    }
    const sourceRange = [...cells]
      .sort((left, right) => left.columnIndex - right.columnIndex)
      .find((cell) => cell.sourceRange !== undefined)?.sourceRange;
    return [validationDiagnostic(
      "profile.validation.assertionFailed",
      `Selected table "${table.target.id}" body row ${rowIndex} must have column positions ${JSON.stringify(expected)}; found ${JSON.stringify(actual)}.`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        targetOrder,
        targetKey: `table:${table.target.id}:row:${rowIndex}`,
        diagnosticOrder: rowIndex,
        ...(sourceRange === undefined ? {} : { sourceRange }),
      },
    )];
  });
}

function columnIndexes(cells: readonly EngineTableCell[]): number[] {
  return cells.map((cell) => cell.columnIndex).sort((left, right) => left - right);
}
