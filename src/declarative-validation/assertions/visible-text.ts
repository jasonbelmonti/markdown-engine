import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineNode,
  EngineNodeTarget,
} from "../../api/document.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";

/** Structural text only: ignore raw HTML, preserve literal code and decoded text. */
export function visibleText(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
): string {
  const textAt = (nodeTarget: EngineNodeTarget): string =>
    documentQueries
      .nodes(document, { targetId: nodeTarget.id })
      .map(nodeText)
      .join("");

  switch (target.kind) {
    case "document":
      return document.children.map(nodeText).join("\n");
    case "section":
      return [
        textAt(target.section.headingTarget),
        ...target.section.bodyTargets.map(textAt),
      ].join("\n");
    case "heading":
      return textAt(target.section.headingTarget);
    case "table":
      return textAt(target.table.target);
    case "tableRow":
      return target.cells.map((cell) => textAt(cell.target)).join(" ");
    case "tableCell":
      return textAt(target.cell.target);
    case "textSpan":
      return textAt(target.span.target);
    case "link":
      return textAt(target.link.target);
    case "list":
      return textAt(target.list.target);
  }
}

function nodeText(node: EngineNode): string {
  if (
    node.type === "html" ||
    node.type === "definition" ||
    node.type === "yaml"
  ) {
    return "";
  }
  return node.children === undefined
    ? (node.text ?? "")
    : node.children.map(nodeText).join("");
}
