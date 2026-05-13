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
  return extractIdTokensForSegments(tableColumnSegments(document, source), options);
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
        textSegmentFromSource(
          target.text,
          target.section.headingTarget.id,
          target.source?.range,
          target.source?.text,
          documentTextOffsetForTarget(document, target.section.headingTarget.id),
        ),
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
        textSegmentFromSource(
          target.text,
          target.span.target.id,
          target.source?.range,
          target.source?.text,
          documentTextOffsetForTarget(document, target.span.target.id),
        ),
      ];

    case "link":
      return [
        textSegmentFromSource(
          target.text,
          target.link.target.id,
          target.source?.range,
          target.source?.text,
          documentTextOffsetForTarget(document, target.link.target.id),
        ),
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
      ? [
          textSegmentFromSource(
            section.title,
            section.headingTarget.id,
            documentQueries.sourceSlice(document, section.headingTarget)?.range,
            documentQueries.sourceSlice(document, section.headingTarget)?.text,
            documentTextOffsetForTarget(document, section.headingTarget.id),
            section,
          ),
        ]
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
      textSegmentFromSource(
        node.text,
        node.target?.id ?? fallbackScope,
        node.source?.range ?? node.sourceRange,
        node.source?.text,
        node.target === undefined
          ? undefined
          : documentTextOffsetForTarget(document, node.target.id),
        section,
      ),
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
  return textSegment(
    cell.text,
    cell.target.id,
    cell.sourceRange,
    section,
    tableCellDefinitionColumnKey(table, cell),
    tableCellDefinitionColumnHeader(table, cell),
    tableCellDefinitionColumnSignature(table, cell),
    tableCellDefinitionSourceRowKey(table, cell),
    tableCellDefinitionRowSignature(table, cell),
    tableCellDefinitionTableHeaderCount(table, cell),
    table.target.id,
  );
}

function tableColumnSegments(
  document: EngineDocument,
  source: TableColumnIdSource,
): IdTextSegment[] {
  if (source.section !== undefined) {
    return documentQueries
      .sections(document, { title: source.section })
      .flatMap((section) => sectionTableColumnSegments(document, section, source.column));
  }

  return documentQueries
    .tables(document)
    .flatMap((table) =>
      tableDataColumnSegments(
        table,
        source.column,
        sectionForTable(document, table),
      ),
    );
}

function sectionTableColumnSegments(
  document: EngineDocument,
  section: EngineSection,
  column: string,
): IdTextSegment[] {
  return [
    ...directSectionTableColumnSegments(document, section, column),
    ...section.childSections.flatMap((childTarget) => {
      const childSection = documentQueries.sections(document, {
        targetId: childTarget.id,
      })[0];

      return childSection === undefined
        ? []
        : sectionTableColumnSegments(document, childSection, column);
    }),
  ];
}

function directSectionTableColumnSegments(
  document: EngineDocument,
  section: EngineSection,
  column: string,
): IdTextSegment[] {
  return section.bodyTargets.flatMap((bodyTarget) =>
    nodeTableColumnSegments(
      document,
      documentQueries.nodes(document, { targetId: bodyTarget.id })[0],
      column,
      section,
    ),
  );
}

function nodeTableColumnSegments(
  document: EngineDocument,
  node: EngineNode | undefined,
  column: string,
  section: EngineSection,
): IdTextSegment[] {
  if (node === undefined) {
    return [];
  }

  if (node.type === "table" && node.target !== undefined) {
    const table = documentQueries.tables(document, { targetId: node.target.id })[0];

    return table === undefined
      ? []
      : tableDataColumnSegments(table, column, section);
  }

  return (node.children ?? []).flatMap((child) =>
    nodeTableColumnSegments(document, child, column, section),
  );
}

function tableDataColumnSegments(
  table: EngineTable,
  column: string,
  section?: EngineSection,
): IdTextSegment[] {
  const columnIndex = columnIndexForHeader(table, column);

  if (columnIndex === undefined) {
    return [];
  }

  return table.cells
    .filter((cell) => !cell.header && cell.columnIndex === columnIndex)
    .sort(compareCells)
    .map((cell) => tableCellSegment(table, cell, section));
}

function columnIndexForHeader(
  table: EngineTable,
  column: string,
): number | undefined {
  return table.cells
    .filter((cell) => cell.header)
    .sort(compareCells)
    .find((cell) => cell.text === column)?.columnIndex;
}

function textSegment(
  text: string,
  occurrenceScope: string,
  sourceRange: SourceRange | undefined,
  section?: EngineSection,
  definitionColumnKey?: string,
  definitionColumnHeader?: string,
  definitionColumnSignature?: string,
  definitionSourceRowKey?: string,
  definitionRowSignature?: string,
  definitionTableHeaderCount?: number,
  definitionTableKey?: string,
  documentTextOffset?: number,
  sourceText?: string,
): IdTextSegment {
  return {
    text,
    occurrenceScope,
    ...(documentTextOffset !== undefined ? { documentTextOffset } : {}),
    ...(definitionColumnKey !== undefined ? { definitionColumnKey } : {}),
    ...(definitionColumnHeader !== undefined ? { definitionColumnHeader } : {}),
    ...(definitionColumnSignature !== undefined
      ? { definitionColumnSignature }
      : {}),
    ...(definitionSourceRowKey !== undefined
      ? { definitionSourceRowKey }
      : {}),
    ...(definitionRowSignature !== undefined ? { definitionRowSignature } : {}),
    ...(definitionTableHeaderCount !== undefined
      ? { definitionTableHeaderCount }
      : {}),
    ...(definitionTableKey !== undefined ? { definitionTableKey } : {}),
    ...(section !== undefined
      ? { sectionTitle: section.title, sectionTargetId: section.target.id }
      : {}),
    ...(sourceRange !== undefined ? { sourceRange } : {}),
    ...(sourceText !== undefined ? { sourceText } : {}),
  };
}

function textSegmentFromSource(
  text: string,
  occurrenceScope: string,
  sourceRange: SourceRange | undefined,
  sourceText: string | undefined,
  documentTextOffset: number | undefined,
  section?: EngineSection,
): IdTextSegment {
  return textSegment(
    text,
    occurrenceScope,
    sourceRange,
    section,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    documentTextOffset,
    sourceText,
  );
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
