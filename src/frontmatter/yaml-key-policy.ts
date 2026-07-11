import { isMap, isScalar, isSeq } from "yaml";

import type {
  MarkdownDiagnostic,
  SourceRange,
} from "../api/diagnostics.js";
import {
  nonStringYamlKeyDiagnostic,
  yamlNodeRangeFromIndex,
} from "./yaml-diagnostics.js";
import type { YamlSourcePositionIndex } from "./yaml-source-positions.js";

export function unsupportedYamlKeyDiagnostics(
  node: unknown,
  sourcePositions: YamlSourcePositionIndex,
  fallbackRange: SourceRange,
): MarkdownDiagnostic[] {
  const diagnostics: MarkdownDiagnostic[] = [];
  collectUnsupportedYamlKeyDiagnostics(
    node,
    sourcePositions,
    fallbackRange,
    diagnostics,
  );
  return diagnostics;
}

function collectUnsupportedYamlKeyDiagnostics(
  node: unknown,
  sourcePositions: YamlSourcePositionIndex,
  fallbackRange: SourceRange,
  diagnostics: MarkdownDiagnostic[],
): void {
  if (node === null || isScalar(node)) {
    return;
  }

  if (isSeq(node)) {
    for (const item of node.items) {
      collectUnsupportedYamlKeyDiagnostics(
        item,
        sourcePositions,
        fallbackRange,
        diagnostics,
      );
    }
    return;
  }

  if (!isMap(node)) {
    return;
  }

  for (const pair of node.items) {
    const key = pair.key;

    if (!isScalar(key) || typeof key.value !== "string") {
      diagnostics.push(
        nonStringYamlKeyDiagnostic(
          yamlNodeRangeFromIndex(key, sourcePositions) ?? fallbackRange,
        ),
      );
    }

    collectUnsupportedYamlKeyDiagnostics(
      pair.value,
      sourcePositions,
      fallbackRange,
      diagnostics,
    );
  }
}
