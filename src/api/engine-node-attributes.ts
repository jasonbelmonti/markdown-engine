import type { EngineNode } from "./document.js";

export type EngineCodeBlockKind = "fenced" | "indented";
export type EngineTableAlignment = "left" | "right" | "center" | null;

export function headingDepth(node: EngineNode): number | undefined {
  if (node.type !== "heading") {
    return undefined;
  }

  return numberAttribute(node, "depth");
}

export function linkUrl(node: EngineNode): string | undefined {
  if (!hasLinkAttributes(node)) {
    return undefined;
  }

  return stringAttribute(node, "url");
}

export function linkTitle(node: EngineNode): string | undefined {
  if (!hasLinkAttributes(node)) {
    return undefined;
  }

  return stringAttribute(node, "title");
}

export function codeBlockKind(node: EngineNode): EngineCodeBlockKind | undefined {
  if (node.type !== "code") {
    return undefined;
  }

  const kind = stringAttribute(node, "kind");

  return isCodeBlockKind(kind) ? kind : undefined;
}

export function isFencedCodeBlock(node: EngineNode): boolean {
  return codeBlockKind(node) === "fenced";
}

export function codeLanguage(node: EngineNode): string | undefined {
  if (node.type !== "code") {
    return undefined;
  }

  return stringAttribute(node, "lang");
}

export function listOrdered(node: EngineNode): boolean | undefined {
  if (node.type !== "list") {
    return undefined;
  }

  return booleanAttribute(node, "ordered");
}

export function isOrderedList(node: EngineNode): boolean {
  return listOrdered(node) === true;
}

export function listStart(node: EngineNode): number | undefined {
  if (node.type !== "list") {
    return undefined;
  }

  return numberAttribute(node, "start");
}

export function listItemChecked(node: EngineNode): boolean | undefined {
  if (node.type !== "listItem") {
    return undefined;
  }

  return booleanAttribute(node, "checked");
}

export function tableAlignments(
  node: EngineNode,
): readonly EngineTableAlignment[] | undefined {
  if (node.type !== "table") {
    return undefined;
  }

  const alignments = node.attributes?.align;

  if (!Array.isArray(alignments)) {
    return undefined;
  }

  const typedAlignments: EngineTableAlignment[] = [];

  for (const alignment of alignments) {
    if (!isTableAlignment(alignment)) {
      return undefined;
    }

    typedAlignments.push(alignment);
  }

  return typedAlignments;
}

function hasLinkAttributes(node: EngineNode): boolean {
  return (
    node.type === "definition" ||
    node.type === "image" ||
    node.type === "link"
  );
}

function stringAttribute(
  node: EngineNode,
  name: string,
): string | undefined {
  const value = node.attributes?.[name];

  return typeof value === "string" ? value : undefined;
}

function numberAttribute(
  node: EngineNode,
  name: string,
): number | undefined {
  const value = node.attributes?.[name];

  return typeof value === "number" ? value : undefined;
}

function booleanAttribute(
  node: EngineNode,
  name: string,
): boolean | undefined {
  const value = node.attributes?.[name];

  return typeof value === "boolean" ? value : undefined;
}

function isCodeBlockKind(value: unknown): value is EngineCodeBlockKind {
  return value === "fenced" || value === "indented";
}

function isTableAlignment(value: unknown): value is EngineTableAlignment {
  return (
    value === "left" ||
    value === "right" ||
    value === "center" ||
    value === null
  );
}
