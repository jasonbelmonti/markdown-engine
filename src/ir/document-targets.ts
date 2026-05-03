import type { SourceRange } from "../api/diagnostics.js";
import type {
  EngineNode,
  EngineSourceSlice,
  EngineTarget,
} from "../api/document.js";

export interface DraftViewBuildOptions {
  preserveSourceLocations: boolean;
  source: string;
}

export function withNodeMetadata(
  node: EngineNode,
  path: readonly number[],
  options: DraftViewBuildOptions,
): EngineNode {
  const children = (node.children ?? []).map((child, index) =>
    withNodeMetadata(child, [...path, index], options),
  );
  const target = targetFor(node.type, path, node.sourceRange);
  const source = sourceSliceForRange(node.sourceRange, options);

  return {
    ...node,
    target,
    ...(source !== undefined ? { source } : {}),
    ...(children.length > 0 ? { children } : {}),
  };
}

export function targetFor(
  nodeType: string,
  path: readonly number[],
  sourceRange: SourceRange | undefined,
): EngineTarget {
  const idPath = path.length === 0 ? "root" : path.join(".");

  return {
    kind: "node",
    id: `node:${idPath}:${nodeType}`,
    path,
    nodeType,
    ...(sourceRange !== undefined ? { sourceRange } : {}),
  };
}

export function requireNodeTarget(node: EngineNode): EngineTarget {
  if (node.target === undefined) {
    throw new Error(`Expected ${node.type} node to have a target.`);
  }

  return node.target;
}

function sourceSliceForRange(
  sourceRange: SourceRange | undefined,
  options: DraftViewBuildOptions,
): EngineSourceSlice | undefined {
  if (
    !options.preserveSourceLocations ||
    typeof sourceRange?.start.offset !== "number" ||
    typeof sourceRange.end.offset !== "number" ||
    sourceRange.end.offset < sourceRange.start.offset
  ) {
    return undefined;
  }

  return {
    range: sourceRange,
    text: options.source.slice(sourceRange.start.offset, sourceRange.end.offset),
  };
}
