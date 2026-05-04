import type { EngineDocument } from "../api/document.js";
import { buildSections } from "./document-sections.js";
import {
  collectLinks,
  collectLists,
  collectTables,
  collectTextSpans,
} from "./document-structural-views.js";
import {
  targetFor,
  type DraftViewBuildOptions,
  withNodeMetadata,
} from "./document-targets.js";

export function buildDraftDocumentViews(
  document: EngineDocument,
  options: DraftViewBuildOptions,
): EngineDocument {
  const children = document.children.map((node, index) =>
    withNodeMetadata(node, [index], options),
  );

  return {
    ...document,
    version: "1.0.0-draft",
    target: targetFor("document", [], document.sourceRange),
    children,
    compatibility: {
      mode: "default",
      reason: "1.0 draft document contract",
    },
    sections: buildSections(children),
    textSpans: collectTextSpans(children),
    tables: collectTables(children),
    lists: collectLists(children),
    links: collectLinks(children),
  };
}
