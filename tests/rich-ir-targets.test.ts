import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  documentQueries,
  normalize,
  parse,
  type EngineDocument,
  type EngineNode,
  type EngineNodeTarget,
  type ParsedMarkdown,
  type SourceRange,
} from "@jasonbelmonti/markdown-engine";

const fixturePath = "fixtures/rich-ir/proving.md";
const snapshotPath = fileURLToPath(
  new URL(
    "../snapshots/rich-ir/wp-2-target-source-fixtures.json",
    import.meta.url,
  ),
);
const fixture = readFileSync(
  new URL("../fixtures/rich-ir/proving.md", import.meta.url),
  "utf8",
);

const representativeNodes = [
  {
    targetId: "node:0:heading",
    nodeType: "heading",
    path: [0],
    sourceRange: range(7, 1, 77, 7, 16, 92),
    sourceText: "# Mission Brief",
  },
  {
    targetId: "node:1:paragraph",
    nodeType: "paragraph",
    path: [1],
    sourceRange: range(9, 1, 94, 9, 89, 182),
    sourceText:
      "Use [markdown-engine](https://example.com/markdown-engine) to prove the structural path.",
  },
  {
    targetId: "node:1.1:link",
    nodeType: "link",
    path: [1, 1],
    sourceRange: range(9, 5, 98, 9, 59, 152),
    sourceText: "[markdown-engine](https://example.com/markdown-engine)",
  },
  {
    targetId: "node:4:table",
    nodeType: "table",
    path: [4],
    sourceRange: range(15, 1, 302, 17, 16, 349),
    sourceText: "| Field | Value |\n| --- | --- |\n| signal | go |",
  },
  {
    targetId: "node:5.0.1.0:listItem",
    nodeType: "listItem",
    path: [5, 0, 1, 0],
    sourceRange: range(20, 3, 381, 20, 40, 418),
    sourceText: "- [ ] Preserve the nested task target",
  },
  {
    targetId: "node:6:code",
    nodeType: "code",
    path: [6],
    sourceRange: range(22, 1, 420, 24, 4, 457),
    sourceText: '```ts\nexport const signal = "go";\n```',
  },
  {
    targetId: "node:7:html",
    nodeType: "html",
    path: [7],
    sourceRange: range(26, 1, 459, 26, 45, 503),
    sourceText: '<div data-engine="inert">Raw HTML data</div>',
  },
] as const;

describe("1.0 Rich IR target/source substrate", () => {
  it("attaches deterministic document and node targets with source slices", () => {
    const document = normalizeDraftFixture();
    const repeatedDocument = normalizeDraftFixture();

    expect(targetSourceSnapshot(document)).toEqual(
      targetSourceSnapshot(repeatedDocument),
    );
    expect(document.target).toEqual({
      kind: "node",
      id: "node:root:document",
      path: [],
      nodeType: "document",
      sourceRange: range(6, 1, 76, 27, 1, 504),
    });
    expect(document.target?.sourceRange).not.toBe(document.sourceRange);

    for (const expected of representativeNodes) {
      const node = requireNode(document, expected.targetId);

      expect(node.target).toEqual({
        kind: "node",
        id: expected.targetId,
        path: expected.path,
        nodeType: expected.nodeType,
        sourceRange: expected.sourceRange,
      });
      expect(node.source).toEqual({
        range: expected.sourceRange,
        text: expected.sourceText,
      });
      expect(documentQueries.sourceSlice(document, requireTarget(node))).toEqual(
        node.source,
      );
      expect(node.target?.sourceRange).not.toBe(node.sourceRange);
      expect(node.source?.range).not.toBe(node.sourceRange);
    }
  });

  it("keeps node targets deterministic when source locations are omitted", () => {
    const document = normalizeDraftFixture({ preserveSourceLocations: false });
    const nodeTargets = documentQueries
      .nodes(document)
      .map((node) => node.target);

    expect(document.sourceRange).toBeUndefined();
    expect(document.target).toEqual({
      kind: "node",
      id: "node:root:document",
      path: [],
      nodeType: "document",
    });
    expect(nodeTargets.map((target) => target?.id)).toEqual(
      targetSourceSnapshot(normalizeDraftFixture()).nodes.map(
        (entry) => entry.target?.id,
      ),
    );
    expect(nodeTargets.every((target) => target?.sourceRange === undefined)).toBe(
      true,
    );
    expect(
      documentQueries.nodes(document).every((node) => node.source === undefined),
    ).toBe(true);
  });

  it("records durable target/source evidence for MS-2 review", async () => {
    const baseline = targetSourceEvidence();
    const repeatedEvidence = Array.from({ length: 10 }, () =>
      targetSourceEvidence(),
    );

    for (const evidence of repeatedEvidence) {
      expect(evidence).toEqual(baseline);
    }

    await expect(stableJson(baseline)).toMatchFileSnapshot(snapshotPath);
  });

  it("does not synthesize source slices when parser offsets are unusable", () => {
    const { document, missingOffsetRange, outOfBoundsRange } =
      normalizeUnsupportedSourceFixture();
    const paragraph = requireNode(document, "node:0:paragraph");

    expect(paragraph.target).toEqual({
      kind: "node",
      id: "node:0:paragraph",
      path: [0],
      nodeType: "paragraph",
      sourceRange: outOfBoundsRange,
    });
    expect(paragraph.source).toBeUndefined();
    expect(documentQueries.sourceSlice(document, requireTarget(paragraph))).toBe(
      undefined,
    );

    const paragraphWithoutOffsets = requireNode(document, "node:1:paragraph");

    expect(paragraphWithoutOffsets.target).toEqual({
      kind: "node",
      id: "node:1:paragraph",
      path: [1],
      nodeType: "paragraph",
      sourceRange: missingOffsetRange,
    });
    expect(paragraphWithoutOffsets.source).toBeUndefined();
    expect(
      documentQueries.sourceSlice(
        document,
        requireTarget(paragraphWithoutOffsets),
      ),
    ).toBe(undefined);
  });
});

