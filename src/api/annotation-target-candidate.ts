import { isArray, ownDataProperty } from "./annotation-target-runtime.js";

export type AnnotationTargetCandidate = {
  kind?: unknown;
  nodeTarget?: unknown;
  sourceRange?: unknown;
};

export function isAnnotationTargetCandidate(
  target: unknown,
): target is AnnotationTargetCandidate {
  return typeof target === "object" && target !== null && !isArray(target);
}

export function annotationTargetKind(
  target: AnnotationTargetCandidate,
): unknown {
  return ownDataProperty(target, "kind");
}

export function annotationNodeTarget(
  target: AnnotationTargetCandidate,
): unknown {
  return ownDataProperty(target, "nodeTarget");
}

export function annotationSourceRange(
  target: AnnotationTargetCandidate,
): unknown {
  return ownDataProperty(target, "sourceRange");
}
