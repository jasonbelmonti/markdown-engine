import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
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
  return [
    section.title,
    ...section.bodyTargets
      .map((target) => documentQueries.sourceSlice(document, target)?.text)
      .filter((text): text is string => text !== undefined),
  ].join("\n");
}

function sectionSource(
  document: EngineDocument,
  section: EngineSection,
): { source: EngineSourceSlice } | Record<string, never> {
  const source = documentQueries.sourceSlice(document, section.target);

  return source === undefined ? {} : { source };
}
