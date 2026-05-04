import type { EngineDocument, EngineNode } from "../api/document.js";
import type { NormalizeOptions } from "../api/normalize.js";
import type { ParsedMarkdown } from "../api/parse.js";
import { hasOwnProperty, isPlainRecord } from "../internal/plain-record.js";
import { buildDraftDocumentViews } from "./document-derived-views.js";
import { cloneSourceRange } from "./source-ranges.js";

export function normalizeParsedMarkdown(
  parsed: ParsedMarkdown,
  options: NormalizeOptions = {},
): EngineDocument {
  const preserveSourceLocations = options.preserveSourceLocations ?? true;
  const document = parsed.document;
  const path = document.path ?? parsed.path;
  const version = options.documentVersion ?? document.version;

  const normalizedDocument: EngineDocument = {
    kind: "markdown-document",
    version,
    ...(path !== undefined ? { path } : {}),
    ...(hasOwnProperty(parsed, "frontmatter")
      ? { frontmatter: cloneUnknown(parsed.frontmatter) }
      : {}),
    ...(preserveSourceLocations && document.sourceRange !== undefined
      ? { sourceRange: cloneSourceRange(document.sourceRange) }
      : {}),
    children: document.children.map((node) =>
      normalizeNode(node, preserveSourceLocations),
    ),
  };

  if (version === "1.0.0-draft") {
    return buildDraftDocumentViews(normalizedDocument, {
      preserveSourceLocations,
      source: parsed.markdown,
    });
  }

  return normalizedDocument;
}

function normalizeNode(
  node: EngineNode,
  preserveSourceLocations: boolean,
): EngineNode {
  return {
    type: node.type,
    ...(node.text !== undefined ? { text: node.text } : {}),
    ...(node.attributes !== undefined
      ? { attributes: cloneRecord(node.attributes) }
      : {}),
    ...(preserveSourceLocations && node.sourceRange !== undefined
      ? { sourceRange: cloneSourceRange(node.sourceRange) }
      : {}),
    ...(node.children !== undefined
      ? {
          children: node.children.map((child) =>
            normalizeNode(child, preserveSourceLocations),
          ),
        }
      : {}),
  };
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, cloneUnknown(record[key])]),
  );
}

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneUnknown(item));
  }

  if (isPlainRecord(value)) {
    return cloneRecord(value);
  }

  return value;
}
