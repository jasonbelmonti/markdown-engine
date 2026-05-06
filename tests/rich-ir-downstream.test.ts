import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  validateAnnotations,
  type EngineAnnotation,
  type EngineDocument,
  type EngineNode,
  type EngineSection,
  type EngineTextSpan,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/downstream.md";
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/downstream.md", import.meta.url),
  "utf8",
);

describe("1.0 Rich IR downstream structural exercise", () => {
  it("supports section, span, source-slice, query, and annotation workflows without semantic leakage", () => {
    const document = normalizeDraftFixture();
    const wp1 = sectionByTitle(document, "WP-1");
    const wp2 = sectionByTitle(document, "WP-2");
    const wp1BodyNodes = bodyNodes(document, wp1);
    const wp1Source = documentQueries.sourceSlice(document, wp1.target);
    const acceptanceSpan = onlyTextSpan(
      documentQueries.textSpans(document, {
        nodeType: "paragraph",
        textIncludes: "CON-1 through CON-3",
      }),
    );
    const annotationSourceRange = acceptanceSpan.sourceRange ?? missing();
    const annotations: EngineAnnotation[] = [
      {
        id: "downstream:wp-1-section",
        target: { kind: "node", nodeTarget: wp1.target },
        payload: {
          consumer: "spectrace-style-fixture",
          signals: ["WP-1", "BEL-858"],
        },
      },
      {
        id: "downstream:acceptance-source",
        target: { kind: "source", sourceRange: annotationSourceRange },
        payload: {
          consumer: "spectrace-style-fixture",
          signals: ["CON-1", "CON-3"],
        },
      },
    ];

    const annotationResult = validateAnnotations(document, annotations);

    expect(document.version).toBe("1.0.0-draft");
    expect(documentQueries.sections(document).map((section) => section.title)).toEqual([
      "SpecTrace Style Exercise",
      "WP-1",
      "WP-2",
    ]);
    expect(documentQueries.sections(document, { title: "WP-1" })).toEqual([wp1]);
    expect(documentQueries.sections(document, { targetId: wp2.target.id })).toEqual([
      wp2,
    ]);
    expect(wp1BodyNodes.map((node) => node.type)).toEqual([
      "paragraph",
      "table",
      "list",
    ]);
    expect(wp1Source?.text).toBe("## WP-1");
    expect(documentQueries.sourceSlice(document, acceptanceSpan.target)?.text).toContain(
      "CON-1 through CON-3",
    );
    expect(annotationResult).toEqual({
      valid: true,
      annotations,
      diagnostics: [],
    });
    expect(forbiddenSemanticKeys(document)).toEqual([]);
  });

  it("keeps the downstream exercise deterministic across repeated runs", () => {
    const baseline = downstreamEvidence();

    for (let run = 0; run < 10; run += 1) {
      expect(downstreamEvidence()).toEqual(baseline);
    }
  });
});

function normalizeDraftFixture(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0-draft",
  }).document;
}

function downstreamEvidence() {
  const document = normalizeDraftFixture();
  const wp1 = sectionByTitle(document, "WP-1");
  const acceptanceSpan = onlyTextSpan(
    documentQueries.textSpans(document, {
      nodeType: "paragraph",
      textIncludes: "CON-1 through CON-3",
    }),
  );
  const annotations: EngineAnnotation[] = [
    {
      id: "downstream:wp-1-section",
      target: { kind: "node", nodeTarget: wp1.target },
      payload: { consumer: "spectrace-style-fixture", signals: ["WP-1"] },
    },
    {
      id: "downstream:acceptance-source",
      target: {
        kind: "source",
        sourceRange: acceptanceSpan.sourceRange ?? missing(),
      },
      payload: { consumer: "spectrace-style-fixture", signals: ["CON-1"] },
    },
  ];
  const annotationResult = validateAnnotations(document, annotations);

  return {
    fixture: fixturePath,
    sections: documentQueries.sections(document).map((section) => ({
      targetId: section.target.id,
      title: section.title,
      depth: section.depth,
      bodyTypes: bodyNodes(document, section).map((node) => node.type),
    })),
    acceptanceSpan: {
      targetId: acceptanceSpan.target.id,
      text: acceptanceSpan.text,
      sourceRange: acceptanceSpan.sourceRange,
      sourceSlice: documentQueries.sourceSlice(document, acceptanceSpan.target),
    },
    wp1HeadingSource: documentQueries.sourceSlice(document, wp1.target),
    annotationResult,
    forbiddenSemanticKeys: forbiddenSemanticKeys(document),
  };
}

function sectionByTitle(document: EngineDocument, title: string): EngineSection {
  return documentQueries.sections(document, { title })[0] ?? missing();
}

function bodyNodes(
  document: EngineDocument,
  section: EngineSection,
): readonly EngineNode[] {
  const bodyTargetIds = new Set(section.bodyTargets.map((target) => target.id));

  return documentQueries
    .nodes(document)
    .filter(
      (node) => node.target !== undefined && bodyTargetIds.has(node.target.id),
    );
}

function onlyTextSpan(spans: readonly EngineTextSpan[]): EngineTextSpan {
  if (spans.length !== 1 || spans[0] === undefined) {
    return missing();
  }

  return spans[0];
}

function forbiddenSemanticKeys(value: unknown): string[] {
  const forbidden = new Set([
    "entityId",
    "entityType",
    "issueKey",
    "registry",
    "relationship",
  ]);
  const keys: string[] = [];
  const stack = [value];

  while (stack.length > 0) {
    const current = stack.pop();

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    if (current === null || typeof current !== "object") {
      continue;
    }

    for (const [key, child] of Object.entries(current)) {
      if (forbidden.has(key)) {
        keys.push(key);
      }
      stack.push(child);
    }
  }

  return keys.sort();
}

function missing(): never {
  throw new Error("Expected downstream fixture value to be present.");
}
