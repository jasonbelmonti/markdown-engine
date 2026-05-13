import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineNode,
  EngineNodeTarget,
  EngineSection,
  EngineTable,
  EngineTableCell,
} from "../../api/document.js";
import type { SourceRange } from "../../api/diagnostics.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import { nodeTextByTargetId } from "../selectors/source.js";
import { extractIdTokens, type IdTokenOptions } from "./id-tokens.js";
import { sourceRangeForNormalizedText } from "./normalized-source-ranges.js";

export interface TargetIdToken {
  value: string;
  comparisonValue: string;
  textOffset: number;
  occurrenceKey?: string;
  documentTextOffset?: number;
  segmentTargetId?: string;
  sectionTargetId?: string;
  sourceRange?: SourceRange;
  sourceRangeCoversToken?: boolean;
}

export interface TableColumnSource {
  section?: string;
  column: string;
}

interface IdTextSegment {
  text: string;
  documentTextOffset?: number;
  segmentTargetId?: string;
  sectionTargetId?: string;
  sourceRange?: SourceRange;
  sourceText?: string;
}

interface TokenSourceRange {
  sourceRange?: SourceRange;
  coversToken: boolean;
}

export function extractTargetIdTokens(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractSegmentIdTokens(
    idTextSegmentsForSelectionTarget(document, target),
    options,
  );
}

export function extractSectionBodyIdTokens(
  document: EngineDocument,
  section: EngineSection,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractSegmentIdTokens(
    sectionBodySegments(document, section, true),
    options,
  );
}

export function extractTableColumnIdTokens(
  document: EngineDocument,
  source: TableColumnSource,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractSegmentIdTokens(tableColumnSegments(document, source), options);
}

export function sectionContainsSection(
  document: EngineDocument,
  parent: EngineSection,
  targetSectionId: string,
): boolean {
  if (parent.target.id === targetSectionId) {
    return true;
  }

  return parent.childSections.some((childTarget) => {
    const childSection = documentQueries.sections(document, {
      targetId: childTarget.id,
    })[0];

    return (
      childSection !== undefined &&
      sectionContainsSection(document, childSection, targetSectionId)
    );
  });
}

function extractSegmentIdTokens(
  segments: readonly IdTextSegment[],
  options: IdTokenOptions,
): TargetIdToken[] {
  return segments.flatMap((segment) => {
    const tokens = extractIdTokens(segment.text, {
      ...options,
      ...sourceRangeOption(segment),
    });
    const tokenSourceRanges = sourceRangesForTokens(segment, tokens);

    return tokens.map((token, tokenIndex) => {
      const tokenSourceRange = tokenSourceRanges[tokenIndex];
      const sourceRange = tokenSourceRange?.sourceRange ?? token.sourceRange;
      const documentTextOffset = tokenDocumentTextOffset(
        segment,
        token.textOffset,
      );
      const occurrenceKey = tokenOccurrenceKey({
        comparisonValue: token.comparisonValue,
        textOffset: token.textOffset,
        documentTextOffset,
        segmentTargetId: segment.segmentTargetId,
        sourceRange,
        sourceRangeCoversToken: tokenSourceRange?.coversToken === true,
      });

      return {
        value: token.value,
        comparisonValue: token.comparisonValue,
        textOffset: token.textOffset,
        ...(occurrenceKey !== undefined ? { occurrenceKey } : {}),
        ...(documentTextOffset !== undefined ? { documentTextOffset } : {}),
        ...segmentTargetIdProperty(segment),
        ...sectionTargetIdProperty(segment),
        ...(sourceRange !== undefined ? { sourceRange } : {}),
        ...(tokenSourceRange?.coversToken === true
          ? { sourceRangeCoversToken: true }
          : {}),
      };
    });
  });
}

