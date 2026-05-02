import { normalize, parse, type NormalizeResult } from "../api/contracts.js";

export interface NormalizeMarkdownInput {
  markdown: string;
  path: string;
}

export function normalizeMarkdown(
  input: NormalizeMarkdownInput,
): NormalizeResult {
  const parseResult = parse(input.markdown, {
    path: input.path,
  });

  return normalize(parseResult.parsed);
}
