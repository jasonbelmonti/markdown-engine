import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";
import { isMap, parseDocument } from "yaml";

import { parse } from "@jasonbelmonti/markdown-engine";
import {
  yamlIssueToDiagnostic,
  yamlNodeRange,
  yamlNodeRangeFromIndex,
} from "../src/frontmatter/yaml-diagnostics.js";
import { createYamlSourcePositionIndex } from "../src/frontmatter/yaml-source-positions.js";

describe("YAML source position indexing", () => {
  it("preserves offsets and columns across LF, CRLF, and lone CR newlines", () => {
    const positions = createYamlSourcePositionIndex("a\r\nb\rc\nd", {
      line: 2,
      column: 3,
      offset: 4,
    });

    expect(
      Array.from({ length: 9 }, (_value, offset) => positions.position(offset)),
    ).toEqual([
      { line: 2, column: 3, offset: 4 },
      { line: 2, column: 4, offset: 5 },
      { line: 3, column: 1, offset: 6 },
      { line: 3, column: 1, offset: 7 },
      { line: 3, column: 2, offset: 8 },
      { line: 4, column: 1, offset: 9 },
      { line: 4, column: 2, offset: 10 },
      { line: 5, column: 1, offset: 11 },
      { line: 5, column: 2, offset: 12 },
    ]);
  });

  it("preserves the raw-text diagnostic adapter and fallback contract", () => {
    const fallbackRange = {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 6, offset: 5 },
    };

    expect(
      yamlIssueToDiagnostic(
        { message: 42, pos: "bad" },
        "frontmatter.yaml.invalid",
        "error",
        "title: ok",
        { line: 7, column: 1, offset: 100 },
        fallbackRange,
      ),
    ).toMatchObject({
      message: "YAML frontmatter could not be parsed.",
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
      ).sourceRange,
    ).toEqual({
      start: { line: 8, column: 1, offset: 102 },
      end: { line: 8, column: 2, offset: 104 },
    });
  });

  it("preserves the raw-text node-range adapter for valid YAML nodes", () => {
    const raw = "title: ok";
    const key = mappingKey(raw, 0);

    expect(
      yamlNodeRange(key, raw, { line: 7, column: 3, offset: 100 }),
    ).toEqual({
      start: { line: 7, column: 3, offset: 100 },
      end: { line: 7, column: 8, offset: 105 },
    });
  });

  it("maps valid node ranges through a reusable source position index", () => {
    const raw = "title: ok\r\nsecond: value";
    const key = mappingKey(raw, 1);
    const sourcePositions = createYamlSourcePositionIndex(raw, {
      line: 7,
      column: 3,
      offset: 100,
    });

    expect(yamlNodeRangeFromIndex(key, sourcePositions)).toEqual({
      start: { line: 8, column: 1, offset: 111 },
      end: { line: 8, column: 7, offset: 117 },
    });
  });

  it(
    "bounds source mapping work for large invalid-key diagnostic sets",
    () => {
      const keyCount = 12_000;
      const yaml = Array.from(
        { length: keyCount },
        (_value, index) => `${index}: value`,
      ).join("\n");
      const startedAt = performance.now();
      const result = parse(`---\n${yaml}\n---\n# Body\n`);
      const elapsedMs = performance.now() - startedAt;

      expect(result.diagnostics).toHaveLength(keyCount);
      expect(result.parsed.frontmatter).toBeUndefined();
      expect(elapsedMs).toBeLessThan(3_000);
    },
    8_000,
  );
});

function mappingKey(raw: string, index: number): unknown {
  const document = parseDocument(raw);

  if (!isMap(document.contents)) {
    throw new Error("Expected a YAML mapping document.");
  }

  const key = document.contents.items[index]?.key;
  if (key === undefined) {
    throw new Error(`Expected YAML mapping key at index ${index}.`);
  }

  return key;
}
