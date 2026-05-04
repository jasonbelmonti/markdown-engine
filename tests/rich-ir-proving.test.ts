import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  serialize,
  validateAnnotations,
  type EngineAnnotation,
  type EngineDocument,
  type EngineTarget,
  type SourceRange,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/proving.md";
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/proving.md", import.meta.url),
  "utf8",
);

describe("1.0 Rich IR proving path", () => {
  it("proves target, source, and derived-view behavior for one fixture", () => {
    const document = normalizeDraftFixture();
    const repeatedDocument = normalizeDraftFixture();

    expect(document).toMatchObject({
      kind: "markdown-document",
      version: "1.0.0-draft",
      path: fixturePath,
      target: {
        kind: "node",
        id: "node:root:document",
        path: [],
        nodeType: "document",
      },
    });
    expect(targetIds(document)).toEqual(targetIds(repeatedDocument));
    expect(JSON.stringify(document)).not.toContain('"position"');

    const missionSection = documentQueries
      .sections(document)
      .find((section) => section.title === "Mission Brief");
    const executionSection = documentQueries
      .sections(document)
      .find((section) => section.title === "Execution Target");

    expect(missionSection).toMatchObject({
      depth: 1,
      bodyTargets: [expect.objectContaining({ nodeType: "paragraph" })],
      childSections: [expect.objectContaining({ nodeType: "section" })],
    });
    expect(executionSection).toMatchObject({
      depth: 2,
      bodyTargets: [
        expect.objectContaining({ nodeType: "paragraph" }),
        expect.objectContaining({ nodeType: "table" }),
        expect.objectContaining({ nodeType: "list" }),
        expect.objectContaining({ nodeType: "code" }),
        expect.objectContaining({ nodeType: "html" }),
      ],
    });

    const paragraph = documentQueries.nodes(document, { type: "paragraph" })[0];
    expect(paragraph?.target).toMatchObject({
      kind: "node",
      id: "node:1:paragraph",
      path: [1],
      nodeType: "paragraph",
    });
    const paragraphSource = documentQueries.sourceSlice(
      document,
      paragraph?.target ?? missingTarget(),
    );

    expect(paragraphSource).toMatchObject({
      text: "Use [markdown-engine](https://example.com/markdown-engine) to prove the structural path.",
    });

    expect(documentQueries.textSpans(document)).toContainEqual(
      expect.objectContaining({
        target: expect.objectContaining({ nodeType: "paragraph" }),
        text: "Use markdown-engine to prove the structural path.",
      }),
    );
    expect(documentQueries.tables(document)[0]?.cells).toContainEqual(
      expect.objectContaining({
        text: "go",
        rowIndex: 1,
        columnIndex: 1,
        header: false,
      }),
    );
    expect(documentQueries.lists(document)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ordered: false,
          items: expect.arrayContaining([
            expect.objectContaining({
              itemIndex: 0,
              depth: 0,
              checked: true,
            }),
          ]),
        }),
        expect.objectContaining({
          ordered: false,
          items: expect.arrayContaining([
            expect.objectContaining({
              itemIndex: 0,
              depth: 1,
              checked: false,
            }),
          ]),
        }),
      ]),
    );
    expect(documentQueries.links(document)).toContainEqual(
      expect.objectContaining({
        url: "https://example.com/markdown-engine",
        text: "markdown-engine",
      }),
    );
  });

  it("validates caller-owned annotation targets without interpreting payloads", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstParagraph(document);
    const section = documentQueries.sections(document)[0] ?? missingTarget();

    const annotation = annotationFor(paragraph.target);
    const sectionAnnotation = annotationFor(section.target);
    const sourceAnnotation = sourceAnnotationFor(paragraph.sourceRange);
    const annotationResult = validateAnnotations(document, [
      annotation,
      sectionAnnotation,
      sourceAnnotation,
    ]);

    expect(annotationResult).toEqual({
      valid: true,
      annotations: [annotation, sectionAnnotation, sourceAnnotation],
      diagnostics: [],
    });
    expect(validateAnnotations(document, [annotationFor(missingNodeTarget())]))
      .toMatchObject({
        valid: false,
        diagnostics: [
          expect.objectContaining({
            code: "annotation.target.unknown",
            severity: "error",
          }),
        ],
      });
    expect(validateAnnotations(document, [malformedNodeAnnotation(paragraph.target)]))
      .toMatchObject({
        valid: false,
        diagnostics: [
          expect.objectContaining({
            code: "annotation.target.invalidKind",
            severity: "error",
          }),
        ],
      });
    expect(validateAnnotations(document, [sourceAnnotationFor(invalidRange())]))
      .toMatchObject({
        valid: false,
        diagnostics: [
          expect.objectContaining({
            code: "annotation.target.invalidRange",
            severity: "error",
          }),
        ],
      });
    expect(validateAnnotations(document, [malformedSourceAnnotation()]))
      .toMatchObject({
        valid: false,
        diagnostics: [
          expect.objectContaining({
            code: "annotation.target.invalidRange",
            severity: "error",
          }),
        ],
      });
    for (const range of nonFiniteRanges()) {
      expect(validateAnnotations(document, [sourceAnnotationFor(range)]))
        .toMatchObject({
          valid: false,
          diagnostics: [
            expect.objectContaining({
              code: "annotation.target.invalidRange",
              severity: "error",
            }),
          ],
        });
    }
  });

  it("serializes deterministically and preserves explicit legacy compatibility", () => {
    const document = normalizeDraftFixture();
    const paragraph = firstParagraph(document);
    const annotationResult = validateAnnotations(document, [
      annotationFor(paragraph.target),
    ]);

    const annotatedDocument = {
      ...document,
      annotations: annotationResult.annotations,
    };
    const serializedDocument = serialize(annotatedDocument, { pretty: true });

    expect(serializedDocument).toEqual(
      serialize(annotatedDocument, { pretty: true }),
    );
    expect(JSON.parse(serializedDocument)).toMatchObject({
      version: "1.0.0-draft",
      annotations: [
        {
          id: "annotation:mission-paragraph",
          payload: {
            ownedByCaller: true,
            signal: "go",
          },
        },
      ],
      compatibility: {
        mode: "default",
      },
    });

    const legacyDocument = normalize(
      parse(fixture, { path: fixturePath }).parsed,
      { documentVersion: "0.0.0" },
    ).document;

    expect(legacyDocument.version).toBe("0.0.0");
    expect(legacyDocument.target).toBeUndefined();
    expect(legacyDocument.sections).toBeUndefined();
    expect(legacyDocument.annotations).toBeUndefined();
  });
});