function normalizeDraftFixture(
  options: { preserveSourceLocations?: boolean } = {},
): EngineDocument {
  return normalize(parse(fixture, { path: fixturePath }).parsed, {
    documentVersion: "1.0.0-draft",
    ...options,
  }).document;
}

function targetSourceSnapshot(document: EngineDocument) {
  return {
    documentTarget: document.target,
    nodes: documentQueries.nodes(document).map((node) => ({
      target: node.target,
      source: node.source,
    })),
  };
}

function targetSourceEvidence() {
  const document = normalizeDraftFixture();
  const withoutSourceLocations = normalizeDraftFixture({
    preserveSourceLocations: false,
  });
  const unsupportedSourceFixture = normalizeUnsupportedSourceFixture();

  return {
    fixture: fixturePath,
    documentTarget: document.target,
    representativeNodes: representativeNodes.map((expected) => {
      const node = requireNode(document, expected.targetId);

      return {
        id: node.target?.id,
        nodeType: node.target?.nodeType,
        path: node.target?.path,
        sourceRange: node.target?.sourceRange,
        source: node.source,
        sourceSlice: documentQueries.sourceSlice(document, requireTarget(node)),
      };
    }),
    withoutSourceLocations: {
      documentTarget: withoutSourceLocations.target,
      nodeTargets: documentQueries.nodes(withoutSourceLocations).map((node) => ({
        id: node.target?.id,
        path: node.target?.path,
        sourceRangeAvailable: node.target?.sourceRange !== undefined,
        sourceSliceAvailable: node.source !== undefined,
      })),
    },
    unsupportedSourceOffsets: unsupportedSourceEvidence(
      unsupportedSourceFixture.document,
    ),
  };
}

function normalizeUnsupportedSourceFixture(): {
  document: EngineDocument;
  missingOffsetRange: SourceRange;
  outOfBoundsRange: SourceRange;
} {
  const outOfBoundsRange = range(1, 1, 0, 1, 6, 99);
  const missingOffsetRange = {
    start: { line: 2, column: 1 },
    end: { line: 2, column: 6 },
  };
  const parsed = {
    markdown: "Alpha\nBravo",
    body: "Alpha\nBravo",
    document: {
      kind: "markdown-document",
      version: "0.0.0",
      children: [
        {
          type: "paragraph",
          text: "Alpha",
          sourceRange: outOfBoundsRange,
        },
        {
          type: "paragraph",
          text: "Bravo",
          sourceRange: missingOffsetRange,
        },
      ],
    },
    diagnostics: [],
  } satisfies ParsedMarkdown;

  return {
    document: normalize(parsed, { documentVersion: "1.0.0-draft" }).document,
    missingOffsetRange,
    outOfBoundsRange,
  };
}

function unsupportedSourceEvidence(document: EngineDocument) {
  return documentQueries.nodes(document).map((node) => ({
    id: node.target?.id,
    sourceRange: node.target?.sourceRange,
    sourceSliceAvailable:
      documentQueries.sourceSlice(document, requireTarget(node)) !== undefined,
  }));
}

function requireNode(document: EngineDocument, targetId: string): EngineNode {
  const node = documentQueries.nodes(document, { targetId })[0];

  if (node === undefined) {
    throw new Error(`Expected node target ${targetId} to be present.`);
  }

  return node;
}

function requireTarget(node: EngineNode): EngineNodeTarget {
  if (node.target === undefined) {
    throw new Error(`Expected ${node.type} node target to be present.`);
  }

  return node.target;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function range(
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
