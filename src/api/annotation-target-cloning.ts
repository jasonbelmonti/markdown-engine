import type {
  EngineAnnotationTarget,
  EngineNodeTarget,
} from "./document.js";
import type { OwnRuntimeProperty } from "./annotation-target-runtime.js";
import {
  arrayLength,
  isArray,
  isPlainObject,
  MAX_NORMALIZED_ARRAY_LENGTH,
  normalizeRuntimeValue,
  ownRuntimeProperty,
} from "./annotation-target-runtime.js";
import {
  annotationNodeTarget,
  annotationSourceRange,
  annotationTargetKind,
  isAnnotationTargetCandidate,
  type AnnotationTargetCandidate,
} from "./annotation-target-candidate.js";
import { cloneSourceRangeCandidate } from "./annotation-source-range.js";

type TargetPathClone =
  | { kind: "cloned"; path: readonly number[] }
  | { kind: "invalid" }
  | { kind: "unavailable" };

export function cloneAnnotationTarget(
  target: EngineAnnotationTarget,
): EngineAnnotationTarget {
  if (isAnnotationTargetCandidate(target)) {
    const clonedTarget = cloneKnownAnnotationTarget(target);

    if (clonedTarget !== undefined) {
      return clonedTarget;
    }
  }

  return serializableTarget(target) as EngineAnnotationTarget;
}

export function cloneDiagnosticTarget(target: unknown): unknown {
  if (isAnnotationTargetCandidate(target)) {
    const clonedTarget = cloneKnownAnnotationTarget(target);

    if (clonedTarget !== undefined) {
      return clonedTarget;
    }
  }

  return serializableTarget(target);
}

export function cloneEngineTargetCandidate(
  target: unknown,
): EngineNodeTarget | undefined {
  if (!isPlainObject(target)) {
    return undefined;
  }

  const kind = ownDataProperty(target, "kind");
  const id = ownDataProperty(target, "id");
  const pathProperty = ownRuntimeProperty(target, "path");
  const nodeTypeProperty = ownRuntimeProperty(target, "nodeType");
  const sourceRangeProperty = ownRuntimeProperty(target, "sourceRange");
  const path = optionalDataPropertyValue(pathProperty);
  const nodeType = optionalDataPropertyValue(nodeTypeProperty);
  const sourceRange = optionalDataPropertyValue(sourceRangeProperty);

  if (kind !== "node" || typeof id !== "string") {
    return undefined;
  }

  const pathClone = path !== undefined ? cloneTargetPathCandidate(path) : undefined;
  const clonedSourceRange =
    sourceRange !== undefined ? cloneSourceRangeCandidate(sourceRange) : undefined;

  if (
    pathProperty.kind === "accessor" ||
    optionalDataPropertyIsInvalid(nodeTypeProperty) ||
    optionalDataPropertyIsInvalid(sourceRangeProperty) ||
    pathClone?.kind === "invalid" ||
    (nodeType !== undefined && typeof nodeType !== "string") ||
    (sourceRange !== undefined && clonedSourceRange === undefined)
  ) {
    return undefined;
  }

  return {
    kind,
    id,
    ...(pathClone?.kind === "cloned" ? { path: pathClone.path } : {}),
    ...(typeof nodeType === "string" ? { nodeType } : {}),
    ...(clonedSourceRange !== undefined ? { sourceRange: clonedSourceRange } : {}),
  };
}

function serializableTarget(target: unknown): unknown {
  return normalizeRuntimeValue(target);
}

function cloneKnownAnnotationTarget(
  target: AnnotationTargetCandidate,
): EngineAnnotationTarget | undefined {
  const kind = annotationTargetKind(target);

  if (kind === "node") {
    const nodeTarget = cloneEngineTargetCandidate(annotationNodeTarget(target));

    if (nodeTarget === undefined) {
      return undefined;
    }

    return {
      kind: "node",
      nodeTarget,
    };
  }

  if (kind === "source") {
    const sourceRange = cloneSourceRangeCandidate(annotationSourceRange(target));

    if (sourceRange === undefined) {
      return undefined;
    }

    return {
      kind: "source",
      sourceRange,
    };
  }

  return undefined;
}

function cloneTargetPathCandidate(path: unknown): TargetPathClone {
  if (!isArray(path)) {
    return { kind: "invalid" };
  }

  const length = arrayLength(path);

  if (length === undefined) {
    return { kind: "unavailable" };
  }

  if (length > MAX_NORMALIZED_ARRAY_LENGTH) {
    return { kind: "unavailable" };
  }

  const clonedPath: number[] = [];

  for (let index = 0; index < length; index += 1) {
    const segmentProperty = ownRuntimeProperty(
      path as unknown as Record<string, unknown>,
      String(index),
    );

    if (segmentProperty.kind === "unavailable") {
      return { kind: "unavailable" };
    }

    if (segmentProperty.kind !== "data") {
      return { kind: "invalid" };
    }

    if (!isNonNegativeInteger(segmentProperty.value)) {
      return { kind: "invalid" };
    }

    clonedPath.push(segmentProperty.value);
  }

  return { kind: "cloned", path: clonedPath };
}

function ownDataProperty(value: Record<string, unknown>, key: string): unknown {
  const property = ownRuntimeProperty(value, key);

  return property.kind === "data" ? property.value : undefined;
}

function optionalDataPropertyValue(property: OwnRuntimeProperty): unknown {
  return property.kind === "data" ? property.value : undefined;
}

function optionalDataPropertyIsInvalid(property: OwnRuntimeProperty): boolean {
  return property.kind === "accessor" || property.kind === "unavailable";
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
