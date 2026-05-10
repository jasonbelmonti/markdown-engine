import type { EngineLink, EngineNode } from "../api/document.js";
import { linkTitle, linkUrl } from "../api/engine-node-attributes.js";
import { flatMapNodes } from "../internal/document-node-walk.js";

export function collectLinks(nodes: readonly EngineNode[]): readonly EngineLink[] {
  return flatMapNodes(nodes, (node) => {
    const url = linkUrl(node);

    if (node.type !== "link" || node.target === undefined || url === undefined) {
      return [];
    }

    const title = linkTitle(node);

    return [
      {
        target: node.target,
        url,
        text: node.text ?? "",
        ...(title !== undefined ? { title } : {}),
        ...(node.sourceRange !== undefined
          ? { sourceRange: node.sourceRange }
          : {}),
      },
    ];
  });
}
