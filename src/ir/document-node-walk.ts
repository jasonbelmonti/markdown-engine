import type { EngineNode } from "../api/document.js";

export function flatMapNodes<T>(
  nodes: readonly EngineNode[],
  callback: (node: EngineNode) => readonly T[],
): T[] {
  return nodes.flatMap((node) => [
    ...callback(node),
    ...flatMapNodes(node.children ?? [], callback),
  ]);
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
