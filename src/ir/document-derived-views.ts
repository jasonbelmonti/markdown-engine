import type { EngineDocument } from "../api/document.js";
import { collectLinkReferences } from "./document-link-reference-views.js";
import { collectLinks } from "./document-link-views.js";
import { collectLists } from "./document-list-views.js";
import { buildSections } from "./document-sections.js";
import { collectTables } from "./document-table-views.js";
import {
  targetFor,
  type DocumentViewBuildOptions,
  withNodeMetadata,
} from "./document-targets.js";
import { collectTextSpans } from "./document-text-spans.js";

export function buildDocumentViews(
  document: EngineDocument,
  options: DocumentViewBuildOptions,
): EngineDocument {
  const children = document.children.map((node, index) =>
    withNodeMetadata(node, [index], options),
  );

  return {
    ...document,
    version: "1.0.0",
    target: targetFor("document", [], document.sourceRange),
    children,
    compatibility: {
      mode: "default",
      reason: "1.0 document contract",
    },
    sections: buildSections(children),
    textSpans: collectTextSpans(children),
    tables: collectTables(children),
    lists: collectLists(children),
    links: collectLinks(children),
    linkReferences: collectLinkReferences(children),
  };
}
