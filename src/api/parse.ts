import type { MarkdownDiagnostic } from "./diagnostics.js";
import type { EngineDocument } from "./document.js";
import { parseFrontmatter } from "../frontmatter/index.js";
import type { FrontmatterBlock } from "../frontmatter/index.js";
import { parseMarkdownBody } from "../parser/index.js";

export interface ParseOptions {
  path?: string;
}

export interface ParsedMarkdown {
  markdown: string;
  body: string;
  path?: string;
  frontmatter?: unknown;
  document: EngineDocument;
  diagnostics: MarkdownDiagnostic[];
}

export interface ParseResult {
  parsed: ParsedMarkdown;
  diagnostics: MarkdownDiagnostic[];
}

export type ParseFunction = (
  markdown: string,
  options?: ParseOptions,
) => ParseResult;

export const parse: ParseFunction = (markdown, options = {}) => {
  const frontmatterResult = parseFrontmatter(markdown);
  const parserOptions = {
    ...(options.path !== undefined ? { path: options.path } : {}),
    lineOffset: frontmatterResult.bodyStart.line - 1,
    columnOffset: frontmatterResult.bodyStart.column - 1,
    ...(frontmatterResult.bodyStart.offset !== undefined
      ? { offsetOffset: frontmatterResult.bodyStart.offset }
      : {}),
  };
  const bodyResult = parseMarkdownBody(frontmatterResult.body, parserOptions);
  const diagnostics = [
    ...frontmatterResult.diagnostics,
    ...bodyResult.diagnostics,
  ];
  const frontmatter = parsedFrontmatterValue(frontmatterResult.frontmatter);
  const document: EngineDocument = {
    ...bodyResult.document,
    ...(frontmatter.hasValue ? { frontmatter: frontmatter.value } : {}),
  };
  const parsed: ParsedMarkdown = {
    markdown,
    body: frontmatterResult.body,
    ...(options.path !== undefined ? { path: options.path } : {}),
    ...(frontmatter.hasValue ? { frontmatter: frontmatter.value } : {}),
    document,
    diagnostics,
  };

  return {
    parsed,
    diagnostics,
  };
};

function parsedFrontmatterValue(
  block: FrontmatterBlock | undefined,
): { hasValue: true; value: unknown } | { hasValue: false } {
  const hasValue =
    block !== undefined && Object.prototype.hasOwnProperty.call(block, "value");

  if (hasValue) {
    return {
      hasValue: true,
      value: block.value,
    };
  }

  return { hasValue: false };
}
