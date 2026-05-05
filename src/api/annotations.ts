import type {
  AnnotationValidationResult,
  EngineAnnotation,
  EngineDocument,
} from "./document.js";
import {
  annotationTargetDiagnostics,
  cloneAnnotationTarget,
} from "./annotation-target-validation.js";

export type ValidateAnnotationsFunction = (
  document: EngineDocument,
  annotations: readonly EngineAnnotation[],
) => AnnotationValidationResult;

export const validateAnnotations: ValidateAnnotationsFunction = (
  document,
  annotations,
) => {
  const diagnostics = annotationTargetDiagnostics(document, annotations);

  return {
    valid: diagnostics.length === 0,
    annotations: annotations.map((annotation) => cloneAnnotation(annotation)),
    diagnostics,
  };
};

function cloneAnnotation<TPayload>(
  annotation: EngineAnnotation<TPayload>,
): EngineAnnotation<TPayload> {
  return {
    ...annotation,
    target: cloneAnnotationTarget(annotation.target),
  };
}