function normalizeDraftFixture(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0-draft",
  }).document;
}

function targetIds(document: EngineDocument): string[] {
  return documentQueries
    .nodes(document)
    .map((node) => node.target?.id)
    .filter((id): id is string => id !== undefined);
}

function missingTarget() {
  throw new Error("Expected paragraph target to be present.");
}

function firstParagraph(document: EngineDocument) {
  const paragraph = documentQueries.nodes(document, { type: "paragraph" })[0];

  return paragraph ?? missingTarget();
}

function annotationFor(target: EngineTarget | undefined): EngineAnnotation {
  if (target === undefined) {
    return missingTarget();
  }

  return {
    id: "annotation:mission-paragraph",
    target: {
      kind: "node",
      target,
    },
    payload: {
      ownedByCaller: true,
      signal: "go",
    },
  };
}

function sourceAnnotationFor(range: SourceRange | undefined): EngineAnnotation {
  if (range === undefined) {
    return missingTarget();
  }

  return {
    id: "annotation:source-range",
    target: {
      kind: "source",
      range,
    },
    payload: {
      ownedByCaller: true,
      signal: "source",
    },
  };
}

function missingNodeTarget(): EngineTarget {
  return {
    kind: "node",
    id: "node:missing",
    path: [999],
    nodeType: "paragraph",
  };
}

function malformedNodeAnnotation(target: EngineTarget | undefined): EngineAnnotation {
  if (target === undefined) {
    return missingTarget();
  }

  return {
    id: "annotation:malformed-node-target",
    target: {
      kind: "node",
      target: {
        ...target,
        kind: "source",
      },
    },
    payload: {
      ownedByCaller: true,
      signal: "malformed",
    },
  };
}

function malformedSourceAnnotation(): EngineAnnotation {
  return {
    id: "annotation:malformed-source-target",
    target: {
      kind: "source",
    } as EngineAnnotation["target"],
    payload: {
      ownedByCaller: true,
      signal: "malformed-source",
    },
  };
}

function invalidRange(): SourceRange {
  return {
    start: { line: 4, column: 1 },
    end: { line: 3, column: 1 },
  };
}

function nonFiniteRanges(): SourceRange[] {
  return [
    {
      start: { line: Number.NaN, column: 1 },
      end: { line: 1, column: 2 },
    },
    {
      start: { line: 1, column: Number.POSITIVE_INFINITY },
      end: { line: 1, column: 2 },
    },
    {
      start: { line: 1, column: 1, offset: Number.NEGATIVE_INFINITY },
      end: { line: 1, column: 2, offset: 1 },
    },
  ];
}
