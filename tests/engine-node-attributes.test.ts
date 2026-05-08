import { describe, expect, it } from "vitest";

import type { EngineNode } from "../src/api/document.js";
import {
  codeBlockKind,
  codeLanguage,
  headingDepth,
  isFencedCodeBlock,
  isOrderedList,
  linkTitle,
  linkUrl,
  listItemChecked,
  listOrdered,
  listStart,
  tableAlignments,
} from "../src/api/engine-node-attributes.js";

describe("EngineNode semantic attribute accessors", () => {
  it("reads currently supported semantic attributes with typed values", () => {
    const tableNode = node("table", {
      align: ["left", null, "right", "center"],
    });
    const alignments = tableAlignments(tableNode);

    expect(headingDepth(node("heading", { depth: 2 }))).toBe(2);
    expect(linkUrl(node("link", { url: "https://example.com" }))).toBe(
      "https://example.com",
    );
    expect(linkTitle(node("link", { title: "Example" }))).toBe("Example");
    expect(linkUrl(node("image", { url: "image.png" }))).toBe("image.png");
    expect(linkUrl(node("definition", { url: "https://example.com" }))).toBe(
      "https://example.com",
    );
    expect(codeBlockKind(node("code", { kind: "fenced" }))).toBe("fenced");
    expect(isFencedCodeBlock(node("code", { kind: "fenced" }))).toBe(true);
    expect(codeLanguage(node("code", { lang: "ts" }))).toBe("ts");
    expect(listOrdered(node("list", { ordered: true }))).toBe(true);
    expect(isOrderedList(node("list", { ordered: true }))).toBe(true);
    expect(listStart(node("list", { start: 3 }))).toBe(3);
    expect(listItemChecked(node("listItem", { checked: false }))).toBe(false);
    expect(alignments).toEqual(["left", null, "right", "center"]);
    expect(alignments).not.toBe(tableNode.attributes?.align);
  });

  it("returns undefined or false when semantic attributes are missing", () => {
    expect(headingDepth(node("heading"))).toBeUndefined();
    expect(linkUrl(node("link"))).toBeUndefined();
    expect(linkTitle(node("link"))).toBeUndefined();
    expect(codeBlockKind(node("code"))).toBeUndefined();
    expect(isFencedCodeBlock(node("code"))).toBe(false);
    expect(codeLanguage(node("code"))).toBeUndefined();
    expect(listOrdered(node("list"))).toBeUndefined();
    expect(isOrderedList(node("list"))).toBe(false);
    expect(listStart(node("list"))).toBeUndefined();
    expect(listItemChecked(node("listItem"))).toBeUndefined();
    expect(tableAlignments(node("table"))).toBeUndefined();
  });

  it("rejects wrong-type semantic attributes", () => {
    const sparseAlignments = Array<unknown>(1);

    expect(headingDepth(node("heading", { depth: "2" }))).toBeUndefined();
    expect(linkUrl(node("link", { url: 7 }))).toBeUndefined();
    expect(linkTitle(node("link", { title: false }))).toBeUndefined();
    expect(codeBlockKind(node("code", { kind: "block" }))).toBeUndefined();
    expect(isFencedCodeBlock(node("code", { kind: "block" }))).toBe(false);
    expect(codeLanguage(node("code", { lang: 42 }))).toBeUndefined();
    expect(listOrdered(node("list", { ordered: "true" }))).toBeUndefined();
    expect(isOrderedList(node("list", { ordered: "true" }))).toBe(false);
    expect(listStart(node("list", { start: "3" }))).toBeUndefined();
    expect(
      listItemChecked(node("listItem", { checked: "false" })),
    ).toBeUndefined();
    expect(tableAlignments(node("table", { align: "left" }))).toBeUndefined();
    expect(tableAlignments(node("table", { align: ["left", "invalid"] })))
      .toBeUndefined();
    expect(tableAlignments(node("table", { align: sparseAlignments })))
      .toBeUndefined();
  });

  it("treats indented code blocks and unordered lists as supported false predicates", () => {
    expect(codeBlockKind(node("code", { kind: "indented" }))).toBe("indented");
    expect(isFencedCodeBlock(node("code", { kind: "indented" }))).toBe(false);
    expect(listOrdered(node("list", { ordered: false }))).toBe(false);
    expect(isOrderedList(node("list", { ordered: false }))).toBe(false);
  });

  it("does not expose semantic values from unsupported node types", () => {
    const unsupported = node("paragraph", {
      align: ["left"],
      checked: true,
      depth: 2,
      kind: "fenced",
      lang: "ts",
      ordered: true,
      start: 1,
      title: "Example",
      url: "https://example.com",
    });

    expect(headingDepth(unsupported)).toBeUndefined();
    expect(linkUrl(unsupported)).toBeUndefined();
    expect(linkTitle(unsupported)).toBeUndefined();
    expect(codeBlockKind(unsupported)).toBeUndefined();
    expect(isFencedCodeBlock(unsupported)).toBe(false);
    expect(codeLanguage(unsupported)).toBeUndefined();
    expect(listOrdered(unsupported)).toBeUndefined();
    expect(isOrderedList(unsupported)).toBe(false);
    expect(listStart(unsupported)).toBeUndefined();
    expect(listItemChecked(unsupported)).toBeUndefined();
    expect(tableAlignments(unsupported)).toBeUndefined();
  });
});

function node(type: string, attributes?: Record<string, unknown>): EngineNode {
  return {
    type,
    ...(attributes !== undefined ? { attributes } : {}),
  };
}