function idTextSegmentsForSelectionTarget(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
): IdTextSegment[] {
  switch (target.kind) {
    case "document":
      return document.children.flatMap((node) => topLevelNodeSegments(document, node));

    case "section":
      return sectionSegments(document, target.section, {
        includeHeading: true,
        includeChildSections: false,
      });

    case "heading":
      return textSegment(
        target.text,
        target.section.target.id,
        targetSourceRange(target),
        target.section.headingTarget.id,
        targetSourceText(target),
        documentTextOffsetForTarget(document, target.section.headingTarget.id),
      );

    case "table":
      return tableCellSegments(document, target.table);

    case "tableRow":
      return tableCellsSegments(document, target.table, target.cells);

    case "tableCell":
      return textSegment(
        target.cell.text,
        sectionTargetIdForNodeTarget(document, target.table.target),
        targetSourceRange(target),
        target.cell.target.id,
        targetSourceText(target),
        documentTextOffsetForTarget(document, target.cell.target.id),
      );

    case "textSpan":
      return textSegment(
        target.span.text,
        sectionTargetIdForNodeTarget(document, target.span.target),
        targetSourceRange(target),
        target.span.target.id,
        targetSourceText(target),
        documentTextOffsetForTarget(document, target.span.target.id),
      );

    case "link":
      return textSegment(
        target.link.text,
        sectionTargetIdForNodeTarget(document, target.link.target),
        targetSourceRange(target),
        target.link.target.id,
        targetSourceText(target),
        documentTextOffsetForTarget(document, target.link.target.id),
      );

    case "list":
      return nodeTargetSegments(
        document,
        target.list.target,
        sectionTargetIdForNodeTarget(document, target.list.target),
      );
  }
}

function topLevelNodeSegments(
  document: EngineDocument,
  node: EngineNode,
): IdTextSegment[] {
  if (node.target === undefined) {
    return [];
  }

  return nodeTargetSegments(document, node.target, sectionTargetIdForTopLevelNode(document, node));
}

function sectionSegments(
  document: EngineDocument,
  section: EngineSection,
  options: {
    includeHeading: boolean;
    includeChildSections: boolean;
  },
): IdTextSegment[] {
  return [
    ...(options.includeHeading
      ? textSegment(
          section.title,
          section.target.id,
          documentQueries.sourceSlice(document, section.headingTarget)?.range,
          section.headingTarget.id,
          documentQueries.sourceSlice(document, section.headingTarget)?.text,
          documentTextOffsetForTarget(document, section.headingTarget.id),
        )
      : []),
    ...sectionBodySegments(document, section, options.includeChildSections),
  ];
}

function sectionBodySegments(
  document: EngineDocument,
  section: EngineSection,
  includeChildSections: boolean,
): IdTextSegment[] {
  return [
    ...section.bodyTargets.flatMap((target) =>
      nodeTargetSegments(document, target, section.target.id),
    ),
    ...(includeChildSections ? childSectionSegments(document, section) : []),
  ];
}

function childSectionSegments(
  document: EngineDocument,
  section: EngineSection,
): IdTextSegment[] {
  return section.childSections.flatMap((target) => {
    const childSection = documentQueries.sections(document, {
      targetId: target.id,
    })[0];

    return childSection === undefined
      ? []
      : sectionSegments(document, childSection, {
          includeHeading: true,
          includeChildSections: true,
        });
  });
}

function nodeTargetSegments(
  document: EngineDocument,
  target: EngineNodeTarget,
  sectionTargetId: string | undefined,
): IdTextSegment[] {
  const table = documentQueries.tables(document, { targetId: target.id })[0];

  if (table !== undefined) {
    return tableCellSegments(document, table);
  }

  const node = documentQueries.nodes(document, { targetId: target.id })[0];

  return node === undefined
    ? textSegment(
        nodeTextByTargetId(document, target.id),
        sectionTargetId,
        documentQueries.sourceSlice(document, target)?.range,
        target.id,
        documentQueries.sourceSlice(document, target)?.text,
        documentTextOffsetForTarget(document, target.id),
      )
    : nodeTextSegments(document, node, sectionTargetId);
}

function nodeTextSegments(
  document: EngineDocument,
  node: EngineNode,
  sectionTargetId: string | undefined,
): IdTextSegment[] {
  if (node.type === "table" && node.target !== undefined) {
    const table = documentQueries.tables(document, {
      targetId: node.target.id,
    })[0];

    return table === undefined ? [] : tableCellSegments(document, table);
  }

  if (node.text !== undefined) {
    return textSegment(
      node.text,
      sectionTargetId,
      nodeSourceRange(node),
      node.target?.id,
      node.source?.text,
      node.target === undefined
        ? undefined
        : documentTextOffsetForTarget(document, node.target.id),
    );
  }

  return (node.children ?? []).flatMap((child) =>
    nodeTextSegments(document, child, sectionTargetId),
  );
}

function tableCellSegments(
  document: EngineDocument,
  table: EngineTable,
): IdTextSegment[] {
  return tableCellsSegments(document, table, table.cells);
}

