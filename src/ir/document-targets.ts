import type { SourceRange } from "../api/diagnostics.js";
import type {
  EngineNode,
  EngineSourceSlice,
  EngineNodeTarget,
} from "../api/document.js";
import { cloneSourceRange, sourceOffsetBounds } from "./source-ranges.js";

export interface DocumentViewBuildOptions {
  preserveSourceLocations: boolean;
  source: string;
}

export function withNodeMetadata(
  node: EngineNode,
  path: readonly number[],
  options: DocumentViewBuildOptions,
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
): EngineNodeTarget {
  const idPath = path.length === 0 ? "root" : path.join(".");

  return {
    kind: "node",
    id: `node:${idPath}:${nodeType}`,
    path: [...path],
    nodeType,
    ...(sourceRange !== undefined
      ? { sourceRange: cloneSourceRange(sourceRange) }
      : {}),
  };
}

export function requireNodeTarget(node: EngineNode): EngineNodeTarget {
  if (node.target === undefined) {
    throw new Error(`Expected ${node.type} node to have a target.`);
  }

  return node.target;
}

function sourceSliceForRange(
  sourceRange: SourceRange | undefined,
  options: DocumentViewBuildOptions,
): EngineSourceSlice | undefined {
  if (!options.preserveSourceLocations || sourceRange === undefined) {
    return undefined;
  }

  const offsets = sourceOffsetBounds(sourceRange, options.source.length);

  if (offsets === undefined) {
    return undefined;
  }

  return {
    range: cloneSourceRange(sourceRange),
    text: options.source.slice(offsets.startOffset, offsets.endOffset),
  };
}
