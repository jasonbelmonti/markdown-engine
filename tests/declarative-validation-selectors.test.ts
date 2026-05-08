import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { normalize, parse } from "@jasonbelmonti/markdown-engine";
import { resolveDeclarativeSelector } from "../src/declarative-validation/selectors/index.js";

const fixturePath = "fixtures/declarative-validation/proving/representative.md";
const fixture = readFileSync(
  new URL("../fixtures/declarative-validation/proving/representative.md", import.meta.url),
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
});