function tableCellsSegments(
  document: EngineDocument,
  table: EngineTable,
  cells: readonly EngineTableCell[],
): IdTextSegment[] {
  const sectionTargetId = sectionTargetIdForNodeTarget(document, table.target);

  return [...cells]
    .sort(compareCells)
    .flatMap((cell) => {
      const sourceSlice = documentQueries.sourceSlice(document, cell.target);

      return textSegment(
        cell.text,
        sectionTargetId,
        cell.sourceRange,
        cell.target.id,
        sourceSlice?.text,
        documentTextOffsetForTarget(document, cell.target.id),
      );
    });
}

function tableColumnSegments(
  document: EngineDocument,
  source: TableColumnSource,
): IdTextSegment[] {
  return source.section === undefined
    ? allTableColumnSegments(document, source.column)
    : sourceSections(document, source.section).flatMap((section) =>
        section.bodyTargets.flatMap((target) => {
          const table = documentQueries.tables(document, { targetId: target.id })[0];

          return table === undefined
            ? []
            : tableDataColumnSegments(
                document,
                table,
                section.target.id,
                columnIndexForHeader(table, source.column),
              );
        }),
      );
}

function allTableColumnSegments(
  document: EngineDocument,
  column: string,
): IdTextSegment[] {
  return documentQueries.tables(document).flatMap((table) =>
    tableDataColumnSegments(
      document,
      table,
      sectionTargetIdForNodeTarget(document, table.target),
      columnIndexForHeader(table, column),
    ),
  );
}

function sourceSections(
  document: EngineDocument,
  sectionTitle: string,
): readonly EngineSection[] {
  return documentQueries.sections(document, { title: sectionTitle });
}

function tableDataColumnSegments(
  document: EngineDocument,
  table: EngineTable,
  sectionTargetId: string | undefined,
  columnIndex: number | undefined,
): IdTextSegment[] {
  if (columnIndex === undefined) {
    return [];
  }

  return table.cells
    .filter((cell) => !cell.header && cell.columnIndex === columnIndex)
    .sort(compareCells)
    .flatMap((cell) => {
      const sourceSlice = documentQueries.sourceSlice(document, cell.target);

      return textSegment(
        cell.text,
        sectionTargetId,
        cell.sourceRange,
        cell.target.id,
        sourceSlice?.text,
        documentTextOffsetForTarget(document, cell.target.id),
      );
    });
}

function columnIndexForHeader(
  table: EngineTable,
  column: string,
): number | undefined {
  return [...table.cells]
    .filter((cell) => cell.header)
    .sort(compareCells)
    .find((cell) => cell.text === column)?.columnIndex;
}

function sectionTargetIdForTopLevelNode(
  document: EngineDocument,
  node: EngineNode,
): string | undefined {
  if (node.target === undefined) {
    return undefined;
  }

  const headingSection = documentQueries.sections(document, {
    headingTargetId: node.target.id,
  })[0];

  return (
    headingSection?.target.id ??
    sectionTargetIdForNodeTarget(document, node.target)
  );
}

function sectionTargetIdForNodeTarget(
  document: EngineDocument,
  target: EngineNodeTarget,
): string | undefined {
  return documentQueries
    .sections(document)
    .find((section) =>
      section.bodyTargets.some((bodyTarget) => bodyTarget.id === target.id),
    )?.target.id;
}

function textSegment(
  text: string,
  sectionTargetId: string | undefined,
  sourceRange: SourceRange | undefined,
  segmentTargetId: string | undefined,
  sourceText?: string,
  documentTextOffset?: number,
): IdTextSegment[] {
  if (text.length === 0) {
    return [];
  }

  return [
    {
      text,
      ...(segmentTargetId !== undefined ? { segmentTargetId } : {}),
      ...(sectionTargetId !== undefined ? { sectionTargetId } : {}),
      ...(sourceRange !== undefined ? { sourceRange } : {}),
      ...(sourceText !== undefined ? { sourceText } : {}),
      ...(documentTextOffset !== undefined ? { documentTextOffset } : {}),
    },
  ];
}

function nodeSourceRange(node: EngineNode): SourceRange | undefined {
  return node.source?.range ?? node.sourceRange;
}

function targetSourceRange(
  target: DeclarativeSelectionTarget,
): SourceRange | undefined {
  return "source" in target ? target.source?.range : undefined;
}

