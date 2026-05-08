import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineNode,
  EngineSection,
  EngineSourceSlice,
} from "../../api/document.js";
import type { DeclarativeSelector } from "../profile/index.js";

/** @internal Selector results remain internal to declarative validation. */
export interface DeclarativeSelection {
  document: EngineDocument;
  selector: DeclarativeSelector;
  targets: readonly DeclarativeSelectionTarget[];
}

export type DeclarativeSelectorTarget = DeclarativeSelector["target"];

export type DeclarativeSelectionTarget =
  | {
      kind: "document";
      text: string;
    }
  | {
      kind: "section";
      section: EngineSection;
      text: string;
      source?: EngineSourceSlice;
    };

export function resolveDeclarativeSelector(
  document: EngineDocument,
  selector: DeclarativeSelector,
): DeclarativeSelection {
  switch (selector.target) {
    case "document":
      return {
        document,
        selector,
        targets: [
          {
            kind: "document",
            text: documentText(document),
          },
        ],
      };

    case "section":
      return {
        document,
        selector,
        targets: documentQueries
          .sections(document, {
            ...(selector.title !== undefined ? { title: selector.title } : {}),
            ...(selector.depth !== undefined ? { depth: selector.depth } : {}),
          })
          .map((section) => ({
            kind: "section" as const,
            section,
            text: sectionText(document, section),
            ...sectionSource(document, section),
          })),
      };

    default:
      return {
        document,
        selector,
        targets: [],
      };
  }
}

function documentText(document: EngineDocument): string {
  return [
    ...documentQueries.sections(document).map((section) => section.title),
    ...documentQueries.textSpans(document).map((span) => span.text),
  ].join("\n");
}

function sectionText(document: EngineDocument, section: EngineSection): string {
  const nodesByTargetId = new Map(
    documentQueries
      .nodes(document)
      .flatMap((node) =>
        node.target === undefined ? [] : [[node.target.id, node] as const],
      ),
  );

  return [
    section.title,
    ...section.bodyTargets
      .map((target) => nodesByTargetId.get(target.id))
      .filter((node): node is EngineNode => node !== undefined)
      .map((node) => normalizedNodeText(node))
      .filter((text) => text.length > 0),
  ].join("\n");
}

function normalizedNodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => normalizedNodeText(child)).join("");
}

function sectionSource(
  document: EngineDocument,
  section: EngineSection,
): { source: EngineSourceSlice } | Record<string, never> {
  const source = documentQueries.sourceSlice(document, section.target);

  return source === undefined ? {} : { source };
}
