import type { EngineDocument, EngineNode } from "../api/document.js";
import { flattenNodes } from "../internal/document-node-walk.js";

export function findNodes(
  document: EngineDocument,
  predicate: (node: EngineNode) => boolean,
): EngineNode[] {
  return flattenNodes(document.children).filter(predicate);
}
