import type { MarkdownDiagnostic, SourceRange } from "./diagnostics.js";

export type EngineDocumentVersion = "0.0.0" | "1.0.0-draft";

export type EngineTargetKind = "node" | "source";

export interface EngineTarget {
  kind: EngineTargetKind;
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
  target?: EngineTarget;
  sourceRange?: SourceRange;
  source?: EngineSourceSlice;
  children?: EngineNode[];
}

export interface EngineSection {
  target: EngineTarget;
  headingTarget: EngineTarget;
  depth: number;
  title: string;
  bodyTargets: readonly EngineTarget[];
  childSections: readonly EngineTarget[];
}

export interface EngineTextSpan {
  target: EngineTarget;
  text: string;
  sourceRange?: SourceRange;
}

export interface EngineTableCell {
  target: EngineTarget;
  text: string;
  rowIndex: number;
  columnIndex: number;
  header: boolean;
  sourceRange?: SourceRange;
}

export interface EngineTable {
  target: EngineTarget;
  cells: readonly EngineTableCell[];
}

export interface EngineListItem {
  target: EngineTarget;
  itemIndex: number;
  depth: number;
  checked?: boolean;
  sourceRange?: SourceRange;
}

export interface EngineList {
  target: EngineTarget;
  ordered: boolean;
  start?: number;
  items: readonly EngineListItem[];
}

export interface EngineLink {
  target: EngineTarget;
  url: string;
  text: string;
  title?: string;
  sourceRange?: SourceRange;
}

export type EngineAnnotationTarget =
  | { kind: "node"; target: EngineTarget }
  | { kind: "source"; range: SourceRange };

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
  target?: EngineAnnotationTarget;
}

export interface EngineDocument {
  kind: "markdown-document";
  version: EngineDocumentVersion;
  path?: string;
  frontmatter?: unknown;
  target?: EngineTarget;
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

export interface EngineDocumentQueries {
  nodes(document: EngineDocument, query?: EngineNodeQuery): readonly EngineNode[];
  sections(document: EngineDocument): readonly EngineSection[];
  textSpans(document: EngineDocument): readonly EngineTextSpan[];
  tables(document: EngineDocument): readonly EngineTable[];
  lists(document: EngineDocument): readonly EngineList[];
  links(document: EngineDocument): readonly EngineLink[];
  sourceSlice(
    document: EngineDocument,
    target: EngineTarget,
  ): EngineSourceSlice | undefined;
}

export interface AnnotationValidationResult {
  valid: boolean;
  annotations: readonly EngineAnnotation[];
  diagnostics: readonly EngineTargetDiagnostic[];
}

export type ValidateAnnotationsFunction = (
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
) => AnnotationValidationResult;

export type SerializableEngineResult =
  | EngineDocument
  | AnnotationValidationResult;
