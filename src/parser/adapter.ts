import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { emptyDocument, toEngineDocument } from "./engine-document.js";
import type { MdastNodeLike } from "./mdast.js";
import type {
  MarkdownBodyParseOptions,
  MarkdownBodyParseResult,
} from "./types.js";

const markdownParser = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdownBody(
  markdown: string,
  options: MarkdownBodyParseOptions = {},
): MarkdownBodyParseResult {
  try {
    const root = markdownParser.parse(markdown) as MdastNodeLike;

    return {
      document: toEngineDocument(root, { ...options, source: markdown }),
      diagnostics: [],
    };
  } catch (error) {
    return {
      document: emptyDocument(options),
      diagnostics: [
        {
          code: "parser.markdown.invalid",
          message: parserErrorMessage(error),
          severity: "error",
        },
      ],
    };
  }
}

function parserErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Markdown could not be parsed.";
}
