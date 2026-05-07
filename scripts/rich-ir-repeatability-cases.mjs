import { readFileSync } from "node:fs";
import { join } from "node:path";

const richIrPath = "fixtures/rich-ir/proving.md";
const richIrCompatibilityOptions = {
  compatibilityMode: "default",
};

export function buildRichIrRepeatabilityOutputs(repoRoot, engine) {
  const { documentQueries, normalize, parse, validateAnnotations } = engine;
  const richIrMarkdown = readFileSync(join(repoRoot, richIrPath), "utf8");
  const richIrDocument = normalize(
    parse(richIrMarkdown, { path: richIrPath }).parsed,
    { documentVersion: "1.0.0" },
  ).document;
  const paragraph = firstNode(documentQueries, richIrDocument, "paragraph");
  const annotationResult = validateAnnotations(richIrDocument, [
    nodeAnnotation("annotation:mission-paragraph", targetFor(paragraph)),
    sourceAnnotation("annotation:mission-source", sourceRangeFor(paragraph)),
  ]);
  const annotationDiagnostics = validateAnnotations(richIrDocument, [
    sourceAnnotation(
      "annotation:out-of-bounds-source",
      rangeWithoutOffsets(1, 1, 1, 8),
    ),
    nodeAnnotation("annotation:unknown-a", missingNodeTarget("node:a:missing")),
    nodeAnnotation("annotation:unknown-z", missingNodeTarget("node:z:missing")),
    nodeAnnotation(
      "annotation:unknown-missing-offset",
      missingNodeTarget("node:missing-offset", rangeWithoutOffsets(9, 1, 9, 6)),
    ),
    sourceAnnotation(
      "annotation:invalid-source-range",
      sourceRange(10, 4, 200, 9, 1, 180),
    ),
    malformedAnnotation("annotation:bad-node-target", {
      kind: "node",
      nodeTarget: {
        kind: "node",
        id: "node:bad:path",
        path: [-1],
      },
    }),
    malformedAnnotation("annotation:bad-target-kind", {
      kind: "block",
      target: targetFor(paragraph),
    }),
    malformedAnnotation("annotation:missing-source-range", {
      kind: "source",
    }),
  ]);
  const annotatedRichIrDocument = {
    ...richIrDocument,
    annotations: annotationResult.annotations,
  };

  return [
    {
      name: "rich-ir:document",
      result: richIrDocument,
      options: richIrCompatibilityOptions,
    },
    {
      name: "rich-ir:annotated-document",
      result: annotatedRichIrDocument,
      options: richIrCompatibilityOptions,
    },
    {
      name: "rich-ir:annotation-diagnostics",
      result: annotationDiagnostics,
    },
  ];
}

function firstNode(documentQueries, document, type) {
  const node = documentQueries.nodes(document, { type })[0];

  if (node === undefined) {
    throw new Error(`Expected rich IR fixture to include a ${type} node.`);
  }

  return node;
}

function targetFor(node) {
  if (node.target === undefined) {
    throw new Error("Expected rich IR node to include a target.");
  }

  return node.target;
}

function sourceRangeFor(node) {
  if (node.sourceRange === undefined) {
    throw new Error("Expected rich IR node to include a source range.");
  }

  return node.sourceRange;
}

function nodeAnnotation(id, target) {
  return {
    id,
    target: {
      kind: "node",
      nodeTarget: target,
    },
    payload: {
      ownedByCaller: true,
      signal: id,
    },
  };
}

function sourceAnnotation(id, range) {
  return {
    id,
    target: {
      kind: "source",
      sourceRange: range,
    },
    payload: {
      ownedByCaller: true,
      signal: id,
    },
  };
}

function missingNodeTarget(id, range = sourceRange(9, 1, 90, 9, 6, 95)) {
  return {
    kind: "node",
    id,
    path: [999],
    nodeType: "paragraph",
    sourceRange: range,
  };
}

function malformedAnnotation(id, target) {
  return {
    id,
    target,
    payload: {
      ownedByCaller: true,
      signal: id,
    },
  };
}

function sourceRange(
  startLine,
  startColumn,
  startOffset,
  endLine,
  endColumn,
  endOffset,
) {
  return {
    start: {
      line: startLine,
      column: startColumn,
      offset: startOffset,
    },
    end: {
      line: endLine,
      column: endColumn,
      offset: endOffset,
    },
  };
}

function rangeWithoutOffsets(startLine, startColumn, endLine, endColumn) {
  return {
    start: {
      line: startLine,
      column: startColumn,
    },
    end: {
      line: endLine,
      column: endColumn,
    },
  };
}
