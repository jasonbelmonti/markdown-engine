import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { normalize, parse, serialize } from "../src/index.js";
import type { EngineNode } from "../src/index.js";

import {
  CMARK_GFM_OPTIONS,
  cmark,
  cmarkComparisonCases,
  cmarkComparisonSnapshot,
} from "./support/cmark-gfm-support.js";
import {
  documentForFixture,
  findNode,
  findNodes,
  fixturePath,
  parseFixture,
  parserFixtureFiles,
  readFixture,
  snapshotRoot,
  stableJson,
} from "./support/parser-fixture-support.js";

describe("WP-3 parser/frontmatter fixture corpus", () => {
  it("VAL-1/VAL-2: parses at least 30 representative GFM/frontmatter fixtures", () => {
    const fixtureFiles = parserFixtureFiles();

    expect(fixtureFiles.length).toBeGreaterThanOrEqual(30);

    for (const file of fixtureFiles) {
      const result = parse(readFixture(file), { path: fixturePath(file) });
      const normalized = normalize(result.parsed);

      expect(result.diagnostics, file).toEqual([]);
      expect(normalized.diagnostics, file).toEqual([]);
      expect(normalized.document.kind, file).toBe("markdown-document");
      expect(JSON.stringify(normalized.document), file).not.toContain(
        '"position"',
      );
    }
  });

  it("VAL-1/VAL-3: preserves representative GFM semantics in engine-owned IR", () => {
    expectFixtureNode("01-atx-heading.md", "heading").toMatchObject({
      text: "Launch Plan",
      attributes: { depth: 1 },
    });
    expectFixtureNode("02-setext-heading.md", "heading").toMatchObject({
      text: "Launch Plan",
      attributes: { depth: 1 },
    });
    expectFixtureNode("04-thematic-break.md", "thematicBreak").toBeDefined();
    expectFixtureNode("05-blockquote-nested.md", "blockquote").toBeDefined();
    expectFixtureNode("07-ordered-list.md", "list").toMatchObject({
      attributes: { ordered: true, start: 3, spread: false },
    });
    expectFixtureNode("09-task-list-checked.md", "listItem", (node) =>
      node.attributes?.checked === true,
    ).toMatchObject({ attributes: { checked: true } });
    expectFixtureNode("10-task-list-unchecked.md", "listItem", (node) =>
      node.attributes?.checked === false,
    ).toMatchObject({ attributes: { checked: false } });
    expectFixtureNode("11-fenced-code-info-meta.md", "code").toMatchObject({
      text: 'export const phase = "wp-3";',
      attributes: { kind: "fenced", lang: "ts", meta: "mission" },
    });
    expectFixtureNode("12-indented-code.md", "code").toMatchObject({
      attributes: { kind: "indented" },
    });
    expectFixtureNode("15-strikethrough.md", "delete").toBeDefined();
    expectFixtureNode("16-inline-link-title.md", "link").toMatchObject({
      text: "Markdown Engine",
      attributes: {
        title: "Engine docs",
        url: "https://example.com/engine",
      },
    });
    expectFixtureNode("17-autolink-literal.md", "link").toMatchObject({
      text: "https://example.com/mission",
      attributes: { url: "https://example.com/mission" },
    });
    expectFixtureNode("18-reference-link.md", "linkReference").toMatchObject({
      text: "the contract",
      attributes: {
        identifier: "contract",
        label: "contract",
        referenceType: "full",
      },
    });
    expectFixtureNode("18-reference-link.md", "definition").toMatchObject({
      attributes: {
        identifier: "contract",
        label: "contract",
        title: "Contract",
        url: "https://example.com/contract",
      },
    });
    expectFixtureNode("19-image.md", "image").toMatchObject({
      attributes: {
        alt: "Engine diagram",
        title: "Diagram",
        url: "https://example.com/engine.png",
      },
    });
    expectFixtureNode("20-table-alignment.md", "table").toMatchObject({
      attributes: { align: ["left", "center", "right"] },
    });
    expectFixtureNode("21-raw-html-block.md", "html").toMatchObject({
      text:
        '<section data-engine="inert">\n' +
        "  <strong>Raw HTML data</strong>\n" +
        "</section>",
    });
    expect(
      findNodes(documentForFixture("22-raw-html-inline.md"), "html"),
    ).toHaveLength(2);
    expectFixtureNode("24-hard-break.md", "break").toBeDefined();
    expectFixtureNode("26-footnote.md", "footnoteReference").toMatchObject({
      attributes: { identifier: "1", label: "1" },
    });
    expectFixtureNode("26-footnote.md", "footnoteDefinition").toMatchObject({
      attributes: { identifier: "1", label: "1" },
    });
  });

  it("VAL-1: selected cmark-gfm comparison cases match the oracle and engine IR", () => {
    expect(cmark.version()).toBe("0.29.0.gfm.0");

    for (const comparisonCase of cmarkComparisonCases) {
      const markdown = readFixture(comparisonCase.file);
      const cmarkHtml = cmark.renderHtmlSync(markdown, CMARK_GFM_OPTIONS);

      expect(cmarkHtml, comparisonCase.file).toBe(
        comparisonCase.expectedHtml,
      );
      comparisonCase.assertEngine(documentForFixture(comparisonCase.file));
    }
  });

  it("VAL-2: frontmatter fixtures preserve JSON-safe public values", () => {
    expect(parseFixture("27-frontmatter-basic.md").parsed.frontmatter).toEqual({
      owner: "markdown-engine",
      title: "Basic frontmatter",
    });
    expect(parseFixture("28-frontmatter-empty.md").parsed.frontmatter).toEqual(
      {},
    );
    expect(parseFixture("29-frontmatter-nested.md").parsed.frontmatter).toEqual({
      owners: {
        backup: "validation",
        primary: "engine",
      },
      tags: ["parser", "ir"],
      title: "Nested frontmatter",
    });
    expect(parseFixture("30-frontmatter-scalars.md").parsed.frontmatter).toEqual(
      {
        active: true,
        count: 3,
        emptyValue: null,
        truthyWord: "yes",
      },
    );
  });

  it("VAL-3/VAL-6: records IR and diagnostic snapshots for review", async () => {
    await expect(
      serialize(normalize(parseFixture("20-table-alignment.md").parsed), {
        pretty: true,
      }),
    ).toMatchFileSnapshot(join(snapshotRoot, "ir/table-alignment.json"));
    await expect(
      serialize(normalize(parseFixture("21-raw-html-block.md").parsed), {
        pretty: true,
      }),
    ).toMatchFileSnapshot(join(snapshotRoot, "ir/raw-html-block.json"));
    await expect(
      serialize(normalize(parseFixture("29-frontmatter-nested.md").parsed), {
        pretty: true,
      }),
    ).toMatchFileSnapshot(join(snapshotRoot, "ir/frontmatter-nested.json"));
    await expect(
      stableJson(
        parse("---\ntitle: First\ntitle: Second\n---\n# Body\n")
          .diagnostics,
      ),
    ).toMatchFileSnapshot(
      join(snapshotRoot, "diagnostics/frontmatter-duplicate-key.json"),
    );
    await expect(stableJson(cmarkComparisonSnapshot())).toMatchFileSnapshot(
      join(snapshotRoot, "cmark-gfm/selected-comparison-output.json"),
    );
  });
});

function expectFixtureNode(
  file: string,
  type: string,
  predicate: (node: EngineNode) => boolean = () => true,
) {
  return expect(findNode(documentForFixture(file), type, predicate));
}
