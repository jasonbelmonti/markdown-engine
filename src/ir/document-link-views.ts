import type { EngineLink, EngineNode } from "../api/document.js";
import { flatMapNodes } from "./document-node-walk.js";

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
        ...(node.sourceRange !== undefined
          ? { sourceRange: node.sourceRange }
          : {}),
      },
    ];
  });
}
