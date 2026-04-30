import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { normalize, parse } from "markdown-engine";
import type { EngineDocument, EngineNode } from "markdown-engine";

const parserFixtureRoot = fileURLToPath(
  new URL("../../fixtures/parser", import.meta.url),
);

export const snapshotRoot = fileURLToPath(
  new URL("../../snapshots", import.meta.url),
);

export function parserFixtureFiles(): string[] {
  return readdirSync(parserFixtureRoot)
    .filter((file) => file.endsWith(".md"))
    .sort();
}

export function readFixture(file: string): string {
  return readFileSync(join(parserFixtureRoot, file), "utf8");
}

export function parseFixture(file: string) {
  return parse(readFixture(file), { path: fixturePath(file) });
}

export function documentForFixture(file: string): EngineDocument {
  return normalize(parseFixture(file).parsed).document;
}

export function fixturePath(file: string): string {
  return `fixtures/parser/${file}`;
}

export function findNode(
  document: EngineDocument,
  type: string,
  predicate: (node: EngineNode) => boolean = () => true,
): EngineNode | undefined {
  return findNodes(document, type).find(predicate);
}

export function findNodes(
  document: EngineDocument,
  type: string,
): EngineNode[] {
  return flattenNodes(document.children).filter((node) => node.type === type);
}

export function flattenNodes(nodes: readonly EngineNode[]): EngineNode[] {
  const flattened: EngineNode[] = [];
  const queue = [...nodes];

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === undefined) {
      continue;
    }

    flattened.push(node);
    queue.push(...(node.children ?? []));
  }

  return flattened;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /[^\x00-\x7F]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
