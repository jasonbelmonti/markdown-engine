import type { MarkdownDiagnostic, SourceRange } from "./diagnostics.js";
import type { EngineDocument, EngineNode } from "./document.js";

export type RichIrVersion = "1.0.0-draft";

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

export interface RichEngineNode extends Omit<EngineNode, "children"> {
  target: EngineTarget;
  source?: EngineSourceSlice;
  children?: RichEngineNode[];
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

export interface RichIrCompatibilityGate {
  mode: "rich-ir-1.0-draft" | "legacy-0.1";
  reason?: string;
}

export interface RichIrDiagnostic extends MarkdownDiagnostic {
  target?: EngineAnnotationTarget;
}

export interface RichIrSerializeOptions {
  pretty?: boolean;
  compatibility?: RichIrCompatibilityGate;
}

export interface RichEngineDocument
  extends Omit<EngineDocument, "version" | "children"> {
  version: RichIrVersion;
  target: EngineTarget;
  children: RichEngineNode[];
  sections: readonly EngineSection[];
  textSpans: readonly EngineTextSpan[];
  tables: readonly EngineTable[];
  lists: readonly EngineList[];
  links: readonly EngineLink[];
  annotations: readonly EngineAnnotation[];
  compatibility: RichIrCompatibilityGate;
}

export interface RichIrNodeQuery {
  type?: string;
  targetId?: string;
}

export interface RichIrQueryHelpers {
  nodes(
    document: RichEngineDocument,
    query?: RichIrNodeQuery,
  ): readonly RichEngineNode[];
  sections(document: RichEngineDocument): readonly EngineSection[];
  textSpans(document: RichEngineDocument): readonly EngineTextSpan[];
  tables(document: RichEngineDocument): readonly EngineTable[];
  lists(document: RichEngineDocument): readonly EngineList[];
  links(document: RichEngineDocument): readonly EngineLink[];
  sourceSlice(
    document: RichEngineDocument,
    target: EngineTarget,
  ): EngineSourceSlice | undefined;
}

export interface AnnotationValidationResult {
  valid: boolean;
  annotations: readonly EngineAnnotation[];
  diagnostics: readonly RichIrDiagnostic[];
}

export type ValidateRichIrAnnotationsFunction = (
  document: RichEngineDocument,
  annotations: readonly EngineAnnotation[],
) => AnnotationValidationResult;

export type RichIrSerializableResult =
  | RichEngineDocument
  | AnnotationValidationResult;
