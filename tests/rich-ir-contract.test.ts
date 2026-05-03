import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  EngineAnnotation,
  EngineTarget,
  RichEngineDocument,
  RichIrCompatibilityGate,
  RichIrQueryHelpers,
  RichIrSerializableResult,
  RichIrSerializeOptions,
  ValidateRichIrAnnotationsFunction,
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
} satisfies EngineTarget;
const paragraphTarget = {
  kind: "node",
  id: "node:paragraph:0",
  path: [0],
  nodeType: "paragraph",
  sourceRange,
} satisfies EngineTarget;
const compatibility = {
  mode: "rich-ir-1.0-draft",
  reason: "BEL-934 public contract skeleton",
} satisfies RichIrCompatibilityGate;
const serializeOptions = {
  pretty: true,
  compatibility,
} satisfies RichIrSerializeOptions;
const annotation = {
  id: "annotation:1",
  target: { kind: "node", target: paragraphTarget },
  payload: { ownedByCaller: true },
} satisfies EngineAnnotation<{ ownedByCaller: boolean }>;
const richDocument = {
  kind: "markdown-document",
  version: "1.0.0-draft",
  path: "rich-ir.md",
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
} satisfies RichEngineDocument;
const serializableResult = richDocument satisfies RichIrSerializableResult;

const queryHelpers = {
  nodes: (document) => document.children,
  sections: (document) => document.sections,
  textSpans: (document) => document.textSpans,
  tables: (document) => document.tables,
  lists: (document) => document.lists,
  links: (document) => document.links,
  sourceSlice: (document, target) =>
    document.children.find((node) => node.target.id === target.id)?.source,
} satisfies RichIrQueryHelpers;
const validateAnnotations: ValidateRichIrAnnotationsFunction = (
  _document,
  annotations,
) => ({
  valid: true,
  annotations,
  diagnostics: [],
});

describe("1.0 rich IR public contract skeleton", () => {
  it("registers the required rich IR command names", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    for (const scriptName of requiredScriptNames) {
      expect(packageJson.scripts).toHaveProperty(scriptName);
    }
  });

  it("types the draft rich document, targets, query helpers, annotations, and compatibility gate", () => {
    expect(richDocument.version).toBe("1.0.0-draft");
    expect(serializableResult.compatibility).toEqual(
      serializeOptions.compatibility,
    );
    expect(queryHelpers.nodes(richDocument)).toHaveLength(1);
    expect(queryHelpers.textSpans(richDocument)[0]).toMatchObject({
      text: "Mission",
      target: paragraphTarget,
    });
    expect(queryHelpers.sourceSlice(richDocument, paragraphTarget)).toEqual({
      range: sourceRange,
      text: "Mission",
    });
    expect(validateAnnotations(richDocument, [annotation])).toEqual({
      valid: true,
      annotations: [annotation],
      diagnostics: [],
    });
  });

  it("keeps raw parser AST and downstream domain/runtime terms out of the rich IR public type module", () => {
    const richIrSource = readFileSync("src/api/rich-ir.ts", "utf8");

    for (const forbiddenTerm of forbiddenContractTerms) {
      expect(richIrSource).not.toContain(forbiddenTerm);
    }
  });
});
