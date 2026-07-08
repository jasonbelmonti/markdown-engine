import { describe, expect, it } from "vitest";

import type { SourcePosition, SourceRange } from "@jasonbelmonti/markdown-engine";
import { sourceRangeForNormalizedText } from "../src/declarative-validation/assertions/normalized-source-ranges.js";

describe("declarative validation normalized source ranges", () => {
  it("maps escaped source text onto normalized ID tokens", () => {
    const sourceText = "See REQ\\-1 for details.";
    const normalizedText = "See REQ-1 for details.";

    expect(
      sourceRangeForNormalizedText(
        sourceRangeAt({ line: 4, column: 3, offset: 100 }),
        sourceText,
        normalizedText,
        normalizedText.indexOf("REQ-1"),
        "REQ-1".length,
      ),
    ).toEqual({
      start: { line: 4, column: 7, offset: 104 },
      end: { line: 4, column: 13, offset: 110 },
    });
  });

  it("skips markdown link destinations when mapping later normalized text", () => {
    const sourceText = "[REQ-1](./requirements/(core).md) covers EVD-1";
    const normalizedText = "REQ-1 covers EVD-1";
    const sourceStart = sourceText.indexOf("EVD-1");

    expect(
      sourceRangeForNormalizedText(
        sourceRangeAt({ line: 1, column: 1, offset: 0 }),
        sourceText,
        normalizedText,
        normalizedText.indexOf("EVD-1"),
        "EVD-1".length,
      ),
    ).toEqual({
      start: { line: 1, column: sourceStart + 1, offset: sourceStart },
      end: {
        line: 1,
        column: sourceStart + "EVD-1".length + 1,
        offset: sourceStart + "EVD-1".length,
      },
    });
  });

  it("preserves line and offset evidence for multiline normalized text", () => {
    const sourceText = "Alpha\nREQ\\-2";
    const normalizedText = "Alpha\nREQ-2";

    expect(
      sourceRangeForNormalizedText(
        sourceRangeAt({ line: 10, column: 4, offset: 40 }),
        sourceText,
        normalizedText,
        normalizedText.indexOf("REQ-2"),
        "REQ-2".length,
      ),
    ).toEqual({
      start: { line: 11, column: 1, offset: 46 },
      end: { line: 11, column: 7, offset: 52 },
    });
  });

  it("returns undefined when the normalized range cannot be source mapped", () => {
    const segmentRange = sourceRangeAt({ line: 1, column: 1, offset: 0 });

    expect(
      sourceRangeForNormalizedText(segmentRange, "REQ-1", "REQ-1", 0, 0),
    ).toBeUndefined();
    expect(
      sourceRangeForNormalizedText(segmentRange, "REQ-1", "REQ-1", -1, 1),
    ).toBeUndefined();
    expect(
      sourceRangeForNormalizedText(segmentRange, "REQ-1", "REQ-1", 5, 1),
    ).toBeUndefined();
    expect(
      sourceRangeForNormalizedText(segmentRange, "ABC-1", "XYZ-1", 0, 5),
    ).toBeUndefined();
  });
});

function sourceRangeAt(start: SourcePosition): SourceRange {
  return { start, end: start };
}
