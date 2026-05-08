import type {
  EngineList,
  EngineListItem,
  EngineNode,
} from "../api/document.js";
import {
  listItemChecked,
  listOrdered,
  listStart,
} from "../api/engine-node-attributes.js";
import { requireNodeTarget } from "./document-targets.js";

export function collectLists(nodes: readonly EngineNode[]): readonly EngineList[] {
  return collectListsAtDepth(nodes, 0);
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

    const start = listStart(node);

    return [
      {
        target: node.target,
        ordered: listOrdered(node) === true,
        ...(start !== undefined ? { start } : {}),
        items: listItems(node, depth),
      },
      ...nestedLists,
    ];
  });
}

function listItems(list: EngineNode, depth: number): readonly EngineListItem[] {
  return (list.children ?? [])
    .filter((node) => node.type === "listItem" && node.target !== undefined)
    .map((item, itemIndex) => {
      const checked = listItemChecked(item);

      return {
        target: requireNodeTarget(item),
        itemIndex,
        depth,
        ...(checked !== undefined ? { checked } : {}),
        ...(item.sourceRange !== undefined ? { sourceRange: item.sourceRange } : {}),
      };
    });
}
