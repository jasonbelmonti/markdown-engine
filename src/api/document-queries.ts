import type {
  EngineDocument,
  EngineDocumentQueries,
  EngineLink,
  EngineLinkQuery,
  EngineList,
  EngineListQuery,
  EngineNode,
  EngineNodeQuery,
  EngineSection,
  EngineSectionQuery,
  EngineSourceSlice,
  EngineTable,
  EngineTableQuery,
  EngineNodeTarget,
  EngineTextSpan,
  EngineTextSpanQuery,
} from "./document.js";
import { flattenNodes } from "../ir/document-node-walk.js";

export const documentQueries: EngineDocumentQueries = {
  nodes,
  sections,
  textSpans,
  tables,
  lists,
  links,
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

function sections(
  document: EngineDocument,
  query: EngineSectionQuery = {},
): readonly EngineSection[] {
  return (document.sections ?? []).filter((section) => {
    if (query.targetId !== undefined && section.target.id !== query.targetId) {
      return false;
    }

    if (
      query.headingTargetId !== undefined &&
      section.headingTarget.id !== query.headingTargetId
    ) {
      return false;
    }

    if (
      query.parentSectionTargetId !== undefined &&
      section.parentSection?.id !== query.parentSectionTargetId
    ) {
      return false;
    }

    if (query.title !== undefined && section.title !== query.title) {
      return false;
    }

    return query.depth === undefined || section.depth === query.depth;
  });
}

function textSpans(
  document: EngineDocument,
  query: EngineTextSpanQuery = {},
): readonly EngineTextSpan[] {
  return (document.textSpans ?? []).filter((span) => {
    if (query.targetId !== undefined && span.target.id !== query.targetId) {
      return false;
    }

    if (query.nodeType !== undefined && span.target.nodeType !== query.nodeType) {
      return false;
    }

    if (query.text !== undefined && span.text !== query.text) {
      return false;
    }

    return (
      query.textIncludes === undefined ||
      span.text.includes(query.textIncludes)
    );
  });
}

function tables(
  document: EngineDocument,
  query: EngineTableQuery = {},
): readonly EngineTable[] {
  return (document.tables ?? []).filter(
    (table) => query.targetId === undefined || table.target.id === query.targetId,
  );
}

function lists(
  document: EngineDocument,
  query: EngineListQuery = {},
): readonly EngineList[] {
  return (document.lists ?? []).filter((list) => {
    if (query.targetId !== undefined && list.target.id !== query.targetId) {
      return false;
    }

    if (query.ordered !== undefined && list.ordered !== query.ordered) {
      return false;
    }

    return (
      query.depth === undefined ||
      list.items.some((item) => item.depth === query.depth)
    );
  });
}

function links(
  document: EngineDocument,
  query: EngineLinkQuery = {},
): readonly EngineLink[] {
  return (document.links ?? []).filter((link) => {
    if (query.targetId !== undefined && link.target.id !== query.targetId) {
      return false;
    }

    if (query.url !== undefined && link.url !== query.url) {
      return false;
    }

    return query.text === undefined || link.text === query.text;
  });
}

function sourceSlice(
  document: EngineDocument,
  target: EngineNodeTarget,
): EngineSourceSlice | undefined {
  if (target.kind !== "node") {
    return undefined;
  }

  const section = (document.sections ?? []).find(
    (section) => section.target.id === target.id,
  );

  if (section !== undefined) {
    return sourceSlice(document, section.headingTarget);
  }

  return flattenNodes(document.children).find(
    (node) => node.target?.id === target.id,
  )?.source;
}
