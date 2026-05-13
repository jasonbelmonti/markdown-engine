import type { EngineDocument, EngineNode } from "../../api/document.js";

export function documentTextOffsetForTarget(
  document: EngineDocument,
  targetId: string,
): number | undefined {
  let offset = 0;

  for (const node of document.children) {
    const targetOffset = nodeDocumentTextOffset(node, targetId, offset);

    if (targetOffset !== undefined) {
      return targetOffset;
    }

    offset += normalizedNodeText(node).length + 1;
  }

  return undefined;
}

function nodeDocumentTextOffset(
  node: EngineNode,
  targetId: string,
  offset: number,
): number | undefined {
  if (node.target?.id === targetId) {
    return offset;
  }

  let childOffset = offset;

  for (const child of node.children ?? []) {
    const targetOffset = nodeDocumentTextOffset(child, targetId, childOffset);

    if (targetOffset !== undefined) {
      return targetOffset;
    }

    childOffset += normalizedNodeText(child).length;
  }

  return undefined;
}

function normalizedNodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => normalizedNodeText(child)).join("");
}
