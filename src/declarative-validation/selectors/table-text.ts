import type { EngineTable, EngineTableCell } from "../../api/document.js";

export function tableText(table: EngineTable): string {
  const rowIndexes = [...new Set(table.cells.map((cell) => cell.rowIndex))].sort(
    numericSort,
  );

  return rowIndexes
    .map((rowIndex) =>
      tableRowText(table.cells.filter((cell) => cell.rowIndex === rowIndex)),
    )
    .join("\n");
}

export function tableRowText(cells: readonly EngineTableCell[]): string {
  return [...cells]
    .sort((left, right) => left.columnIndex - right.columnIndex)
    .map((cell) => cell.text)
    .join("\t");
}

function numericSort(left: number, right: number): number {
  return left - right;
}
