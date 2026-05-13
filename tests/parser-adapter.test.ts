import { describe, expect, it, vi } from "vitest";

describe("parser adapter failure handling", () => {
  it("returns a structured diagnostic when the Markdown parser throws", async () => {
    vi.resetModules();
    vi.doMock("unified", () => {
      const processor = {
        use: () => processor,
        parse: () => {
          throw new Error("parser exploded");
        },
      };

      return {
        unified: () => processor,
      };
    });

    const { parseMarkdownBody } = await import("../src/parser/adapter.js");
    const result = parseMarkdownBody("# Body\n", { path: "probe.md" });

    expect(result).toEqual({
      document: {
        kind: "markdown-document",
        version: "0.0.0",
        path: "probe.md",
        children: [],
      },
      diagnostics: [
        {
          code: "parser.markdown.invalid",
          message: "parser exploded",
          severity: "error",
        },
      ],
    });

    vi.doUnmock("unified");
  });
});
