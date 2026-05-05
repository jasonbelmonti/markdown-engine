import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  type EngineDocument,
  type EngineLink,
  type EngineList,
  type EngineNode,
  type EngineSection,
  type EngineTable,
  type EngineTextSpan,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/queries.md";
const snapshotPath = fileURLToPath(
  new URL(
    "../snapshots/rich-ir/wp-3-derived-view-query-fixtures.json",
    import.meta.url,
  ),
);
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/queries.md", import.meta.url),
  "utf8",
);

describe("1.0 Rich IR structural views and query helpers", () => {
  it("builds deterministic nested section views from public document IR", () => {
    const document = normalizeDraftFixture();
    const repeatedDocument = normalizeDraftFixture();
    const sections = documentQueries.sections(document);
    const repeatedSections = documentQueries.sections(repeatedDocument);

    expect(sectionSummary(sections)).toEqual(sectionSummary(repeatedSections));
    expect(sectionSummary(sections)).toEqual([
      {
        title: "Query Mission",
        depth: 1,
        parent: undefined,
        body: ["paragraph"],
        children: ["Phase Alpha", "Phase Bravo"],
      },
      {
        title: "Phase Alpha",
        depth: 2,
        parent: "Query Mission",
        body: ["paragraph"],
        children: ["Phase Alpha Details"],
      },
      {
        title: "Phase Alpha Details",
        depth: 3,
        parent: "Phase Alpha",
        body: ["paragraph", "table", "list"],
        children: [],
      },
      {
        title: "Phase Bravo",
        depth: 2,
        parent: "Query Mission",
        body: ["paragraph"],
        children: [],
      },
    ]);

    expect(documentQueries.sections(document, { depth: 2 }).map(titleOf)).toEqual(
      ["Phase Alpha", "Phase Bravo"],
    );
    expect(
      documentQueries.sections(document, { title: "Phase Alpha Details" }),
    ).toHaveLength(1);
    expect(
      documentQueries.sections(document, {
        parentSectionTargetId: sectionByTitle(document, "Phase Alpha").target.id,
      }).map(titleOf),
    ).toEqual(["Phase Alpha Details"]);
  });

  it("queries text spans, tables, lists, links, nodes, and source slices", () => {
    const document = normalizeDraftFixture();
    const paragraphs = documentQueries.nodes(document, { type: "paragraph" });
    const details = sectionByTitle(document, "Phase Alpha Details");
    const detailsSource = documentQueries.sourceSlice(document, details.target);
    const table = onlyTable(documentQueries.tables(document));
    const tableCells = table.cells;
    const lists = documentQueries.lists(document);
    const links = documentQueries.links(document);
    const firstParagraph = paragraphs[0] ?? missing();
    const orderedList = lists[0] ?? missing();
    const nestedTaskList = lists[1] ?? missing();
    const relativeLink = links[1] ?? missing();

    expect(paragraphs).toHaveLength(8);
    expect(
      documentQueries.nodes(document, {
        targetId: firstParagraph.target?.id ?? missing(),
      }),
    ).toHaveLength(1);
    expect(detailsSource?.text).toBe("### Phase Alpha Details");

    expect(
      documentQueries.textSpans(document, {
        nodeType: "paragraph",
        textIncludes: "source span text",
      }),
    ).toEqual([
      expect.objectContaining({
        text: "Paragraph with inline code, source span text, and relative link.",
      }),
    ]);

    expect(tableCells).toContainEqual(
      expect.objectContaining({
        text: "State",
        rowIndex: 0,
        columnIndex: 2,
        header: true,
      }),
    );
    expect(tableCells).toContainEqual(
      expect.objectContaining({
        text: "blocked",
        rowIndex: 2,
        columnIndex: 2,
        header: false,
      }),
    );
    expect(documentQueries.tables(document, { targetId: table.target.id })).toEqual([
      table,
    ]);

    expect(listSummary(lists)).toEqual([
      {
        ordered: true,
        itemCoordinates: [
          { itemIndex: 0, depth: 0, checked: undefined },
          { itemIndex: 1, depth: 0, checked: undefined },
        ],
      },
      {
        ordered: false,
        itemCoordinates: [
          { itemIndex: 0, depth: 1, checked: true },
          { itemIndex: 1, depth: 1, checked: false },
        ],
      },
    ]);
    expect(documentQueries.lists(document, { depth: 1 })).toEqual([
      nestedTaskList,
    ]);
    expect(documentQueries.lists(document, { ordered: true })).toEqual([
      orderedList,
    ]);

    expect(linkSummary(links)).toEqual([
      {
        text: "overview",
        url: "https://example.com/overview",
        title: "Overview",
      },
      {
        text: "relative link",
        url: "./phase-alpha.md",
        title: undefined,
      },
    ]);
    expect(documentQueries.links(document, { url: "./phase-alpha.md" })).toEqual(
      [relativeLink],
    );
    expect(documentQueries.sourceSlice(document, relativeLink.target))
      .toMatchObject({
        text: "[relative link](./phase-alpha.md)",
      });
  });

  it("records durable WP-3 derived-view and query fixture evidence", async () => {
    const baseline = queryEvidence();
    const repeatedEvidence = Array.from({ length: 10 }, () => queryEvidence());

    for (const evidence of repeatedEvidence) {
      expect(evidence).toEqual(baseline);
    }

    await expect(stableJson(baseline)).toMatchFileSnapshot(snapshotPath);
  });
});

