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
import { tableColumnTargets } from "../selectors/table-targets.js";
import { documentTextOffsetForTarget } from "./document-text-offsets.js";
import { extractIdTokens, type IdTokenOptions } from "./id-tokens.js";
import { sourceRangeForNormalizedText } from "./normalized-source-ranges.js";

export interface TargetIdToken {
  value: string;
  comparisonValue: string;
  textOffset: number;
  occurrenceKey: string;
  definitionColumnKey?: string;
  definitionColumnHeader?: string;
  definitionColumnSignature?: string;
  definitionSourceRowKey?: string;
  definitionRowSignature?: string;
  definitionTableHeaderCount?: number;
  definitionTableKey?: string;
  sectionTitle?: string;
  sectionTargetId?: string;
  sourceRange?: SourceRange;
}

export interface TableColumnIdSource {
  section?: string;
  column: string;
}

export type TableColumnIdTokenResolution =
  | {
      status: "resolved";
      source: TableColumnIdSource;
      tokens: readonly TargetIdToken[];
    }
  | {
      status: "missingSection";
      source: TableColumnIdSource;
      tokens: readonly [];
    }
  | {
      status: "missingColumn";
      source: TableColumnIdSource;
      tokens: readonly [];
    };

interface IdTextSegment {
  text: string;
  occurrenceScope: string;
  documentTextOffset?: number;
  definitionColumnKey?: string;
  definitionColumnHeader?: string;
  definitionColumnSignature?: string;
  definitionSourceRowKey?: string;
  definitionRowSignature?: string;
  definitionTableHeaderCount?: number;
  definitionTableKey?: string;
  sectionTitle?: string;
  sectionTargetId?: string;
  sourceRange?: SourceRange;
  sourceText?: string;
}

interface IdTextSegmentInput {
  text: string;
  occurrenceScope: string;
  documentTextOffset?: number | undefined;
  definitionColumnKey?: string | undefined;
  definitionColumnHeader?: string | undefined;
  definitionColumnSignature?: string | undefined;
  definitionSourceRowKey?: string | undefined;
  definitionRowSignature?: string | undefined;
  definitionTableHeaderCount?: number | undefined;
  definitionTableKey?: string | undefined;
  section?: EngineSection | undefined;
  sourceRange?: SourceRange | undefined;
  sourceText?: string | undefined;
}

interface SourceBackedTextSegmentInput {
  document: EngineDocument;
  text: string;
  occurrenceScope: string;
  sourceTargetId?: string | undefined;
  section?: EngineSection | undefined;
  sourceRange?: SourceRange | undefined;
  sourceText?: string | undefined;
}

export function extractTargetIdTokens(
  document: EngineDocument,
  target: DeclarativeSelectionTarget,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractIdTokensForSegments(
    idTextSegmentsForSelectionTarget(document, target),
    options,
  );
}

export function extractSectionBodyIdTokens(
  document: EngineDocument,
  section: EngineSection,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractIdTokensForSegments(
    sectionBodySegments(document, section, { includeChildSections: true }),
    options,
  );
}

export function extractSectionIdTokens(
  document: EngineDocument,
  section: EngineSection,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  return extractIdTokensForSegments(
    sectionSegments(document, section, {
      includeHeading: true,
      includeChildSections: true,
    }),
    options,
  );
}

export function extractTableColumnIdTokens(
  document: EngineDocument,
  source: TableColumnIdSource,
  options: IdTokenOptions = {},
): TargetIdToken[] {
  const resolution = resolveTableColumnIdTokens(document, source, options);

  return [...resolution.tokens];
}

export function resolveTableColumnIdTokens(
  document: EngineDocument,
  source: TableColumnIdSource,
  options: IdTokenOptions = {},
): TableColumnIdTokenResolution {
  const resolution = tableColumnTargets(document, source);

  if (resolution.status !== "resolved") {
    return {
      status: resolution.status,
      source,
      tokens: [],
    };
  }

  return {
    status: "resolved",
    source,
    tokens: extractIdTokensForSegments(
      resolution.targets.flatMap((target) =>
        idTextSegmentsForSelectionTarget(document, target),
      ),
      options,
    ),
  };
}

