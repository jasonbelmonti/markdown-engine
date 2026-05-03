import type {
  EngineDocument,
  EngineDocumentQueries,
  EngineNode,
  EngineNodeQuery,
  EngineSourceSlice,
  EngineTarget,
} from "./document.js";

export const documentQueries: EngineDocumentQueries = {
  nodes,
  sections: (document) => document.sections ?? [],
  textSpans: (document) => document.textSpans ?? [],
  tables: (document) => document.tables ?? [],
  lists: (document) => document.lists ?? [],
  links: (document) => document.links ?? [],
  sourceSlice,
};

function nodes(
  document: EngineDocument,
  query: EngineNodeQuery = {},
): readonly EngineNode[] {
  return flattenNodes(document.children).filter((node) => {
    if (query.type !== undefined && node.type !== query.type) {
      return false;
    }

    return query.targetId === undefined || node.target?.id === query.targetId;
  });
}

function sourceSlice(
  document: EngineDocument,
  target: EngineTarget,
): EngineSourceSlice | undefined {
  if (target.kind !== "node") {
    return undefined;
  }

  return flattenNodes(document.children).find(
    (node) => node.target?.id === target.id,
  )?.source;
}

function flattenNodes(nodes: readonly EngineNode[]): EngineNode[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenNodes(node.children ?? []),
  ]);
}
