import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  type EngineDocument,
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
