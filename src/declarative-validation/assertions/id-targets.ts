import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineNode,
  EngineNodeTarget,
  EngineTable,
  EngineTableCell,
} from "../../api/document.js";
import type { SourceRange } from "../../api/diagnostics.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import { extractIdTokens, type IdTokenOptions } from "./id-tokens.js";

export interface TargetIdToken {
  value: string;
  comparisonValue: string;
  textOffset: number;
  occurrenceKey: string;
  sourceRange?: SourceRange;
}

interface IdTextSegment {
  text: string;
  occurrenceScope: string;
  sourceRange?: SourceRange;
}

export function extractTargetIdTokens(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return idTextSegmentsForSelectionTarget(document, target).flatMap((segment) =>
    extractIdTokens(segment.text, {
      ...options,
      ...sourceRangeOption(segment),
    }).map((token) => ({
      value: token.value,
      comparisonValue: token.comparisonValue,
      textOffset: token.textOffset,
      occurrenceKey: idOccurrenceKey(segment, token.comparisonValue, token.textOffset),
      ...(token.sourceRange !== undefined ? { sourceRange: token.sourceRange } : {}),
    })),
  );
}

function idTextSegmentsForSelectionTarget(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
): IdTextSegment[] {
  switch (target.kind) {
    case "document":
      return document.children.flatMap((node, nodeIndex) =>
        topLevelNodeSegments(document, node, nodeIndex),
      );

    case "section":
      return [
        textSegment(
          target.section.title,
          target.section.headingTarget.id,
          target.source?.range,
        ),
        ...target.section.bodyTargets.flatMap((bodyTarget) =>
          nodeTargetSegments(document, bodyTarget),
        ),
      ];

    case "heading":
      return [
        textSegment(
          target.text,
          target.section.headingTarget.id,
          target.source?.range,
        ),
      ];

    case "table":
      return tableCellSegments(target.table);

    case "tableRow":
      return tableCellsSegments(target.cells);

    case "tableCell":
      return [tableCellSegment(target.cell)];

    case "textSpan":
      return [textSegment(target.text, target.span.target.id, target.source?.range)];

    case "link":
      return [textSegment(target.text, target.link.target.id, target.source?.range)];

    case "list":
      return nodeTargetSegments(document, target.list.target);
  }
}

function topLevelNodeSegments(
  document: EngineDocument,
  node: EngineNode,
  nodeIndex: number,
): IdTextSegment[] {
  if (node.target === undefined) {
    return nodeTextSegments(document, node, `document-node:${nodeIndex}`);
  }

  return nodeTargetSegments(document, node.target);
}

function nodeTargetSegments(
  document: EngineDocument,
  target: EngineNodeTarget,
): IdTextSegment[] {
  const table = documentQueries.tables(document, { targetId: target.id })[0];

  if (table !== undefined) {
    return tableCellSegments(table);
  }

  const node = documentQueries.nodes(document, { targetId: target.id })[0];

  if (node !== undefined) {
    return nodeTextSegments(document, node, `target:${target.id}`);
  }

  return [];
}

function nodeTextSegments(
  document: EngineDocument,
  node: EngineNode,
  fallbackScope: string,
): IdTextSegment[] {
  if (node.type === "table" && node.target !== undefined) {
    const table = documentQueries.tables(document, { targetId: node.target.id })[0];

    return table === undefined ? [] : tableCellSegments(table);
  }

  if (node.text !== undefined) {
    return [
      textSegment(
        node.text,
        node.target?.id ?? fallbackScope,
        node.source?.range ?? node.sourceRange,
      ),
    ];
  }

  return (node.children ?? []).flatMap((child, childIndex) =>
    nodeTextSegments(document, child, `${fallbackScope}/child:${childIndex}`),
  );
}

function tableCellSegments(table: EngineTable): IdTextSegment[] {
  return tableCellsSegments(table.cells);
}

function tableCellsSegments(cells: readonly EngineTableCell[]): IdTextSegment[] {
  return [...cells].sort(compareCells).map(tableCellSegment);
}

function tableCellSegment(cell: EngineTableCell): IdTextSegment {
  return textSegment(cell.text, cell.target.id, cell.sourceRange);
}

function textSegment(
  text: string,
  occurrenceScope: string,
  sourceRange: SourceRange | undefined,
): IdTextSegment {
  return {
    text,
    occurrenceScope,
    ...(sourceRange !== undefined ? { sourceRange } : {}),
  };
}

function idOccurrenceKey(
  segment: IdTextSegment,
  comparisonValue: string,
  textOffset: number,
): string {
  return `${comparisonValue}:${segment.occurrenceScope}:${textOffset}`;
}

function sourceRangeOption(
  segment: IdTextSegment,
): { sourceRange: SourceRange } | Record<string, never> {
  return segment.sourceRange === undefined ? {} : { sourceRange: segment.sourceRange };
}

function compareCells(left: EngineTableCell, right: EngineTableCell): number {
  return left.rowIndex - right.rowIndex || left.columnIndex - right.columnIndex;
}
