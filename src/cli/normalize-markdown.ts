import {
  normalize,
  parse,
  type EngineDocumentVersion,
  type NormalizeResult,
} from "../api/contracts.js";

export interface NormalizeMarkdownInput {
  documentVersion: EngineDocumentVersion;
  markdown: string;
  path: string;
}

export function normalizeMarkdown(
  input: NormalizeMarkdownInput,
): NormalizeResult {
  const parseResult = parse(input.markdown, {
    path: input.path,
  });

  return normalize(parseResult.parsed, {
    documentVersion: input.documentVersion,
  });
}
