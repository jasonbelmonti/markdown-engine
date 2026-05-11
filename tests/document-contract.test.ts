import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  validateAnnotations,
  type EngineAnnotation,
  type EngineCompatibilityGate,
  type EngineDocument,
  type EngineDocumentQueries,
  type EngineNodeTarget,
  type EngineTargetResolution,
  type SerializableEngineResult,
} from "@jasonbelmonti/markdown-engine";

const requiredScriptNames = [
  "test:rich-ir:proving",
  "test:rich-ir:contract",
  "test:rich-ir:targets",
  "test:rich-ir:queries",
  "test:rich-ir:annotations",
  "test:rich-ir:compat",
  "test:rich-ir:repeatability",
  "test:rich-ir:downstream",
  "audit:rich-ir-boundary",
  "docs:rich-ir-contract",
] as const;

const forbiddenContractTerms = [
  "mdast",
  "unified",
  "SpecTrace",
  "markdown-profile",
  "markdown-runtime",
  "MCP",
  "LLM",
  "network service",
  "persistent storage",
  "RichIr",
  "richIr",
  "queryRichIr",
  "serializeRichIr",
  "validateRichIr",
] as const;

const packageJsonPath = join(process.cwd(), "package.json");
const sourceRange = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 8, offset: 7 },
};
const rootTarget = {
  kind: "node",
  id: "node:root",
  path: [],
  nodeType: "root",
  sourceRange,
} satisfies EngineNodeTarget;
const paragraphTarget = {
  kind: "node",
  id: "node:paragraph:0",
  path: [0],
  nodeType: "paragraph",
  sourceRange,
} satisfies EngineNodeTarget;
const compatibility = {
  mode: "default",
  reason: "BEL-934 public contract skeleton",
} satisfies EngineCompatibilityGate;
const annotation = {
  id: "annotation:1",
  target: { kind: "node", nodeTarget: paragraphTarget },
  payload: { ownedByCaller: true },
} satisfies EngineAnnotation<{ ownedByCaller: boolean }>;
const document = {
  kind: "markdown-document",
  version: "1.0.0",
  path: "document.md",
  target: rootTarget,
  children: [
    {
      type: "paragraph",
      text: "Mission",
      target: paragraphTarget,
      source: {
        range: sourceRange,
        text: "Mission",
      },
    },
  ],
  sections: [],
  textSpans: [
    {
      target: paragraphTarget,
      text: "Mission",
      sourceRange,
    },
  ],
  tables: [],
  lists: [],
  links: [],
  annotations: [annotation],
  compatibility,
} satisfies EngineDocument;
const serializableResult = document satisfies SerializableEngineResult;

const queries = {
  nodes: (document) => document.children,
  sections: (document) => document.sections ?? [],
  textSpans: (document) => document.textSpans ?? [],
  tables: (document) => document.tables ?? [],
  lists: (document) => document.lists ?? [],
  links: (document) => document.links ?? [],
  targetCategory: (document, target) => {
    if (document.target?.id === target.id) {
      return "document";
    }

    return document.children.some((node) => node.target?.id === target.id)
      ? "node"
      : undefined;
  },
  resolveTarget: (document, target): EngineTargetResolution | undefined => {
    if (document.target?.id === target.id) {
      return {
        category: "document",
        target: document.target,
      };
    }

    const node = document.children.find((node) => node.target?.id === target.id);

    if (node === undefined || node.target === undefined) {
      return undefined;
    }

    return {
      category: "node",
      target: node.target,
      node,
      ...(node.source !== undefined ? { sourceSlice: node.source } : {}),
    };
  },
  sourceSlice: (document, target) =>
    document.children.find((node) => node.target?.id === target.id)?.source,
} satisfies EngineDocumentQueries;
describe("1.0 document contract skeleton", () => {
  it("registers the required implementation-lane command names", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    for (const scriptName of requiredScriptNames) {
      expect(packageJson.scripts).toHaveProperty(scriptName);
    }
  });

  it("types the 1.0 document, targets, queries, annotations, and compatibility gate", () => {
    expect(document.version).toBe("1.0.0");
    expect(serializableResult.compatibility).toEqual(compatibility);
    expect(queries.nodes(document)).toHaveLength(1);
    expect(queries.targetCategory(document, rootTarget)).toBe("document");
    expect(queries.targetCategory(document, paragraphTarget)).toBe("node");
    expect(queries.resolveTarget(document, paragraphTarget)).toEqual({
      category: "node",
      target: paragraphTarget,
      node: document.children[0],
      sourceSlice: document.children[0]?.source,
    });
    expect(queries.textSpans(document)[0]).toMatchObject({
      text: "Mission",
      target: paragraphTarget,
    });
    expect(queries.sourceSlice(document, paragraphTarget)).toEqual({
      range: sourceRange,
      text: "Mission",
    });
    expect(validateAnnotations(document, [annotation])).toEqual({
      valid: true,
      annotations: [annotation],
      diagnostics: [],
    });
  });

  it("keeps raw parser AST, downstream domain/runtime terms, and richIr labels out of public contract modules", () => {
    const publicContractSources = [
      readFileSync("src/api/annotations.ts", "utf8"),
      readFileSync("src/api/contracts.ts", "utf8"),
      readFileSync("src/api/document.ts", "utf8"),
    ].join("\n");

    for (const forbiddenTerm of forbiddenContractTerms) {
      expect(publicContractSources).not.toContain(forbiddenTerm);
    }
  });
});
