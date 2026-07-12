import { isMap, isScalar, isSeq } from "yaml";

import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";
import {
  nonStringYamlKeyDiagnostic,
  yamlNodeRange,
} from "./yaml-diagnostics.js";

export function unsupportedYamlKeyDiagnostics(
  node: unknown,
  raw: string,
  contentStart: SourcePosition,
  fallbackRange: SourceRange,
): MarkdownDiagnostic[] {
  const diagnostics: MarkdownDiagnostic[] = [];
  collectUnsupportedYamlKeyDiagnostics(
    node,
    raw,
    contentStart,
    fallbackRange,
    diagnostics,
  );
  return diagnostics;
}

function collectUnsupportedYamlKeyDiagnostics(
  node: unknown,
  raw: string,
  contentStart: SourcePosition,
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
        raw,
        contentStart,
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
          yamlNodeRange(key, raw, contentStart) ?? fallbackRange,
        ),
      );
    }

    collectUnsupportedYamlKeyDiagnostics(
      pair.value,
      raw,
      contentStart,
      fallbackRange,
      diagnostics,
    );
  }
}