function normalizeDraftFixture(): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0-draft",
  }).document;
}

function queryEvidence() {
  const document = normalizeDraftFixture();
  const details = sectionByTitle(document, "Phase Alpha Details");
  const relativeLink = documentQueries.links(document, {
    url: "./phase-alpha.md",
  })[0];

  return {
    fixture: fixturePath,
    sections: sectionEvidence(documentQueries.sections(document)),
    textSpans: textSpanEvidence(documentQueries.textSpans(document)),
    tables: tableEvidence(documentQueries.tables(document)),
    lists: listEvidence(documentQueries.lists(document)),
    links: linkEvidence(documentQueries.links(document)),
    queryResults: {
      phaseAlphaChildren: documentQueries
        .sections(document, {
          parentSectionTargetId: sectionByTitle(document, "Phase Alpha").target.id,
        })
        .map((section) => section.title),
      paragraphSpansWithSourceText: documentQueries
        .textSpans(document, {
          nodeType: "paragraph",
          textIncludes: "source span text",
        })
        .map((span) => span.text),
      orderedListTargets: documentQueries
        .lists(document, { ordered: true })
        .map((list) => list.target.id),
      relativeLinkTargets: documentQueries
        .links(document, { url: "./phase-alpha.md" })
        .map((link) => link.target.id),
      sectionSourceSlice: documentQueries.sourceSlice(document, details.target),
      relativeLinkSourceSlice:
        relativeLink === undefined
          ? undefined
          : documentQueries.sourceSlice(document, relativeLink.target),
    },
  };
}

function sectionEvidence(sections: readonly EngineSection[]) {
  return sections.map((section) => ({
    targetId: section.target.id,
    headingTargetId: section.headingTarget.id,
    parentSectionTargetId: section.parentSection?.id,
    depth: section.depth,
    title: section.title,
    bodyTargetIds: section.bodyTargets.map((target) => target.id),
    childSectionTargetIds: section.childSections.map((target) => target.id),
  }));
}

function textSpanEvidence(spans: readonly EngineTextSpan[]) {
  return spans.map((span) => ({
    targetId: span.target.id,
    nodeType: span.target.nodeType,
    text: span.text,
    sourceRange: span.sourceRange,
  }));
}

function tableEvidence(tables: readonly EngineTable[]) {
  return tables.map((table) => ({
    targetId: table.target.id,
    cells: table.cells.map((cell) => ({
      targetId: cell.target.id,
      text: cell.text,
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      header: cell.header,
      sourceRange: cell.sourceRange,
    })),
  }));
}

function listEvidence(lists: readonly EngineList[]) {
  return lists.map((list) => ({
    targetId: list.target.id,
    ordered: list.ordered,
    start: list.start,
    items: list.items.map((item) => ({
      targetId: item.target.id,
      itemIndex: item.itemIndex,
      depth: item.depth,
      checked: item.checked,
      sourceRange: item.sourceRange,
    })),
  }));
}

function linkEvidence(links: readonly EngineLink[]) {
  return links.map((link) => ({
    targetId: link.target.id,
    url: link.url,
    text: link.text,
    title: link.title,
    sourceRange: link.sourceRange,
  }));
}

function sectionSummary(sections: readonly EngineSection[]) {
  return sections.map((section) => ({
    title: section.title,
    depth: section.depth,
    parent:
      section.parentSection === undefined
        ? undefined
        : sections.find((parent) => parent.target.id === section.parentSection?.id)
            ?.title,
    body: section.bodyTargets.map((target) => target.nodeType),
    children: section.childSections.map(
      (target) =>
        sections.find((child) => child.target.id === target.id)?.title ?? missing(),
    ),
  }));
}

function listSummary(lists: readonly EngineList[]) {
  return lists.map((list) => ({
    ordered: list.ordered,
    itemCoordinates: list.items.map((item) => ({
      itemIndex: item.itemIndex,
      depth: item.depth,
      checked: item.checked,
    })),
  }));
}

function linkSummary(links: readonly EngineLink[]) {
  return links.map((link) => ({
    text: link.text,
    url: link.url,
    title: link.title,
  }));
}

function sectionByTitle(document: EngineDocument, title: string): EngineSection {
  return documentQueries.sections(document, { title })[0] ?? missing();
}

function onlyTable(tables: readonly EngineTable[]): EngineTable {
  if (tables.length !== 1 || tables[0] === undefined) {
    return missing();
  }

  return tables[0];
}

function titleOf(section: EngineSection): string {
  return section.title;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function missing(): never {
  throw new Error("Expected query fixture value to be present.");
}
