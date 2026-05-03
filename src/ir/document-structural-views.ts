import type {
  EngineLink,
  EngineList,
  EngineListItem,
  EngineNode,
  EngineTable,
  EngineTableCell,
  EngineTextSpan,
} from "../api/document.js";
import { requireNodeTarget } from "./document-targets.js";

export function collectTextSpans(
  nodes: readonly EngineNode[],
): readonly EngineTextSpan[] {
  return flatMapNodes(nodes, (node) => {
    if (node.text === undefined || node.target === undefined) {
      return [];
    }

    return [
      {
        target: node.target,
        text: node.text,
        ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
      },
    ];
  });
}

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

export function collectLists(nodes: readonly EngineNode[]): readonly EngineList[] {
  return collectListsAtDepth(nodes, 0);
}

export function collectLinks(nodes: readonly EngineNode[]): readonly EngineLink[] {
  return flatMapNodes(nodes, (node) => {
    if (
      node.type !== "link" ||
      node.target === undefined ||
      typeof node.attributes?.url !== "string"
    ) {
      return [];
    }

    return [
      {
        target: node.target,
        url: node.attributes.url,
        text: node.text ?? "",
        ...(typeof node.attributes.title === "string"
          ? { title: node.attributes.title }
          : {}),
        ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
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

function collectListsAtDepth(
  nodes: readonly EngineNode[],
  depth: number,
): EngineList[] {
  return nodes.flatMap((node) => {
    const childDepth = node.type === "list" ? depth + 1 : depth;
    const nestedLists = collectListsAtDepth(node.children ?? [], childDepth);

    if (node.type !== "list" || node.target === undefined) {
      return nestedLists;
    }

    return [
      {
        target: node.target,
        ordered: node.attributes?.ordered === true,
        ...(typeof node.attributes?.start === "number"
          ? { start: node.attributes.start }
          : {}),
        items: listItems(node, depth),
      },
      ...nestedLists,
    ];
  });
}

function listItems(list: EngineNode, depth: number): readonly EngineListItem[] {
  return (list.children ?? [])
    .filter((node) => node.type === "listItem" && node.target !== undefined)
    .map((item, itemIndex) => ({
      target: requireNodeTarget(item),
      itemIndex,
      depth,
      ...(typeof item.attributes?.checked === "boolean"
        ? { checked: item.attributes.checked }
        : {}),
      ...(item.sourceRange !== undefined ? { sourceRange: item.sourceRange } : {}),
    }));
}

function flatMapNodes<T>(
  nodes: readonly EngineNode[],
  callback: (node: EngineNode) => readonly T[],
): T[] {
  return nodes.flatMap((node) => [
    ...callback(node),
    ...flatMapNodes(node.children ?? [], callback),
  ]);
}

function nodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => nodeText(child)).join("");
}
