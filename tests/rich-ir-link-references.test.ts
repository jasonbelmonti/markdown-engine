import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  serialize,
  type EngineDocument,
  type EngineLink,
  type EngineLinkReference,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/link-references.md";
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/link-references.md", import.meta.url),
  "utf8",
);

describe("1.0 Rich IR link reference views", () => {
  it("exposes URL-bearing link-like references through an additive public view", () => {
    const document = normalizeFixture();
    const linkReferences = documentQueries.linkReferences(document);
    const contractDefinition =
      documentQueries.linkReferences(document, {
        kind: "definition",
        identifier: "contract-ref",
      })[0] ?? missing();
    const diagramImage =
      documentQueries.linkReferences(document, {
        kind: "image",
        alt: "Diagram",
      })[0] ?? missing();
    const contractUsages = documentQueries.linkReferences(document, {
      definitionTargetId: contractDefinition.target.id,
    });
    const serialized = serialize(document, { pretty: true });
    const repeatedSerializations = Array.from({ length: 10 }, () =>
      serialize(normalizeFixture(), { pretty: true }),
    );

    expect(linkSummary(documentQueries.links(document))).toEqual([
      {
        text: "docs",
        url: "https://example.com/docs",
        title: "Docs",
      },
    ]);
    expect(linkReferenceSummary(linkReferences)).toEqual([
      {
        kind: "link",
        url: "https://example.com/docs",
        title: "Docs",
        text: "docs",
        alt: undefined,
        label: undefined,
        identifier: undefined,
        referenceType: undefined,
        definitionIdentifier: undefined,
        hasSourceRange: true,
      },
      {
        kind: "image",
        url: "./diagram.png",
        title: "Diagram",
        text: undefined,
        alt: "Diagram",
        label: undefined,
        identifier: undefined,
        referenceType: undefined,
        definitionIdentifier: undefined,
        hasSourceRange: true,
      },
      {
        kind: "linkReference",
        url: "https://example.com/contract",
        title: "Contract",
        text: "contract",
        alt: undefined,
        label: "contract-ref",
        identifier: "contract-ref",
        referenceType: "full",
        definitionIdentifier: "contract-ref",
        hasSourceRange: true,
      },
      {
        kind: "imageReference",
        url: "./architecture.png",
        title: "Architecture",
        text: undefined,
        alt: "Architecture",
        label: "diagram-ref",
        identifier: "diagram-ref",
        referenceType: "full",
        definitionIdentifier: "diagram-ref",
        hasSourceRange: true,
      },
      {
        kind: "linkReference",
        url: "https://example.com/contract",
        title: "Contract",
        text: "contract-ref",
        alt: undefined,
        label: "contract-ref",
        identifier: "contract-ref",
        referenceType: "collapsed",
        definitionIdentifier: "contract-ref",
        hasSourceRange: true,
      },
      {
        kind: "linkReference",
        url: "./architecture.png",
        title: "Architecture",
        text: "diagram-ref",
        alt: undefined,
        label: "diagram-ref",
        identifier: "diagram-ref",
        referenceType: "collapsed",
        definitionIdentifier: "diagram-ref",
        hasSourceRange: true,
      },
      {
        kind: "definition",
        url: "https://example.com/contract",
        title: "Contract",
        text: undefined,
        alt: undefined,
        label: "contract-ref",
        identifier: "contract-ref",
        referenceType: undefined,
        definitionIdentifier: undefined,
        hasSourceRange: true,
      },
      {
        kind: "definition",
        url: "./architecture.png",
        title: "Architecture",
        text: undefined,
        alt: undefined,
        label: "diagram-ref",
        identifier: "diagram-ref",
        referenceType: undefined,
        definitionIdentifier: undefined,
        hasSourceRange: true,
      },
    ]);
    expect(contractUsages.map((reference) => reference.text)).toEqual([
      "contract",
      "contract-ref",
    ]);
    expect(
      documentQueries.linkReferences(document, {
        kind: "imageReference",
        referenceType: "full",
        url: "./architecture.png",
      }).map((reference) => reference.alt),
    ).toEqual(["Architecture"]);
    expect(documentQueries.sourceSlice(document, diagramImage.target)?.text).toBe(
      '![Diagram](./diagram.png "Diagram")',
    );
    expect(repeatedSerializations).toEqual(Array(10).fill(serialized));
  });
});

function normalizeFixture(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0",
  }).document;
}

function linkSummary(links: readonly EngineLink[]) {
  return links.map((link) => ({
    text: link.text,
    url: link.url,
    title: link.title,
  }));
}

function linkReferenceSummary(references: readonly EngineLinkReference[]) {
  const definitionsByTargetId = new Map(
    references
      .filter((reference) => reference.kind === "definition")
      .map((definition) => [definition.target.id, definition.identifier]),
  );

  return references.map((reference) => ({
    kind: reference.kind,
    url: reference.url,
    title: reference.title,
    text: reference.text,
    alt: reference.alt,
    label: reference.label,
    identifier: reference.identifier,
    referenceType: reference.referenceType,
    definitionIdentifier:
      reference.definitionTarget === undefined
        ? undefined
        : definitionsByTargetId.get(reference.definitionTarget.id),
    hasSourceRange: reference.sourceRange !== undefined,
  }));
}

function missing(): never {
  throw new Error("Expected link reference fixture value to be present.");
}
