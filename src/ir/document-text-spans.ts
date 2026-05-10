import type { EngineNode, EngineTextSpan } from "../api/document.js";
import { flatMapNodes } from "../internal/document-node-walk.js";

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
        ...(node.sourceRange !== undefined
          ? { sourceRange: node.sourceRange }
          : {}),
      },
    ];
  });
}
