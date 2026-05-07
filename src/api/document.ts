import type { MarkdownDiagnostic, SourceRange } from "./diagnostics.js";

export type EngineDocumentVersion = "0.0.0" | "1.0.0";

export type EngineNodeTargetKind = "node";

export interface EngineNodeTarget {
  kind: EngineNodeTargetKind;
  id: string;
  path?: readonly number[];
  nodeType?: string;
  sourceRange?: SourceRange;
}

export interface EngineSourceSlice {
  range: SourceRange;
  text: string;
}

export interface EngineNode {
  type: string;
  text?: string;
  attributes?: Record<string, unknown>;
  target?: EngineNodeTarget;
  sourceRange?: SourceRange;
  source?: EngineSourceSlice;
  children?: EngineNode[];
}

export interface EngineSection {
  target: EngineNodeTarget;
  headingTarget: EngineNodeTarget;
  parentSection?: EngineNodeTarget;
  depth: number;
  title: string;
  bodyTargets: readonly EngineNodeTarget[];
  childSections: readonly EngineNodeTarget[];
}

export interface EngineTextSpan {
  target: EngineNodeTarget;
  text: string;
  sourceRange?: SourceRange;
}

export interface EngineTableCell {
  target: EngineNodeTarget;
  text: string;
  rowIndex: number;
  columnIndex: number;
  header: boolean;
  sourceRange?: SourceRange;
}

export interface EngineTable {
  target: EngineNodeTarget;
  cells: readonly EngineTableCell[];
}

export interface EngineListItem {
  target: EngineNodeTarget;
  itemIndex: number;
  depth: number;
  checked?: boolean;
  sourceRange?: SourceRange;
}

export interface EngineList {
  target: EngineNodeTarget;
  ordered: boolean;
  start?: number;
  items: readonly EngineListItem[];
}

export interface EngineLink {
  target: EngineNodeTarget;
  url: string;
  text: string;
  title?: string;
  sourceRange?: SourceRange;
}

export type EngineAnnotationTarget =
  | { kind: "node"; nodeTarget: EngineNodeTarget }
  | { kind: "source"; sourceRange: SourceRange };

export interface EngineAnnotation<TPayload = unknown> {
  id: string;
  target: EngineAnnotationTarget;
  payload: TPayload;
}

export interface EngineCompatibilityGate {
  mode: "default" | "legacy-0.1";
  reason?: string;
}

export interface EngineTargetDiagnostic extends MarkdownDiagnostic {
  target?: unknown;
}

export interface EngineDocument {
  kind: "markdown-document";
  version: EngineDocumentVersion;
  path?: string;
  frontmatter?: unknown;
  target?: EngineNodeTarget;
  children: EngineNode[];
  sourceRange?: SourceRange;
  sections?: readonly EngineSection[];
  textSpans?: readonly EngineTextSpan[];
  tables?: readonly EngineTable[];
  lists?: readonly EngineList[];
  links?: readonly EngineLink[];
  annotations?: readonly EngineAnnotation[];
  compatibility?: EngineCompatibilityGate;
}

export interface EngineNodeQuery {
  type?: string;
  targetId?: string;
}

export interface EngineSectionQuery {
  targetId?: string;
  headingTargetId?: string;
  parentSectionTargetId?: string;
  title?: string;
  depth?: number;
}

export interface EngineTextSpanQuery {
  targetId?: string;
  nodeType?: string;
  text?: string;
  textIncludes?: string;
}

export interface EngineTableQuery {
  targetId?: string;
}

export interface EngineListQuery {
  targetId?: string;
  depth?: number;
  ordered?: boolean;
}

export interface EngineLinkQuery {
  targetId?: string;
  url?: string;
  text?: string;
}

export interface EngineDocumentQueries {
  nodes(document: EngineDocument, query?: EngineNodeQuery): readonly EngineNode[];
  sections(
    document: EngineDocument,
    query?: EngineSectionQuery,
  ): readonly EngineSection[];
  textSpans(
    document: EngineDocument,
    query?: EngineTextSpanQuery,
  ): readonly EngineTextSpan[];
  tables(document: EngineDocument, query?: EngineTableQuery): readonly EngineTable[];
  lists(document: EngineDocument, query?: EngineListQuery): readonly EngineList[];
  links(document: EngineDocument, query?: EngineLinkQuery): readonly EngineLink[];
  sourceSlice(
    document: EngineDocument,
    target: EngineNodeTarget,
  ): EngineSourceSlice | undefined;
}

export interface AnnotationValidationResult {
  valid: boolean;
  annotations: readonly EngineAnnotation[];
  diagnostics: readonly EngineTargetDiagnostic[];
}

export type SerializableEngineResult =
  | EngineDocument
  | AnnotationValidationResult;