function extractIdTokensForSegments(
  segments: readonly IdTextSegment[],
  options: IdTokenOptions,
): TargetIdToken[] {
  return segments.flatMap((segment) =>
    extractIdTokens(segment.text, options).map((token) => ({
      value: token.value,
      comparisonValue: token.comparisonValue,
      textOffset: token.textOffset,
      occurrenceKey: idOccurrenceKey(segment, token.comparisonValue, token.textOffset),
      ...definitionColumnProperties(segment),
      ...sectionTitleProperty(segment),
      ...sectionTargetIdProperty(segment),
      ...tokenSourceRangeProperty(segment, token.textOffset, token.value.length),
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
      return sectionSegments(document, target.section, {
        includeHeading: true,
        includeChildSections: false,
      });

    case "heading":
      return [
        sourceBackedTextSegment({
          document,
          text: target.text,
          occurrenceScope: target.section.headingTarget.id,
          sourceTargetId: target.section.headingTarget.id,
          sourceRange: target.source?.range,
          sourceText: target.source?.text,
        }),
      ];

    case "table":
      return tableCellSegments(target.table, sectionForTable(document, target.table));

    case "tableRow":
      return tableCellsSegments(
        target.table,
        target.cells,
        sectionForTable(document, target.table),
      );

    case "tableCell":
      return [
        tableCellSegment(
          target.table,
          target.cell,
          sectionForTable(document, target.table),
        ),
      ];

    case "textSpan":
      return [
        sourceBackedTextSegment({
          document,
          text: target.text,
          occurrenceScope: target.span.target.id,
          sourceTargetId: target.span.target.id,
          sourceRange: target.source?.range,
          sourceText: target.source?.text,
        }),
      ];

    case "link":
      return [
        sourceBackedTextSegment({
          document,
          text: target.text,
          occurrenceScope: target.link.target.id,
          sourceTargetId: target.link.target.id,
          sourceRange: target.source?.range,
          sourceText: target.source?.text,
        }),
      ];

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

  return nodeTargetSegments(
    document,
    node.target,
    sectionForNodeTarget(document, node.target),
  );
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
      ? [sectionHeadingSegment(document, section)]
      : []),
    ...sectionBodySegments(document, section, {
      includeChildSections: options.includeChildSections,
    }),
  ];
}

function sectionBodySegments(
  document: EngineDocument,
  section: EngineSection,
  options: { includeChildSections: boolean },
): IdTextSegment[] {
  return [
    ...section.bodyTargets.flatMap((bodyTarget) =>
      nodeTargetSegments(document, bodyTarget, section),
    ),
    ...(options.includeChildSections ? childSectionSegments(document, section) : []),
  ];
}

function childSectionSegments(
  document: EngineDocument,
  section: EngineSection,
): IdTextSegment[] {
  return section.childSections.flatMap((childTarget) => {
    const childSection = documentQueries.sections(document, {
      targetId: childTarget.id,
    })[0];

    return childSection === undefined
      ? []
      : sectionSegments(document, childSection, {
          includeHeading: false,
          includeChildSections: true,
        });
  });
}

function nodeTargetSegments(
  document: EngineDocument,
  target: EngineNodeTarget,
  section?: EngineSection,
): IdTextSegment[] {
  const table = documentQueries.tables(document, { targetId: target.id })[0];

  if (table !== undefined) {
    return tableCellSegments(table, section);
  }

  const node = documentQueries.nodes(document, { targetId: target.id })[0];

  if (node !== undefined) {
    return nodeTextSegments(document, node, `target:${target.id}`, section);
  }

  return [];
}

function nodeTextSegments(
  document: EngineDocument,
  node: EngineNode,
  fallbackScope: string,
  section?: EngineSection,
): IdTextSegment[] {
  if (node.type === "table" && node.target !== undefined) {
    const table = documentQueries.tables(document, { targetId: node.target.id })[0];

    return table === undefined ? [] : tableCellSegments(table, section);
  }

  if (node.text !== undefined) {
    return [
      sourceBackedTextSegment({
        document,
        text: node.text,
        occurrenceScope: node.target?.id ?? fallbackScope,
        sourceTargetId: node.target?.id,
        sourceRange: node.source?.range ?? node.sourceRange,
        sourceText: node.source?.text,
        section,
      }),
    ];
  }

  return (node.children ?? []).flatMap((child, childIndex) =>
    nodeTextSegments(
      document,
      child,
      `${fallbackScope}/child:${childIndex}`,
      section,
    ),
  );
}

function tableCellSegments(
  table: EngineTable,
  section?: EngineSection,
): IdTextSegment[] {
  return tableCellsSegments(table, table.cells, section);
}

function tableCellsSegments(
  table: EngineTable,
  cells: readonly EngineTableCell[],
  section?: EngineSection,
): IdTextSegment[] {
  return [...cells]
    .sort(compareCells)
    .map((cell) => tableCellSegment(table, cell, section));
}

function tableCellSegment(
  table: EngineTable,
  cell: EngineTableCell,
  section?: EngineSection,
): IdTextSegment {
  return textSegment({
    text: cell.text,
    occurrenceScope: cell.target.id,
    sourceRange: cell.sourceRange,
    section,
    definitionColumnKey: tableCellDefinitionColumnKey(table, cell),
    definitionColumnHeader: tableCellDefinitionColumnHeader(table, cell),
    definitionColumnSignature: tableCellDefinitionColumnSignature(table, cell),
    definitionSourceRowKey: tableCellDefinitionSourceRowKey(table, cell),
    definitionRowSignature: tableCellDefinitionRowSignature(table, cell),
    definitionTableHeaderCount: tableCellDefinitionTableHeaderCount(table, cell),
    definitionTableKey: table.target.id,
  });
}

function sectionHeadingSegment(
  document: EngineDocument,
  section: EngineSection,
): IdTextSegment {
  const headingSource = documentQueries.sourceSlice(document, section.headingTarget);

  return sourceBackedTextSegment({
    document,
    text: section.title,
    occurrenceScope: section.headingTarget.id,
    sourceTargetId: section.headingTarget.id,
    sourceRange: headingSource?.range,
    sourceText: headingSource?.text,
    section,
  });
}

function sourceBackedTextSegment(
  input: SourceBackedTextSegmentInput,
): IdTextSegment {
  return textSegment({
    text: input.text,
    occurrenceScope: input.occurrenceScope,
    sourceRange: input.sourceRange,
    sourceText: input.sourceText,
    documentTextOffset:
      input.sourceTargetId === undefined
        ? undefined
        : documentTextOffsetForTarget(input.document, input.sourceTargetId),
    section: input.section,
  });
}

function textSegment(input: IdTextSegmentInput): IdTextSegment {
  return {
    text: input.text,
    occurrenceScope: input.occurrenceScope,
    ...(input.documentTextOffset !== undefined
      ? { documentTextOffset: input.documentTextOffset }
      : {}),
    ...(input.definitionColumnKey !== undefined
      ? { definitionColumnKey: input.definitionColumnKey }
      : {}),
    ...(input.definitionColumnHeader !== undefined
      ? { definitionColumnHeader: input.definitionColumnHeader }
      : {}),
    ...(input.definitionColumnSignature !== undefined
      ? { definitionColumnSignature: input.definitionColumnSignature }
      : {}),
    ...(input.definitionSourceRowKey !== undefined
      ? { definitionSourceRowKey: input.definitionSourceRowKey }
      : {}),
    ...(input.definitionRowSignature !== undefined
      ? { definitionRowSignature: input.definitionRowSignature }
      : {}),
    ...(input.definitionTableHeaderCount !== undefined
      ? { definitionTableHeaderCount: input.definitionTableHeaderCount }
      : {}),
    ...(input.definitionTableKey !== undefined
      ? { definitionTableKey: input.definitionTableKey }
      : {}),
    ...(input.section !== undefined
      ? {
          sectionTitle: input.section.title,
          sectionTargetId: input.section.target.id,
        }
      : {}),
    ...(input.sourceRange !== undefined ? { sourceRange: input.sourceRange } : {}),
    ...(input.sourceText !== undefined ? { sourceText: input.sourceText } : {}),
  };
}

function idOccurrenceKey(
  segment: IdTextSegment,
  comparisonValue: string,
  textOffset: number,
): string {
  if (segment.documentTextOffset !== undefined) {
    return `${comparisonValue}:document:${segment.documentTextOffset + textOffset}`;
  }

  return `${comparisonValue}:${segment.occurrenceScope}:${textOffset}`;
}

function tokenSourceRangeProperty(
  segment: IdTextSegment,
  textOffset: number,
  textLength: number,
): { sourceRange: SourceRange } | Record<string, never> {
  if (segment.sourceRange === undefined) {
    return {};
  }

  if (segment.sourceText === undefined) {
    return { sourceRange: segment.sourceRange };
  }

  const sourceRange = sourceRangeForNormalizedText(
    segment.sourceRange,
    segment.sourceText,
    segment.text,
    textOffset,
    textLength,
  );

  return sourceRange === undefined
    ? { sourceRange: segment.sourceRange }
    : { sourceRange };
}

function definitionColumnProperties(
  segment: IdTextSegment,
):
  | {
      definitionColumnKey: string;
      definitionColumnHeader?: string;
      definitionColumnSignature?: string;
      definitionSourceRowKey?: string;
      definitionRowSignature?: string;
      definitionTableHeaderCount?: number;
      definitionTableKey?: string;
    }
  | Record<string, never> {
  if (segment.definitionColumnKey === undefined) {
    return {};
  }

  return {
    definitionColumnKey: segment.definitionColumnKey,
    ...(segment.definitionColumnHeader !== undefined
      ? { definitionColumnHeader: segment.definitionColumnHeader }
      : {}),
    ...(segment.definitionColumnSignature !== undefined
      ? { definitionColumnSignature: segment.definitionColumnSignature }
      : {}),
    ...(segment.definitionSourceRowKey !== undefined
      ? { definitionSourceRowKey: segment.definitionSourceRowKey }
      : {}),
    ...(segment.definitionRowSignature !== undefined
      ? { definitionRowSignature: segment.definitionRowSignature }
      : {}),
    ...(segment.definitionTableHeaderCount !== undefined
      ? { definitionTableHeaderCount: segment.definitionTableHeaderCount }
      : {}),
    ...(segment.definitionTableKey !== undefined
      ? { definitionTableKey: segment.definitionTableKey }
      : {}),
  };
}

function sectionTitleProperty(
  segment: IdTextSegment,
): { sectionTitle: string } | Record<string, never> {
  return segment.sectionTitle === undefined
    ? {}
    : { sectionTitle: segment.sectionTitle };
}

function sectionTargetIdProperty(
  segment: IdTextSegment,
): { sectionTargetId: string } | Record<string, never> {
  return segment.sectionTargetId === undefined
    ? {}
    : { sectionTargetId: segment.sectionTargetId };
}

function tableCellDefinitionColumnKey(
  table: EngineTable,
  cell: EngineTableCell,
): string | undefined {
  const header = tableHeaderForColumn(table, cell.columnIndex);

  if (header === undefined) {
    return undefined;
  }

  return `${table.target.id}:column:${cell.columnIndex}`;
}

function tableCellDefinitionColumnHeader(
  table: EngineTable,
  cell: EngineTableCell,
): string | undefined {
  return tableHeaderForColumn(table, cell.columnIndex)?.text;
}

function tableCellDefinitionColumnSignature(
  table: EngineTable,
  cell: EngineTableCell,
): string | undefined {
  const header = tableHeaderForColumn(table, cell.columnIndex);

  if (header === undefined) {
    return undefined;
  }

  return `column:${cell.columnIndex}:headers:${tableHeaderSignature(table)}`;
}

function tableCellDefinitionSourceRowKey(
  table: EngineTable,
  cell: EngineTableCell,
): string | undefined {
  const header = tableHeaderForColumn(table, cell.columnIndex);

  if (header === undefined) {
    return undefined;
  }

  return `table:${table.target.id}:row:${cell.rowIndex}`;
}

function tableCellDefinitionRowSignature(
  table: EngineTable,
  cell: EngineTableCell,
): string | undefined {
  const header = tableHeaderForColumn(table, cell.columnIndex);

  if (header === undefined) {
    return undefined;
  }

  return `headers:${tableHeaderSignature(table)}:row:${tableRowSignature(
    table,
    cell.rowIndex,
  )}`;
}

function tableCellDefinitionTableHeaderCount(
  table: EngineTable,
  cell: EngineTableCell,
): number | undefined {
  return tableHeaderForColumn(table, cell.columnIndex) === undefined
    ? undefined
    : tableHeaderCount(table);
}

function tableHeaderForColumn(
  table: EngineTable,
  columnIndex: number,
): EngineTableCell | undefined {
  return table.cells
    .filter((candidate) => candidate.header && candidate.columnIndex === columnIndex)
    .sort(compareCells)[0];
}

function tableHeaderCount(table: EngineTable): number {
  return table.cells.filter((cell) => cell.header).length;
}

function tableHeaderSignature(table: EngineTable): string {
  return table.cells
    .filter((cell) => cell.header)
    .sort(compareCells)
    .map((cell) => `${cell.columnIndex}:${cell.text}`)
    .join("|");
}

function tableRowSignature(table: EngineTable, rowIndex: number): string {
  return table.cells
    .filter((cell) => cell.rowIndex === rowIndex)
    .sort(compareCells)
    .map((cell) => `${cell.columnIndex}:${cell.text}`)
    .join("|");
}

function sectionForTable(
  document: EngineDocument,
  table: EngineTable,
): EngineSection | undefined {
  return sectionForNodeTarget(document, table.target);
}

function sectionForNodeTarget(
  document: EngineDocument,
  nodeTarget: EngineNodeTarget,
): EngineSection | undefined {
  return documentQueries
    .sections(document)
    .find((section) => sectionOwnsNodeTarget(document, section, nodeTarget.id));
}

function sectionOwnsNodeTarget(
  document: EngineDocument,
  section: EngineSection,
  targetId: string,
): boolean {
  return section.bodyTargets.some((bodyTarget) => {
    if (bodyTarget.id === targetId) {
      return true;
    }

    return nodeContainsTarget(
      documentQueries.nodes(document, { targetId: bodyTarget.id })[0],
      targetId,
    );
  });
}

function nodeContainsTarget(
  node: EngineNode | undefined,
  targetId: string,
): boolean {
  if (node?.target?.id === targetId) {
    return true;
  }

  return (node?.children ?? []).some((child) => nodeContainsTarget(child, targetId));
}

function compareCells(left: EngineTableCell, right: EngineTableCell): number {
  return left.rowIndex - right.rowIndex || left.columnIndex - right.columnIndex;
}
