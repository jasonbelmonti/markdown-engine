import { extractFrontmatter } from "./extract.js";
import type { FrontmatterBlock, FrontmatterParseResult } from "./types.js";
import { parseYamlFrontmatter } from "./yaml.js";

export function parseFrontmatter(markdown: string): FrontmatterParseResult {
  const extracted = extractFrontmatter(markdown);

  if (extracted.frontmatter === undefined) {
    return extracted;
  }

  const parsed = parseYamlFrontmatter(
    extracted.frontmatter.raw,
    extracted.frontmatter.contentStart,
    extracted.frontmatter.sourceRange,
  );
  const frontmatter: FrontmatterBlock = {
    ...extracted.frontmatter,
    ...(parsed.valueParsed ? { value: parsed.value } : {}),
  };

  return {
    body: extracted.body,
    bodyStart: extracted.bodyStart,
    diagnostics: [...extracted.diagnostics, ...parsed.diagnostics],
    frontmatter,
  };
}
