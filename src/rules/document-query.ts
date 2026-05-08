import type { EngineDocument, EngineNode } from "../api/document.js";

export function findNodes(
  document: EngineDocument,
  predicate: (node: EngineNode) => boolean,
): EngineNode[] {
  return flattenNodes(document.children).filter(predicate);
}

export function flattenNodes(nodes: readonly EngineNode[]): EngineNode[] {
  const flattened: EngineNode[] = [];
  const queue = [...nodes];

  for (let index = 0; index < queue.length; index += 1) {
    const node = queue[index];

    if (node === undefined) {
      continue;
    }

    flattened.push(node);
    queue.push(...(node.children ?? []));
  }

  return flattened;
}
