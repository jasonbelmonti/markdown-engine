import type {
  EngineList,
  EngineListItem,
  EngineNode,
} from "../api/document.js";
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
