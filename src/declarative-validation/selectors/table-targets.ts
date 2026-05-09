import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineTable,
  EngineTableCell,
} from "../../api/document.js";
import type {
  DeclarativeSelector,
  DeclarativeTableCellPredicate,
} from "../profile/index.js";
import type { DeclarativeSelectionTarget } from "./index.js";
import { sourceFromTarget, targetMatchesSection } from "./source.js";

export function tableTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "table" }>,
): DeclarativeSelectionTarget[] {
  return tablesMatching(document, selector.section, selector.header).map((table) => ({
    kind: "table" as const,
    table,
    text: tableText(table),
    ...sourceFromTarget(document, table.target),
  }));
}

export function tableRowTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "tableRow" }>,
): DeclarativeSelectionTarget[] {
  return tablesMatching(document, selector.section, selector.tableHeader).flatMap(
    (table) =>
      dataRows(table)
        .filter((row) => rowMatchesPredicate(table, row.cells, selector.where))
        .map((row) => ({
          kind: "tableRow" as const,
          table,
          rowIndex: row.rowIndex,
          cells: row.cells,
          text: rowText(row.cells),
        })),
  );
}

export function tableCellTargets(
  document: EngineDocument,
  selector: Extract<DeclarativeSelector, { target: "tableCell" }>,
): DeclarativeSelectionTarget[] {
  return tablesMatching(document, selector.section, selector.tableHeader).flatMap(
    (table) => {
      const columnIndex = columnIndexForHeader(table, selector.column);

      if (columnIndex === undefined) {
        return [];
      }

      return dataRows(table)
        .filter((row) => rowMatchesPredicate(table, row.cells, selector.rowWhere))
        .flatMap((row) => {
          const cell = row.cells.find(
            (candidate) => candidate.columnIndex === columnIndex,
          );

          return cell === undefined
            ? []
            : [
                {
                  kind: "tableCell" as const,
                  table,
                  cell,
                  text: cell.text,
                  ...sourceFromTarget(document, cell.target),
                },
              ];
        });
    },
  );
}

function tablesMatching(
  document: EngineDocument,
  sectionTitle: string | undefined,
  headers: readonly string[] | undefined,
): readonly EngineTable[] {
  return documentQueries
    .tables(document)
    .filter((table) => targetMatchesSection(document, table.target.id, sectionTitle))
    .filter((table) => headerMatches(table, headers));
}

function headerMatches(
  table: EngineTable,
  expectedHeaders: readonly string[] | undefined,
): boolean {
  return expectedHeaders === undefined
    ? true
    : orderedSubsequence(headerCells(table).map((cell) => cell.text), expectedHeaders);
}

function headerCells(table: EngineTable): readonly EngineTableCell[] {
  return sortCellsByColumn(table.cells.filter((cell) => cell.header));
}

function dataRows(
  table: EngineTable,
): readonly { rowIndex: number; cells: readonly EngineTableCell[] }[] {
  const rowIndexes = [
    ...new Set(table.cells.filter((cell) => !cell.header).map((cell) => cell.rowIndex)),
  ].sort(numericSort);

  return rowIndexes.map((rowIndex) => ({
    rowIndex,
    cells: sortCellsByColumn(
      table.cells.filter((cell) => cell.rowIndex === rowIndex && !cell.header),
    ),
  }));
}

function rowMatchesPredicate(
  table: EngineTable,
  cells: readonly EngineTableCell[],
  predicate: DeclarativeTableCellPredicate | undefined,
): boolean {
  if (predicate === undefined) {
    return true;
  }

  const columnIndex = columnIndexForHeader(table, predicate.column);
  const cellText =
    columnIndex === undefined
      ? undefined
      : cells.find((cell) => cell.columnIndex === columnIndex)?.text;

  if (cellText === undefined) {
    return false;
  }

  if (predicate.equals !== undefined && cellText !== predicate.equals) {
    return false;
  }

  return predicate.includes === undefined || cellText.includes(predicate.includes);
}

function columnIndexForHeader(
  table: EngineTable,
  column: string,
): number | undefined {
  return headerCells(table).find((cell) => cell.text === column)?.columnIndex;
}

function tableText(table: EngineTable): string {
  return dataRowsWithHeader(table).map((cells) => rowText(cells)).join("\n");
}

function dataRowsWithHeader(table: EngineTable): readonly (readonly EngineTableCell[])[] {
  const rowIndexes = [...new Set(table.cells.map((cell) => cell.rowIndex))].sort(
    numericSort,
  );

  return rowIndexes.map((rowIndex) =>
    sortCellsByColumn(table.cells.filter((cell) => cell.rowIndex === rowIndex)),
  );
}

function sortCellsByColumn(cells: EngineTableCell[]): EngineTableCell[] {
  return [...cells].sort((left, right) => left.columnIndex - right.columnIndex);
}

function numericSort(left: number, right: number): number {
  return left - right;
}

function rowText(cells: readonly EngineTableCell[]): string {
  return cells.map((cell) => cell.text).join("\t");
}

function orderedSubsequence(
  availableValues: readonly string[],
  expectedValues: readonly string[],
): boolean {
  let cursor = -1;

  for (const expectedValue of expectedValues) {
    const nextIndex = availableValues.findIndex(
      (availableValue, index) =>
        index > cursor && availableValue === expectedValue,
    );

    if (nextIndex === -1) {
      return false;
    }

    cursor = nextIndex;
  }

  return true;
}
