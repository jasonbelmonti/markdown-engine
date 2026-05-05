import type {
  EngineNode,
  EngineTable,
  EngineTableCell,
} from "../api/document.js";
import { flatMapNodes, nodeText } from "./document-node-walk.js";
import { requireNodeTarget } from "./document-targets.js";

export function collectTables(nodes: readonly EngineNode[]): readonly EngineTable[] {
  return flatMapNodes(nodes, (node) => {
    if (node.type !== "table" || node.target === undefined) {
      return [];
    }

    return [
      {
        target: node.target,
        cells: tableCells(node),
      },
    ];
  });
}

function tableCells(table: EngineNode): readonly EngineTableCell[] {
  const rows = (table.children ?? []).filter((node) => node.type === "tableRow");

  return rows.flatMap((row, rowIndex) =>
    (row.children ?? [])
      .filter((node) => node.type === "tableCell" && node.target !== undefined)
      .map((cell, columnIndex) => ({
        target: requireNodeTarget(cell),
        text: nodeText(cell),
        rowIndex,
        columnIndex,
        header: rowIndex === 0,
        ...(cell.sourceRange !== undefined
          ? { sourceRange: cell.sourceRange }
          : {}),
      })),
  );
}
