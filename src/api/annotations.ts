import type {
  AnnotationValidationResult,
  EngineAnnotation,
  EngineAnnotationTarget,
  EngineDocument,
  EngineTarget,
  EngineTargetDiagnostic,
} from "./document.js";
import type { SourceRange } from "./diagnostics.js";
import { documentQueries } from "./document-queries.js";

type AnnotationTargetCandidate = {
  kind?: unknown;
  range?: unknown;
  target?: unknown;
};

export type ValidateAnnotationsFunction = (
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
) => AnnotationValidationResult;

export const validateAnnotations: ValidateAnnotationsFunction = (
  document,
  annotations,
) => {
  const validTargetIds = documentTargetIds(document);
  const diagnostics = annotations.flatMap((annotation) =>
    diagnosticsForAnnotation(annotation.target, validTargetIds),
  );

  return {
    valid: diagnostics.length === 0,
    annotations: annotations.map((annotation) => ({ ...annotation })),
    diagnostics,
  };
};

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
): EngineTargetDiagnostic[] {
  if (!isAnnotationTargetCandidate(target)) {
    return [
      {
        code: "annotation.target.invalidKind",
        message: "Annotation target kind must be 'node' or 'source'.",
        severity: "error",
        target,
      },
    ];
  }

  const candidate = target;

  if (candidate.kind === "node") {
    if (!isNodeTarget(candidate.target)) {
      return [
        {
          code: "annotation.target.invalidKind",
          message: "Annotation node target must reference an engine node target.",
          severity: "error",
          target,
        },
      ];
    }

    return validTargetIds.has(candidate.target.id)
      ? []
      : [
          {
            code: "annotation.target.unknown",
            message: `Annotation target '${candidate.target.id}' does not exist in the document.`,
            severity: "error",
            target,
          },
        ];
  }

  if (candidate.kind !== "source") {
    return [
      {
        code: "annotation.target.invalidKind",
        message: "Annotation target kind must be 'node' or 'source'.",
        severity: "error",
        target,
      },
    ];
  }

  if (!isSourceRange(candidate.range)) {
    return [
      {
        code: "annotation.target.invalidRange",
        message: "Annotation source target range must include start and end positions.",
        severity: "error",
        target,
      },
    ];
  }

  if (sourceRangeIsInvalid(candidate.range)) {
    return [
      {
        code: "annotation.target.invalidRange",
        message: "Annotation source target range ends before it starts.",
        severity: "error",
        sourceRange: candidate.range,
        target,
      },
    ];
  }

  return [];
}

function isAnnotationTargetCandidate(
  target: unknown,
): target is AnnotationTargetCandidate {
  return typeof target === "object" && target !== null;
}

function isNodeTarget(target: unknown): target is EngineTarget {
  return (
    typeof target === "object" &&
    target !== null &&
    "kind" in target &&
    target.kind === "node" &&
    "id" in target &&
    typeof target.id === "string"
  );
}

function isSourceRange(range: unknown): range is SourceRange {
  return (
    typeof range === "object" &&
    range !== null &&
    "start" in range &&
    isSourcePosition(range.start) &&
    "end" in range &&
    isSourcePosition(range.end)
  );
}

function isSourcePosition(position: unknown): position is SourceRange["start"] {
  return (
    typeof position === "object" &&
    position !== null &&
    "line" in position &&
    sourceLineOrColumnIsValid(position.line) &&
    "column" in position &&
    sourceLineOrColumnIsValid(position.column) &&
    (!("offset" in position) || sourceOffsetIsValid(position.offset))
  );
}

function sourceLineOrColumnIsValid(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1;
}

function sourceOffsetIsValid(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function sourceRangeIsInvalid(range: SourceRange): boolean {
  const offsetsAreInvalid =
    typeof range.start.offset === "number" &&
    typeof range.end.offset === "number" &&
    range.end.offset < range.start.offset;

  return offsetsAreInvalid || sourceRangeHasInvalidPositionOrder(range);
}

function sourceRangeHasInvalidPositionOrder(range: SourceRange): boolean {
  if (range.end.line !== range.start.line) {
    return range.end.line < range.start.line;
  }

  return range.end.column < range.start.column;
}