function targetSourceText(target: DeclarativeSelectionTarget): string | undefined {
  return "source" in target ? target.source?.text : undefined;
}

function documentTextOffsetForTarget(
  document: EngineDocument,
  targetId: string,
): number | undefined {
  let offset = 0;

  for (const node of document.children) {
    const targetOffset = nodeDocumentTextOffset(node, targetId, offset);

    if (targetOffset !== undefined) {
      return targetOffset;
    }

    offset += normalizedNodeText(node).length + 1;
  }

  return undefined;
}

function nodeDocumentTextOffset(
  node: EngineNode,
  targetId: string,
  offset: number,
): number | undefined {
  if (node.target?.id === targetId) {
    return offset;
  }

  let childOffset = offset;

  for (const child of node.children ?? []) {
    const targetOffset = nodeDocumentTextOffset(child, targetId, childOffset);

    if (targetOffset !== undefined) {
      return targetOffset;
    }

    childOffset += normalizedNodeText(child).length;
  }

  return undefined;
}

function normalizedNodeText(node: EngineNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  return (node.children ?? []).map((child) => normalizedNodeText(child)).join("");
}

function sourceRangesForTokens(
  segment: IdTextSegment,
  tokens: readonly ReturnType<typeof extractIdTokens>[number][],
): TokenSourceRange[] {
  const segmentSourceRange = segment.sourceRange;
  const sourceText = segment.sourceText;

  if (segmentSourceRange === undefined || sourceText === undefined) {
    return tokens.map((token) =>
      token.sourceRange === undefined
        ? { coversToken: false }
        : { sourceRange: token.sourceRange, coversToken: false },
    );
  }

  return tokens.map((token) => {
    const sourceRange = sourceRangeForNormalizedText(
      segmentSourceRange,
      sourceText,
      segment.text,
      token.textOffset,
      token.value.length,
    );

    if (sourceRange === undefined) {
      return token.sourceRange === undefined
        ? { coversToken: false }
        : { sourceRange: token.sourceRange, coversToken: false };
    }

    return {
      sourceRange,
      coversToken: true,
    };
  });
}

function sourceRangeOption(
  segment: IdTextSegment,
): { sourceRange: SourceRange } | Record<string, never> {
  return segment.sourceRange === undefined ? {} : { sourceRange: segment.sourceRange };
}

function tokenDocumentTextOffset(
  segment: IdTextSegment,
  tokenTextOffset: number,
): number | undefined {
  return segment.documentTextOffset === undefined
    ? undefined
    : segment.documentTextOffset + tokenTextOffset;
}

function tokenOccurrenceKey(options: {
  comparisonValue: string;
  textOffset: number;
  documentTextOffset: number | undefined;
  segmentTargetId: string | undefined;
  sourceRange: SourceRange | undefined;
  sourceRangeCoversToken: boolean;
}): string | undefined {
  if (options.documentTextOffset !== undefined) {
    return `${options.comparisonValue}:document:${options.documentTextOffset}`;
  }

  if (options.segmentTargetId !== undefined) {
    return `${options.comparisonValue}:segment:${options.segmentTargetId}:${options.textOffset}`;
  }

  if (
    options.sourceRange !== undefined &&
    options.sourceRangeCoversToken === true
  ) {
    return `${options.comparisonValue}:${sourceRangeKey(options.sourceRange)}`;
  }

  return undefined;
}

function sourceRangeKey(sourceRange: SourceRange): string {
  return [
    "source",
    sourceRange.start.line,
    sourceRange.start.column,
    sourceRange.start.offset ?? "",
    sourceRange.end.line,
    sourceRange.end.column,
    sourceRange.end.offset ?? "",
  ].join(":");
}

function segmentTargetIdProperty(
  segment: IdTextSegment,
): { segmentTargetId: string } | Record<string, never> {
  return segment.segmentTargetId === undefined
    ? {}
    : { segmentTargetId: segment.segmentTargetId };
}

function sectionTargetIdProperty(
  segment: IdTextSegment,
): { sectionTargetId: string } | Record<string, never> {
  return segment.sectionTargetId === undefined
    ? {}
    : { sectionTargetId: segment.sectionTargetId };
}

function compareCells(left: EngineTableCell, right: EngineTableCell): number {
  return left.rowIndex - right.rowIndex || left.columnIndex - right.columnIndex;
}
