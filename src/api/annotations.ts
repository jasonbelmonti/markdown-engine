import type {
  AnnotationValidationResult,
  EngineAnnotation,
  EngineAnnotationTarget,
  EngineDocument,
  EngineTargetDiagnostic,
} from "./document.js";
import type { SourceRange } from "./diagnostics.js";
import { documentQueries } from "./document-queries.js";

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
  if (target.kind === "node") {
    return validTargetIds.has(target.target.id)
      ? []
      : [
          {
            code: "annotation.target.unknown",
            message: `Annotation target '${target.target.id}' does not exist in the document.`,
            severity: "error",
            target,
          },
        ];
  }

  if (sourceRangeIsInvalid(target.range)) {
    return [
      {
        code: "annotation.target.invalidRange",
        message: "Annotation source target range ends before it starts.",
        severity: "error",
        sourceRange: target.range,
        target,
      },
    ];
  }

  return [];
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
