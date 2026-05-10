import type { SourceRange } from "./diagnostics.js";
import type {
  EngineAnnotation,
  EngineAnnotationTarget,
  EngineDocument,
  EngineNodeTarget,
  EngineTargetDiagnostic,
} from "./document.js";
import { documentQueries } from "./document-queries.js";
import {
  annotationNodeTarget,
  annotationSourceRange,
  annotationTargetKind,
  isAnnotationTargetCandidate,
  type AnnotationTargetCandidate,
} from "./annotation-target-candidate.js";
import {
  cloneSourceRange,
  cloneSourceRangeCandidate,
  sourceRangeContains,
  sourceRangeIsInvalid,
} from "./annotation-source-range.js";
import { cloneEngineTargetCandidate } from "./annotation-target-cloning.js";
import {
  compareSortableDiagnostics,
  sortableDiagnostic,
  type SortableTargetDiagnostic,
} from "./annotation-target-diagnostics.js";

export { cloneAnnotationTarget } from "./annotation-target-cloning.js";

export function annotationTargetDiagnostics(
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
): EngineTargetDiagnostic[] {
  const validTargetIds = documentTargetIds(document);
  const documentSourceRange =
    document.sourceRange !== undefined
      ? cloneSourceRangeCandidate(document.sourceRange)
      : undefined;

  return annotations
    .flatMap((annotation, order) =>
      diagnosticsForAnnotation(
        annotation.target,
        validTargetIds,
        documentSourceRange,
        order,
      ),
    )
    .sort(compareSortableDiagnostics)
    .map(({ diagnostic }) => diagnostic);
}

function documentTargetIds(document: EngineDocument): Set<string> {
  return new Set([
    ...(document.target !== undefined ? [document.target.id] : []),
    ...(document.sections ?? []).map((section) => section.target.id),
    ...documentQueries
      .nodes(document)
      .map((node) => node.target?.id)
      .filter((id): id is string => id !== undefined),
  ]);
}

function diagnosticsForAnnotation(
  target: EngineAnnotationTarget,
  validTargetIds: ReadonlySet<string>,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  if (!isAnnotationTargetCandidate(target)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidKind",
          message: "Annotation target kind must be 'node' or 'source'.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  const kind = annotationTargetKind(target);

  if (kind === "node") {
    return nodeTargetDiagnostics(target, validTargetIds, documentSourceRange, order);
  }

  if (kind === "source") {
    return sourceTargetDiagnostics(target, documentSourceRange, order);
  }

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.invalidKind",
        message: "Annotation target kind must be 'node' or 'source'.",
        severity: "error",
        target,
      },
      order,
    ),
  ];
}

function nodeTargetDiagnostics(
  target: AnnotationTargetCandidate,
  validTargetIds: ReadonlySet<string>,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  const nodeTarget = cloneEngineTargetCandidate(annotationNodeTarget(target));

  if (nodeTarget === undefined) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidKind",
          message: "Annotation node target must reference an engine node target.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  const sourceRangeDiagnostic = nodeTargetSourceRangeDiagnostic(
    target,
    nodeTarget,
    documentSourceRange,
    order,
  );

  if (sourceRangeDiagnostic !== undefined) {
    return [sourceRangeDiagnostic];
  }

  if (validTargetIds.has(nodeTarget.id)) {
    return [];
  }

  return [
    sortableDiagnostic(
      {
        code: "annotation.target.unknown",
        message: `Annotation target '${nodeTarget.id}' does not exist in the document.`,
        severity: "error",
        ...(nodeTarget.sourceRange !== undefined
          ? { sourceRange: cloneSourceRange(nodeTarget.sourceRange) }
          : {}),
        target,
      },
      order,
    ),
  ];
}

function nodeTargetSourceRangeDiagnostic(
  target: AnnotationTargetCandidate,
  nodeTarget: EngineNodeTarget,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic | undefined {
  if (nodeTarget.sourceRange === undefined) {
    return undefined;
  }

  if (sourceRangeIsInvalid(nodeTarget.sourceRange)) {
    return sortableDiagnostic(
      {
        code: "annotation.target.invalidRange",
        message: "Annotation node target source range ends before it starts.",
        severity: "error",
        sourceRange: cloneSourceRange(nodeTarget.sourceRange),
        target,
      },
      order,
    );
  }

  if (
    documentSourceRange !== undefined &&
    !sourceRangeContains(documentSourceRange, nodeTarget.sourceRange)
  ) {
    return sortableDiagnostic(
      {
        code: "annotation.target.outOfBounds",
        message:
          "Annotation node target source range must be contained by the document source range.",
        severity: "error",
        sourceRange: cloneSourceRange(nodeTarget.sourceRange),
        target,
      },
      order,
    );
  }

  return undefined;
}

function sourceTargetDiagnostics(
  target: AnnotationTargetCandidate,
  documentSourceRange: SourceRange | undefined,
  order: number,
): SortableTargetDiagnostic[] {
  const range = cloneSourceRangeCandidate(annotationSourceRange(target));

  if (range === undefined) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range must include start and end positions.",
          severity: "error",
          target,
        },
        order,
      ),
    ];
  }

  if (sourceRangeIsInvalid(range)) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.invalidRange",
          message: "Annotation source target range ends before it starts.",
          severity: "error",
          sourceRange: cloneSourceRange(range),
          target,
        },
        order,
      ),
    ];
  }

  if (
    documentSourceRange !== undefined &&
    !sourceRangeContains(documentSourceRange, range)
  ) {
    return [
      sortableDiagnostic(
        {
          code: "annotation.target.outOfBounds",
          message:
            "Annotation source target range must be contained by the document source range.",
          severity: "error",
          sourceRange: cloneSourceRange(range),
          target,
        },
        order,
      ),
    ];
  }

  return [];
}
