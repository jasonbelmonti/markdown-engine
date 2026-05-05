import type {
  AnnotationValidationResult,
  EngineAnnotation,
  EngineDocument,
} from "./document.js";
import {
  annotationTargetDiagnostics,
  cloneAnnotation,
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
