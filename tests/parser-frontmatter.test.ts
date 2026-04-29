import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parse } from "markdown-engine";
import type { EngineDocument, EngineNode } from "markdown-engine";

const fixture = readFileSync(
  new URL("../fixtures/representative.md", import.meta.url),
  "utf8",
);

describe("parser and frontmatter adapters", () => {
  it("VAL-1: maps representative GFM constructs to engine-owned document nodes", () => {
    const result = parse(fixture, {
      path: "fixtures/representative.md",
    });
    const document = result.parsed.document;

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(document).toMatchObject({
      kind: "markdown-document",
      version: "0.0.0",
      path: "fixtures/representative.md",
    });
    expect(document.children[0]).toMatchObject({
      type: "heading",
      text: "Mission Brief",
    });

    const heading = findNode(document, (node) => node.type === "heading");
    const link = findNode(document, (node) => node.type === "link");
    const taskItem = findNode(
      document,
      (node) => node.type === "listItem" && node.attributes?.checked === true,
    );
    const code = findNode(document, (node) => node.type === "code");
    const html = findNode(document, (node) => node.type === "html");

    expect(heading).toMatchObject({
      type: "heading",
      text: "Mission Brief",
      attributes: { depth: 1 },
      sourceRange: {
        start: { line: 10, column: 1, offset: expect.any(Number) },
      },
    });
    expect(link).toMatchObject({
      type: "link",
      text: "markdown-engine",
      attributes: { url: "https://example.com/markdown-engine" },
    });
    expect(taskItem).toMatchObject({
      type: "listItem",
      attributes: { checked: true },
    });
    expect(code).toMatchObject({
      type: "code",
      text: 'export const signal = "go";',
      attributes: { lang: "ts" },
    });
    expect(html).toMatchObject({
      type: "html",
      text: '<div data-engine="inert">Raw HTML data</div>',
    });
    expect(JSON.stringify(document)).not.toContain('"position"');
  });

  it("VAL-2: parses representative YAML frontmatter into structured data", () => {
    const result = parse(fixture);

    expect(result.parsed.frontmatter).toEqual({
      title: "Representative parser fixture",
      status: "draft",
      tags: ["parser", "frontmatter"],
      owner: "markdown-engine",
    });
    expect(result.parsed.document.frontmatter).toEqual(result.parsed.frontmatter);
    expect(result.parsed.body).not.toContain("title: Representative parser fixture");
  });

  it("VAL-2: handles absent and empty YAML frontmatter", () => {
    const absent = parse("# Body\n");
    const empty = parse("---\n---\n# Body\n");

    expect(absent.diagnostics).toEqual([]);
    expect(absent.parsed.frontmatter).toBeUndefined();
    expect(absent.parsed.document.frontmatter).toBeUndefined();
    expect(absent.parsed.document.children[0]).toMatchObject({
      type: "heading",
      text: "Body",
    });

    expect(empty.diagnostics).toEqual([]);
    expect(empty.parsed.frontmatter).toEqual({});
    expect(empty.parsed.document.frontmatter).toEqual({});
    expect(empty.parsed.document.children[0]).toMatchObject({
      type: "heading",
      text: "Body",
    });
  });

  it("strips a leading BOM before frontmatter and body parsing", () => {
    const withFrontmatter = parse("\uFEFF---\ntitle: BOM\n---\n# Body\n");
    const plainMarkdown = parse("\uFEFF# Body\n");

    expect(withFrontmatter.diagnostics).toEqual([]);
    expect(withFrontmatter.parsed.frontmatter).toEqual({
      title: "BOM",
    });
    expect(withFrontmatter.parsed.body).toBe("# Body\n");
    expect(withFrontmatter.parsed.document.children[0]).toMatchObject({
      type: "heading",
      text: "Body",
      sourceRange: {
        start: {
          line: 4,
          column: 1,
          offset: 20,
        },
      },
    });

    expect(plainMarkdown.diagnostics).toEqual([]);
    expect(plainMarkdown.parsed.frontmatter).toBeUndefined();
    expect(plainMarkdown.parsed.body).toBe("# Body\n");
    expect(plainMarkdown.parsed.document.children[0]).toMatchObject({
      type: "heading",
      text: "Body",
      sourceRange: {
        start: {
          line: 1,
          column: 1,
          offset: 1,
        },
      },
    });
  });

  it("keeps empty body source ranges at EOF when frontmatter closes the file", () => {
    const markdown = "---\ntitle: Bodyless\n---";
    const result = parse(markdown);

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.body).toBe("");
    expect(result.parsed.frontmatter).toEqual({
      title: "Bodyless",
    });
    expect(result.parsed.document.sourceRange).toEqual({
      start: {
        line: 3,
        column: 4,
        offset: markdown.length,
      },
      end: {
        line: 3,
        column: 4,
        offset: markdown.length,
      },
    });
  });

  it("returns structured diagnostics for invalid YAML frontmatter", () => {
    const result = parse("---\ntitle: [unterminated\n---\n# Body\n");

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message: expect.any(String),
        sourceRange: {
          start: {
            line: expect.any(Number),
            column: expect.any(Number),
            offset: expect.any(Number),
          },
          end: {
            line: expect.any(Number),
            column: expect.any(Number),
            offset: expect.any(Number),
          },
        },
      }),
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
  });

  it("returns structured diagnostics for YAML materialization failures", () => {
    const result = parse("---\na: *missing\n---\n# Body\n");

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message: expect.stringContaining("Unresolved alias"),
        sourceRange: {
          start: {
            line: 1,
            column: 1,
            offset: 0,
          },
          end: {
            line: 3,
            column: 4,
            offset: expect.any(Number),
          },
        },
      }),
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
  });

  it("returns structured diagnostics for cyclic YAML aliases", () => {
    const result = parse("---\na: &a\n  self: *a\n---\n# Body\n");

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      {
        code: "frontmatter.yaml.invalid",
        message:
          "YAML frontmatter contains cyclic alias references, which are not supported.",
        severity: "error",
        sourceRange: {
          start: {
            line: 1,
            column: 1,
            offset: 0,
          },
          end: {
            line: 4,
            column: 4,
            offset: 24,
          },
        },
      },
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it("does not reuse mutable source positions across parse calls", () => {
    const invalid = parse("---\na: *missing\n---\n# Body\n");
    const diagnosticStart = invalid.diagnostics[0]?.sourceRange?.start;

    if (diagnosticStart === undefined) {
      throw new Error("Expected YAML diagnostic source range.");
    }

    diagnosticStart.line = 99;
    diagnosticStart.column = 99;
    diagnosticStart.offset = 99;

    const later = parse("# Later\n");

    expect(later.parsed.document.sourceRange?.start).toEqual({
      line: 1,
      column: 1,
      offset: 0,
    });
    expect(later.parsed.document.children[0]?.sourceRange?.start).toEqual({
      line: 1,
      column: 1,
      offset: 0,
    });
  });

  it("treats top-of-file thematic breaks without closing frontmatter as Markdown", () => {
    const markdown = "---\n# Heading\n";
    const result = parse(markdown);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.body).toBe(markdown);
    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.document.children[0]).toMatchObject({
      type: "thematicBreak",
    });
    expect(result.parsed.document.children[1]).toMatchObject({
      type: "heading",
      text: "Heading",
    });
  });
});

function findNode(
  document: EngineDocument,
  predicate: (node: EngineNode) => boolean,
): EngineNode | undefined {
  const queue = [...document.children];

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === undefined) {
      continue;
    }

    if (predicate(node)) {
      return node;
    }

    queue.push(...(node.children ?? []));
  }

  return undefined;
}
