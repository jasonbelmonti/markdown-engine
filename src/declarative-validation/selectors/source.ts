import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineNode,
  EngineNodeTarget,
  EngineSection,
  EngineSourceSlice,
} from "../../api/document.js";

export function sectionText(
  document: EngineDocument,
  section: EngineSection,
): string {
  return [
    section.title,
    ...section.bodyTargets
      .map((target) => nodeTextByTargetId(document, target.id))
      .filter((text) => text.length > 0),
  ].join("\n");
}

export function sourceFromTarget(
  document: EngineDocument,
  target: EngineNodeTarget,
): { source: EngineSourceSlice } | Record<string, never> {
  const source = documentQueries.sourceSlice(document, target);

  return source === undefined ? {} : { source };
}

export function targetMatchesSection(
  document: EngineDocument,
  targetId: string,
  sectionTitle: string | undefined,
): boolean {
  if (sectionTitle === undefined) {
    return true;
  }

  return documentQueries
    .sections(document, { title: sectionTitle })
    .some((section) => sectionContainsTarget(document, section, targetId));
}

export function nodeTextByTargetId(
  document: EngineDocument,
  targetId: string,
): string {
  const node = nodeByTargetId(document, targetId);

  return node === undefined ? "" : normalizedNodeText(node);
}

function sectionContainsTarget(
  document: EngineDocument,
  section: EngineSection,
  targetId: string,
): boolean {
  if (
    section.target.id === targetId ||
    section.headingTarget.id === targetId ||
    section.bodyTargets.some((target) => target.id === targetId)
  ) {
    return true;
  }

  return section.bodyTargets.some((target) =>
    nodeContainsTarget(nodeByTargetId(document, target.id), targetId),
  );
}

function nodeContainsTarget(node: EngineNode | undefined, targetId: string): boolean {
  if (node?.target?.id === targetId) {
    return true;
  }

  return (node?.children ?? []).some((child) => nodeContainsTarget(child, targetId));
}

function nodeByTargetId(
  document: EngineDocument,
  targetId: string,
): EngineNode | undefined {
  return documentQueries.nodes(document, { targetId })[0];
}

function normalizedNodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => normalizedNodeText(child)).join("");
}
