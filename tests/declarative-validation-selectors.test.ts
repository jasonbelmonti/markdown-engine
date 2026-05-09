import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { normalize, parse } from "@jasonbelmonti/markdown-engine";
import { resolveDeclarativeSelector } from "../src/declarative-validation/selectors/index.js";

const fixturePath = "fixtures/declarative-validation/proving/representative.md";
const richIrFixturePath = "fixtures/rich-ir/queries.md";
const fixture = readFileSync(
  new URL("../fixtures/declarative-validation/proving/representative.md", import.meta.url),
  "utf8",
);
const richIrFixture = readFileSync(
  new URL("../fixtures/rich-ir/queries.md", import.meta.url),
  "utf8",
);

describe("declarative validation selector proof", () => {
  it("resolves section selectors through public EngineDocument structures", () => {
    const document = normalize(parse(fixture, { path: fixturePath }).parsed, {
      documentVersion: "1.0.0",
    }).document;
    const selection = resolveDeclarativeSelector(document, {
      target: "section",
      title: "Objective",
    });

    expect(selection.targets).toEqual([
      expect.objectContaining({
        kind: "section",
        text: expect.stringContaining("architecture viable"),
        source: expect.objectContaining({
          text: "# Objective",
        }),
      }),
    ]);
  });

  it("resolves document selectors to one document-scoped target", () => {
    const document = normalize(parse(fixture).parsed, {
      documentVersion: "1.0.0",
    }).document;
    const selection = resolveDeclarativeSelector(document, { target: "document" });

    expect(selection.targets).toEqual([
      {
        kind: "document",
        text: expect.stringContaining("Objective"),
      },
    ]);
  });

  it("resolves heading, table, row, cell, span, link, list, and frontmatter selectors", () => {
    const document = normalize(parse(richIrFixture, { path: richIrFixturePath }).parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      resolveDeclarativeSelector(document, {
        target: "heading",
        text: "Phase Alpha Details",
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "heading",
        text: "Phase Alpha Details",
        source: expect.objectContaining({ text: "### Phase Alpha Details" }),
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "table",
        section: "Phase Alpha Details",
        header: ["Step", "State"],
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "table",
        text: expect.stringContaining("Build\tengine\tblocked"),
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "tableRow",
        tableHeader: ["Step", "Owner", "State"],
        where: { column: "State", equals: "blocked" },
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "tableRow",
        rowIndex: 2,
        text: "Build\tengine\tblocked",
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "tableCell",
        column: "Owner",
        rowWhere: { column: "Step", includes: "Build" },
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "tableCell",
        text: "engine",
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "textSpan",
        section: "Phase Alpha",
        nodeType: "paragraph",
        textIncludes: "source span text",
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "textSpan",
        text: expect.stringContaining("source span text"),
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "link",
        section: "Phase Alpha",
        text: "relative link",
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "link",
        text: "relative link",
        source: expect.objectContaining({
          text: "[relative link](./phase-alpha.md)",
        }),
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "list",
        section: "Phase Alpha Details",
        ordered: false,
        depth: 1,
      }).targets,
    ).toEqual([
      expect.objectContaining({
        kind: "list",
        text: expect.stringContaining("Nested done task"),
      }),
    ]);

    expect(
      resolveDeclarativeSelector(document, {
        target: "frontmatter",
        field: "owner",
      }).targets,
    ).toEqual([
      {
        kind: "frontmatter",
        field: "owner",
        value: "markdown-engine",
        text: "markdown-engine",
      },
    ]);
  });

  it("uses the selector compatibility substrate limits deterministically", () => {
    const document = normalize(parse(richIrFixture).parsed, {
      documentVersion: "1.0.0",
    }).document;

    expect(
      resolveDeclarativeSelector(document, {
        target: "table",
        header: ["State", "Step"],
      }).targets,
    ).toEqual([]);
    expect(
      resolveDeclarativeSelector(document, {
        target: "frontmatter",
        field: "missing",
      }).targets,
    ).toEqual([]);
    expect(
      resolveDeclarativeSelector(document, {
        target: "link",
        section: "Phase Bravo",
        text: "relative link",
      }).targets,
    ).toEqual([]);
  });
});
