import { createRequire } from "node:module";
import { expect } from "vitest";

import type { EngineDocument } from "markdown-engine";

import {
  documentForFixture,
  findNode,
  findNodes,
  flattenNodes,
  readFixture,
} from "./parser-fixture-support.js";

interface CmarkGfm {
  renderHtmlSync(markdown: string, options?: unknown): string;
  version(): string;
}

type EngineAssertion = (document: EngineDocument) => void;

export interface CmarkComparisonCase {
  file: string;
  expectedHtml: string;
  assertEngine: EngineAssertion;
}

const require = createRequire(import.meta.url);

export const cmark = require("cmark-gfm") as CmarkGfm;

export const CMARK_GFM_OPTIONS = {
  unsafe: true,
  footnotes: true,
  extensions: {
    autolink: true,
    strikethrough: true,
    table: true,
    tagfilter: true,
    tasklist: true,
  },
};

export const cmarkComparisonCases: CmarkComparisonCase[] = [
  {
    file: "09-task-list-checked.md",
    expectedHtml:
      '<ul>\n' +
      '<li><input type="checkbox" checked="" disabled="" /> Confirm parser adapter</li>\n' +
      '<li><input type="checkbox" disabled="" /> Keep second item open</li>\n' +
      "</ul>\n",
    assertEngine: (document) => {
      expect(findNodes(document, "listItem").map((node) => node.attributes)).toEqual(
        [{ checked: true, spread: false }, { checked: false, spread: false }],
      );
    },
  },
  {
    file: "11-fenced-code-info-meta.md",
    expectedHtml:
      '<pre><code class="language-ts">export const phase = &quot;wp-3&quot;;\n' +
      "</code></pre>\n",
    assertEngine: (document) => {
      expect(findNode(document, "code")).toMatchObject({
        text: 'export const phase = "wp-3";',
        attributes: { lang: "ts", meta: "mission" },
      });
    },
  },
  {
    file: "15-strikethrough.md",
    expectedHtml: "<p>Keep <del>obsolete</del> active text.</p>\n",
    assertEngine: (document) => {
      expect(findNode(document, "delete")).toBeDefined();
    },
  },
  {
    file: "16-inline-link-title.md",
    expectedHtml:
      '<p><a href="https://example.com/engine" title="Engine docs">Markdown Engine</a></p>\n',
    assertEngine: (document) => {
      expect(findNode(document, "link")).toMatchObject({
        text: "Markdown Engine",
        attributes: {
          title: "Engine docs",
          url: "https://example.com/engine",
        },
      });
    },
  },
  {
    file: "17-autolink-literal.md",
    expectedHtml:
      '<p>Visit <a href="https://example.com/mission">https://example.com/mission</a> for details.</p>\n',
    assertEngine: (document) => {
      expect(findNode(document, "link")).toMatchObject({
        text: "https://example.com/mission",
        attributes: { url: "https://example.com/mission" },
      });
    },
  },
  {
    file: "20-table-alignment.md",
    expectedHtml:
      "<table>\n" +
      "<thead>\n" +
      "<tr>\n" +
      '<th align="left">Phase</th>\n' +
      '<th align="center">Owner</th>\n' +
      '<th align="right">Status</th>\n' +
      "</tr>\n" +
      "</thead>\n" +
      "<tbody>\n" +
      "<tr>\n" +
      '<td align="left">WP-3</td>\n' +
      '<td align="center">engine</td>\n' +
      '<td align="right">active</td>\n' +
      "</tr>\n" +
      "</tbody>\n" +
      "</table>\n",
    assertEngine: (document) => {
      expect(findNode(document, "table")).toMatchObject({
        attributes: { align: ["left", "center", "right"] },
      });
    },
  },
  {
    file: "21-raw-html-block.md",
    expectedHtml:
      '<section data-engine="inert">\n' +
      "  <strong>Raw HTML data</strong>\n" +
      "</section>\n",
    assertEngine: (document) => {
      expect(findNode(document, "html")).toMatchObject({
        text:
          '<section data-engine="inert">\n' +
          "  <strong>Raw HTML data</strong>\n" +
          "</section>",
      });
    },
  },
  {
    file: "26-footnote.md",
    expectedHtml:
      '<p>Footnote callout<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup>.</p>\n' +
      '<section class="footnotes">\n' +
      "<ol>\n" +
      '<li id="fn1">\n' +
      '<p>Footnote body. <a href="#fnref1" class="footnote-backref">' +
      "\u21A9" +
      "</a></p>\n" +
      "</li>\n" +
      "</ol>\n" +
      "</section>\n",
    assertEngine: (document) => {
      expect(findNode(document, "footnoteReference")).toMatchObject({
        attributes: { identifier: "1", label: "1" },
      });
      expect(findNode(document, "footnoteDefinition")).toMatchObject({
        attributes: { identifier: "1", label: "1" },
      });
    },
  },
];

export function cmarkComparisonSnapshot(): Array<{
  cmarkHtml: string;
  engineNodeTypes: string[];
  file: string;
}> {
  return cmarkComparisonCases.map((comparisonCase) => {
    const markdown = readFixture(comparisonCase.file);
    const document = documentForFixture(comparisonCase.file);

    return {
      cmarkHtml: cmark.renderHtmlSync(markdown, CMARK_GFM_OPTIONS),
      engineNodeTypes: flattenNodes(document.children).map((node) => node.type),
      file: comparisonCase.file,
    };
  });
}
