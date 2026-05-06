import { readFileSync } from "node:fs";
import { join } from "node:path";

const richIrPath = "fixtures/rich-ir/proving.md";
const draftCompatibilityOptions = {
  compatibilityMode: "default",
};

export function buildRichIrRepeatabilityOutputs(repoRoot, engine) {
  const { documentQueries, normalize, parse, validateAnnotations } = engine;
  const richIrMarkdown = readFileSync(join(repoRoot, richIrPath), "utf8");
  const richIrDocument = normalize(
    parse(richIrMarkdown, { path: richIrPath }).parsed,
    { documentVersion: "1.0.0-draft" },
  ).document;
  const paragraph = firstNode(documentQueries, richIrDocument, "paragraph");
  const annotationResult = validateAnnotations(richIrDocument, [
    nodeAnnotation("annotation:mission-paragraph", targetFor(paragraph)),
    sourceAnnotation("annotation:mission-source", sourceRangeFor(paragraph)),
  ]);
  const annotationDiagnostics = validateAnnotations(richIrDocument, [
    nodeAnnotation("annotation:missing-paragraph", missingNodeTarget()),
  ]);
  const annotatedRichIrDocument = {
    ...richIrDocument,
    annotations: annotationResult.annotations,
  };

  return [
    {
      name: "rich-ir:document",
      result: richIrDocument,
      options: draftCompatibilityOptions,
    },
    {
      name: "rich-ir:annotated-document",
      result: annotatedRichIrDocument,
      options: draftCompatibilityOptions,
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
      target,
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
      range,
    },
    payload: {
      ownedByCaller: true,
      signal: id,
    },
  };
}

function missingNodeTarget() {
  return {
    kind: "node",
    id: "node:missing:paragraph",
    path: [999],
    nodeType: "paragraph",
  };
}
