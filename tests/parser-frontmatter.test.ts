import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
} from "../src/index.js";
import type { EngineDocument, EngineNode, SourceRange } from "../src/index.js";
import {
  cyclicYamlAliasDiagnostic,
  nonFiniteNumberDiagnostic,
  nonStringYamlKeyDiagnostic,
  unsupportedJsonValueDiagnostic,
  yamlIssueToDiagnostic,
  yamlMaterializationDiagnostic,
  yamlNodeRange,
} from "../src/frontmatter/yaml-diagnostics.js";

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
    expect(Object.keys(result).sort()).toEqual(["diagnostics", "parsed"]);
    expect(Object.keys(result.parsed).sort()).toEqual([
      "body",
      "diagnostics",
      "document",
      "frontmatter",
      "markdown",
    ]);
    expect(result.parsed.frontmatter).not.toHaveProperty("contents");
    expect(result.parsed.frontmatter).not.toHaveProperty("items");
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

  it("maps YAML diagnostics to stable fallback and source ranges", () => {
    const fallbackRange = sourceRange(1, 1, 0, 1, 6, 5);
    const diagnosticRange = sourceRange(8, 1, 102, 8, 2, 104);

    expect(
      yamlIssueToDiagnostic(
        { message: 42, pos: "bad" },
        "frontmatter.yaml.invalid",
        "error",
        "title: ok",
        { line: 7, column: 1, offset: 100 },
        fallbackRange,
      ),
    ).toEqual({
      code: "frontmatter.yaml.invalid",
      message: "YAML frontmatter could not be parsed.",
      severity: "error",
      sourceRange: fallbackRange,
    });
    expect(
      yamlIssueToDiagnostic(
        { message: "YAML range warning", pos: [2, 4] },
        "frontmatter.yaml.warning",
        "warning",
        "a\r\nbc",
        { line: 7, column: 1, offset: 100 },
        fallbackRange,
      ),
    ).toEqual({
      code: "frontmatter.yaml.warning",
      message: "YAML range warning",
      severity: "warning",
      sourceRange: diagnosticRange,
    });
    expect(yamlMaterializationDiagnostic("opaque", fallbackRange)).toEqual({
      code: "frontmatter.yaml.invalid",
      message: "YAML frontmatter could not be parsed.",
      severity: "error",
      sourceRange: fallbackRange,
    });
    expect(nonStringYamlKeyDiagnostic(fallbackRange).message).toBe(
      "YAML frontmatter mapping keys must be strings.",
    );
    expect(nonFiniteNumberDiagnostic(fallbackRange).message).toContain(
      "non-finite numbers",
    );
    expect(unsupportedJsonValueDiagnostic(fallbackRange).message).toContain(
      "not JSON-safe",
    );
    expect(cyclicYamlAliasDiagnostic(fallbackRange).message).toContain(
      "cyclic alias",
    );
    expect(yamlNodeRange({}, "title: ok", { line: 1, column: 1 })).toBeUndefined();
  });

  it("remaps BOM plus CRLF frontmatter source positions to original offsets", () => {
    const markdown = "\uFEFF---\r\ntitle: CRLF\r\n---\r\n# Body\r\n";
    const result = parse(markdown);
    const normalized = normalize(result.parsed, { documentVersion: "1.0.0" });
    const heading = normalized.document.children[0];

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.frontmatter).toEqual({
      title: "CRLF",
    });
    expect(result.parsed.body).toBe("# Body\r\n");
    expect(result.parsed.document.children[0]).toMatchObject({
      type: "heading",
      text: "Body",
      sourceRange: {
        start: {
          line: 4,
          column: 1,
          offset: 24,
        },
        end: {
          line: 4,
          column: 7,
          offset: 30,
        },
      },
    });
    expect(heading?.target).toBeDefined();
    expect(
      heading?.target === undefined
        ? undefined
        : documentQueries.sourceSlice(normalized.document, heading.target),
    ).toEqual({
      range: {
        start: {
          line: 4,
          column: 1,
          offset: 24,
        },
        end: {
          line: 4,
          column: 7,
          offset: 30,
        },
      },
      text: "# Body",
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

  it("uses YAML 1.2 core scalar resolution for frontmatter values", () => {
    const result = parse(`---
truthyWord: yes
falsyWord: no
onWord: on
offWord: off
trueValue: true
falseValue: false
nullValue: null
tildeValue: ~
numberValue: 42
---
# Body
`);

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.frontmatter).toEqual({
      truthyWord: "yes",
      falsyWord: "no",
      onWord: "on",
      offWord: "off",
      trueValue: true,
      falseValue: false,
      nullValue: null,
      tildeValue: null,
      numberValue: 42,
    });
    expect(JSON.stringify(result.parsed.frontmatter)).toBe(
      '{"truthyWord":"yes","falsyWord":"no","onWord":"on","offWord":"off","trueValue":true,"falseValue":false,"nullValue":null,"tildeValue":null,"numberValue":42}',
    );
  });

  it("rejects duplicate YAML mapping keys", () => {
    const result = parse(`---
title: First
title: Second
---
# Body
`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message: expect.stringContaining("Map keys must be unique"),
      }),
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
  });

  it("rejects multi-document YAML frontmatter instead of ignoring later documents", () => {
    const result = parse(`---
title: First
...
title: Second
---
# Body
`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message: expect.stringContaining("Source contains multiple documents"),
      }),
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
  });

  it("rejects non-string YAML mapping keys before JavaScript key coercion", () => {
    const result = parse(`---
1: one
---
# Body
`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      {
        code: "frontmatter.yaml.invalid",
        message: "YAML frontmatter mapping keys must be strings.",
        severity: "error",
        sourceRange: {
          start: {
            line: 2,
            column: 1,
            offset: 4,
          },
          end: {
            line: 2,
            column: 2,
            offset: 5,
          },
        },
      },
    ]);
  });

  it.each([
    {
      name: "boolean",
      yaml: "true: yes",
    },
    {
      name: "null",
      yaml: "null: none",
    },
    {
      name: "sequence",
      yaml: "? [not, string]\n: value",
    },
    {
      name: "mapping",
      yaml: "? {not: string}\n: value",
    },
  ])("rejects $name YAML mapping keys before JavaScript key coercion", ({ yaml }) => {
    const result = parse(`---\n${yaml}\n---\n# Body\n`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        message: "YAML frontmatter mapping keys must be strings.",
        severity: "error",
        sourceRange: expect.objectContaining({
          start: expect.objectContaining({
            line: expect.any(Number),
            column: expect.any(Number),
            offset: expect.any(Number),
          }),
          end: expect.objectContaining({
            line: expect.any(Number),
            column: expect.any(Number),
            offset: expect.any(Number),
          }),
        }),
      }),
    ]);
    expect(findNode(result.parsed.document, (node) => node.type === "heading")).toMatchObject(
      {
        text: "Body",
      },
    );
  });

  it("warns and preserves explicit YAML 1.1 known tags as JSON-safe strings", () => {
    const result = parse(`---
date: !!timestamp 2026-04-30
---
# Body
`);

    expect(result.parsed.frontmatter).toEqual({
      date: "2026-04-30",
    });
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.warning",
        severity: "warning",
        message: expect.stringContaining(
          "Unresolved tag: tag:yaml.org,2002:timestamp",
        ),
      }),
    ]);
  });

  it("rejects non-finite YAML numbers before JSON stringification can coerce them", () => {
    const result = parse(`---
value: .nan
---
# Body
`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message:
          "YAML frontmatter contains non-finite numbers, which are not JSON-safe.",
      }),
    ]);
  });

  it("does not apply YAML merge keys while preserving supported aliases", () => {
    const result = parse(`---
base: &base
  title: Base
merged:
  <<: *base
  title: Override
---
# Body
`);

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.frontmatter).toEqual({
      base: {
        title: "Base",
      },
      merged: {
        "<<": {
          title: "Base",
        },
        title: "Override",
      },
    });
    expect(JSON.stringify(result.parsed.frontmatter)).toBe(
      '{"base":{"title":"Base"},"merged":{"<<":{"title":"Base"},"title":"Override"}}',
    );
  });

  it("rejects YAML alias expansion at the configured materialization limit", () => {
    const aliases = Array.from(
      { length: 50 },
      (_value, index) => `alias${index}: *base`,
    ).join("\n");
    const result = parse(`---
base: &base Base
${aliases}
---
# Body
`);

    expect(result.parsed.frontmatter).toBeUndefined();
    expect(result.parsed.diagnostics).toEqual(result.diagnostics);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "frontmatter.yaml.invalid",
        severity: "error",
        message: expect.stringContaining("Excessive alias count"),
      }),
    ]);
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

function sourceRange(
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number,
): SourceRange {
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
