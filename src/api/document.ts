import type { SourceRange } from "./diagnostics.js";

export interface EngineNode {
  type: string;
  text?: string;
  attributes?: Record<string, unknown>;
  sourceRange?: SourceRange;
  children?: EngineNode[];
}

export interface EngineDocument {
  kind: "markdown-document";
  version: "0.0.0";
  path?: string;
  frontmatter?: unknown;
  children: EngineNode[];
  sourceRange?: SourceRange;
}
