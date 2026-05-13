import type {
  EngineLinkReference,
  EngineNode,
  EngineNodeTarget,
} from "../api/document.js";
import { linkTitle, linkUrl } from "../api/engine-node-attributes.js";
import { flattenNodes } from "../internal/document-node-walk.js";

export function collectLinkReferences(
  nodes: readonly EngineNode[],
): readonly EngineLinkReference[] {
  const flattenedNodes = flattenNodes(nodes);
  const definitionsByIdentifier = collectDefinitionsByIdentifier(flattenedNodes);

  return flattenedNodes.flatMap((node) =>
    linkReferenceForNode(node, definitionsByIdentifier),
  );
}

interface LinkDefinition {
  target: EngineNodeTarget;
  url: string;
  title?: string;
}

function collectDefinitionsByIdentifier(
  nodes: readonly EngineNode[],
): ReadonlyMap<string, LinkDefinition> {
  const definitions = new Map<string, LinkDefinition>();

  for (const node of nodes) {
    const identifier = stringAttribute(node, "identifier");
    const identifierKey = keyForIdentifier(identifier);
    const url = linkUrl(node);

    if (
      node.type !== "definition" ||
      node.target === undefined ||
      identifierKey === undefined ||
      url === undefined ||
      definitions.has(identifierKey)
    ) {
      continue;
    }

    const title = linkTitle(node);

    definitions.set(identifierKey, {
      target: node.target,
      url,
      ...(title !== undefined ? { title } : {}),
    });
  }

  return definitions;
}

function linkReferenceForNode(
  node: EngineNode,
  definitionsByIdentifier: ReadonlyMap<string, LinkDefinition>,
): readonly EngineLinkReference[] {
  if (node.target === undefined) {
    return [];
  }

  switch (node.type) {
    case "definition":
      return definitionRecord(node);

    case "image":
      return inlineImageRecord(node);

    case "imageReference":
      return referenceUsage(node, "imageReference", definitionsByIdentifier);

    case "link":
      return inlineLinkRecord(node);

    case "linkReference":
      return referenceUsage(node, "linkReference", definitionsByIdentifier);

    default:
      return [];
  }
}

function inlineLinkRecord(node: EngineNode): readonly EngineLinkReference[] {
  const url = linkUrl(node);

  if (node.target === undefined || url === undefined) {
    return [];
  }

  const title = linkTitle(node);

  return [
    {
      target: node.target,
      kind: "link",
      url,
      text: node.text ?? "",
      ...(title !== undefined ? { title } : {}),
      ...sourceRangeProperty(node),
    },
  ];
}

function inlineImageRecord(node: EngineNode): readonly EngineLinkReference[] {
  const url = linkUrl(node);

  if (node.target === undefined || url === undefined) {
    return [];
  }

  const title = linkTitle(node);
  const alt = stringAttribute(node, "alt");

  return [
    {
      target: node.target,
      kind: "image",
      url,
      ...(alt !== undefined ? { alt } : {}),
      ...(title !== undefined ? { title } : {}),
      ...sourceRangeProperty(node),
    },
  ];
}

function definitionRecord(node: EngineNode): readonly EngineLinkReference[] {
  const url = linkUrl(node);

  if (node.target === undefined || url === undefined) {
    return [];
  }

  const title = linkTitle(node);
  const label = stringAttribute(node, "label");
  const identifier = stringAttribute(node, "identifier");

  return [
    {
      target: node.target,
      kind: "definition",
      url,
      ...(title !== undefined ? { title } : {}),
      ...(label !== undefined ? { label } : {}),
      ...(identifier !== undefined ? { identifier } : {}),
      ...sourceRangeProperty(node),
    },
  ];
}

function referenceUsage(
  node: EngineNode,
  kind: "imageReference" | "linkReference",
  definitionsByIdentifier: ReadonlyMap<string, LinkDefinition>,
): readonly EngineLinkReference[] {
  if (node.target === undefined) {
    return [];
  }

  const identifier = stringAttribute(node, "identifier");
  const identifierKey = keyForIdentifier(identifier);
  const definition =
    identifierKey === undefined
      ? undefined
      : definitionsByIdentifier.get(identifierKey);
  const label = stringAttribute(node, "label");
  const referenceType = stringAttribute(node, "referenceType");

  return [
    {
      target: node.target,
      kind,
      ...referenceTextProperty(node, kind),
      ...(definition !== undefined ? { url: definition.url } : {}),
      ...(definition?.title !== undefined ? { title: definition.title } : {}),
      ...(label !== undefined ? { label } : {}),
      ...(identifier !== undefined ? { identifier } : {}),
      ...(referenceType !== undefined ? { referenceType } : {}),
      ...(definition !== undefined
        ? { definitionTarget: definition.target }
        : {}),
      ...sourceRangeProperty(node),
    },
  ];
}

function stringAttribute(
  node: EngineNode,
  name: string,
): string | undefined {
  const value = node.attributes?.[name];

  return typeof value === "string" ? value : undefined;
}

function keyForIdentifier(identifier: string | undefined): string | undefined {
  const key = identifier?.trim().replace(/\s+/g, " ").toLowerCase();

  return key === "" ? undefined : key;
}

function referenceTextProperty(
  node: EngineNode,
  kind: "imageReference" | "linkReference",
): { alt: string } | { text: string } | Record<string, never> {
  if (kind === "linkReference") {
    return { text: node.text ?? "" };
  }

  const alt = stringAttribute(node, "alt");

  return alt === undefined ? {} : { alt };
}

function sourceRangeProperty(
  node: EngineNode,
): { sourceRange: NonNullable<EngineNode["sourceRange"]> } | Record<string, never> {
  return node.sourceRange === undefined ? {} : { sourceRange: node.sourceRange };
}
