import type { EngineNode } from "../api/document.js";

/**
 * Walks recursive document nodes in preorder depth-first order: each node is
 * emitted before its descendants, and descendants are exhausted before the next
 * sibling.
 */
export function flatMapNodes<T>(
  nodes: readonly EngineNode[],
  callback: (node: EngineNode) => readonly T[],
): T[] {
  const mapped: T[] = [];
  const stack = [...nodes].reverse();

  while (stack.length > 0) {
    const node = stack.pop();

    if (node === undefined) {
      continue;
    }

    for (const value of callback(node)) {
      mapped.push(value);
    }

    const children = node.children ?? [];

    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];

      if (child !== undefined) {
        stack.push(child);
      }
    }
  }

  return mapped;
}

export function flattenNodes(nodes: readonly EngineNode[]): EngineNode[] {
  return flatMapNodes(nodes, (node) => [node]);
}

export function nodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => nodeText(child)).join("");
}
