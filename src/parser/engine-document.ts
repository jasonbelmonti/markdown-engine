import type { SourcePosition, SourceRange } from "../api/diagnostics.js";
import type { EngineDocument, EngineNode } from "../api/document.js";
import type {
  MarkdownBodyParseOptions,
} from "./types.js";
import type { MdastNodeLike, MdastPointLike, MdastPositionLike } from "./mdast.js";

export function toEngineDocument(
  root: MdastNodeLike,
  options: MarkdownBodyParseOptions,
): EngineDocument {
  const sourceRange = toSourceRange(root.position, options);
  const children = childNodes(root).map((child) => toEngineNode(child, options));

  return {
    kind: "markdown-document",
    version: "0.0.0",
    ...(options.path !== undefined ? { path: options.path } : {}),
    ...(sourceRange !== undefined ? { sourceRange } : {}),
    children,
  };
}

export function emptyDocument(
  options: MarkdownBodyParseOptions,
): EngineDocument {
  return {
    kind: "markdown-document",
    version: "0.0.0",
    ...(options.path !== undefined ? { path: options.path } : {}),
    children: [],
  };
}

function toEngineNode(
  node: MdastNodeLike,
  options: MarkdownBodyParseOptions,
): EngineNode {
  const type = typeof node.type === "string" ? node.type : "unknown";
  const attributes = nodeAttributes(type, node);
  const sourceRange = toSourceRange(node.position, options);
  const text = nodeText(type, node);
  const children = childNodes(node).map((child) => toEngineNode(child, options));

  return {
    type,
    ...(text !== undefined ? { text } : {}),
    ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
    ...(sourceRange !== undefined ? { sourceRange } : {}),
    ...(children.length > 0 ? { children } : {}),
  };
}

function nodeAttributes(
  type: string,
  node: MdastNodeLike,
): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};

  switch (type) {
    case "heading":
      if (typeof node.depth === "number") {
        attributes.depth = node.depth;
      }
      break;

    case "link":
      if (typeof node.url === "string") {
        attributes.url = node.url;

        if (typeof node.title === "string") {
          attributes.title = node.title;
        }
      }
      break;

    case "linkReference":
      assignStringAttribute(attributes, "identifier", node.identifier);
      assignStringAttribute(attributes, "label", node.label);
      assignStringAttribute(attributes, "referenceType", node.referenceType);
      break;

    case "image":
      assignStringAttribute(attributes, "url", node.url);
      assignStringAttribute(attributes, "title", node.title);
      assignStringAttribute(attributes, "alt", node.alt);
      break;

    case "imageReference":
      assignStringAttribute(attributes, "identifier", node.identifier);
      assignStringAttribute(attributes, "label", node.label);
      assignStringAttribute(attributes, "referenceType", node.referenceType);
      assignStringAttribute(attributes, "alt", node.alt);
      break;

    case "definition":
      assignStringAttribute(attributes, "identifier", node.identifier);
      assignStringAttribute(attributes, "label", node.label);
      assignStringAttribute(attributes, "url", node.url);
      assignStringAttribute(attributes, "title", node.title);
      break;

    case "list":
      if (typeof node.ordered === "boolean") {
        attributes.ordered = node.ordered;
      }

      if (typeof node.start === "number") {
        attributes.start = node.start;
      }

      if (typeof node.spread === "boolean") {
        attributes.spread = node.spread;
      }
      break;

    case "listItem":
      if (typeof node.checked === "boolean") {
        attributes.checked = node.checked;
      }

      if (typeof node.spread === "boolean") {
        attributes.spread = node.spread;
      }
      break;

    case "code":
      if (typeof node.lang === "string") {
        attributes.lang = node.lang;
      }

      if (typeof node.meta === "string") {
        attributes.meta = node.meta;
      }
      break;

    case "table":
      if (Array.isArray(node.align)) {
        attributes.align = node.align.map((alignment) =>
          isTableAlignment(alignment) ? alignment : null,
        );
      }
      break;

    case "footnoteDefinition":
    case "footnoteReference":
      assignStringAttribute(attributes, "identifier", node.identifier);
      assignStringAttribute(attributes, "label", node.label);
      break;
  }

  return attributes;
}

function assignStringAttribute(
  attributes: Record<string, unknown>,
  name: string,
  value: unknown,
): void {
  if (typeof value === "string") {
    attributes[name] = value;
  }
}

function isTableAlignment(
  alignment: unknown,
): alignment is "left" | "right" | "center" | null {
  return (
    alignment === "left" ||
    alignment === "right" ||
    alignment === "center" ||
    alignment === null
  );
}

function nodeText(type: string, node: MdastNodeLike): string | undefined {
  if (typeof node.value === "string") {
    return node.value;
  }

  switch (type) {
    case "heading":
    case "paragraph":
    case "link":
    case "linkReference": {
      const text = collectText(node);

      return text.length > 0 ? text : undefined;
    }
  }

  return undefined;
}

function collectText(node: MdastNodeLike): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  return childNodes(node)
    .map((child) => collectText(child))
    .join("");
}

function childNodes(node: MdastNodeLike): MdastNodeLike[] {
  if (!Array.isArray(node.children)) {
    return [];
  }

  return node.children.filter(isMdastNodeLike);
}

function isMdastNodeLike(value: unknown): value is MdastNodeLike {
  return typeof value === "object" && value !== null;
}

function toSourceRange(
  position: MdastPositionLike | undefined,
  options: MarkdownBodyParseOptions,
): SourceRange | undefined {
  const start = toSourcePosition(position?.start, options);
  const end = toSourcePosition(position?.end, options);

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return { start, end };
}

function toSourcePosition(
  point: MdastPointLike | undefined,
  options: MarkdownBodyParseOptions,
): SourcePosition | undefined {
  if (typeof point?.line !== "number" || typeof point.column !== "number") {
    return undefined;
  }

  const sourcePosition: SourcePosition = {
    line: point.line + (options.lineOffset ?? 0),
    column: point.column + firstLineColumnOffset(point, options),
  };

  if (typeof point.offset === "number") {
    return {
      ...sourcePosition,
      offset: point.offset + (options.offsetOffset ?? 0),
    };
  }

  return sourcePosition;
}

function firstLineColumnOffset(
  point: MdastPointLike,
  options: MarkdownBodyParseOptions,
): number {
  return point.line === 1 ? (options.columnOffset ?? 0) : 0;
}
