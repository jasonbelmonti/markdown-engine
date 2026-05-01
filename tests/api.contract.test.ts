import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  serialize,
  validate,
  type ValidationConfig,
} from "@jasonbelmonti/markdown-engine";

const markdown = `---
title: API contract
owner: markdown-engine
---

# API Contract

Body text.
`;

const config = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
  },
} satisfies ValidationConfig;
const contractPath = "contract.md";
const contractFrontmatter = {
  title: "API contract",
  owner: "markdown-engine",
};

describe("public API", () => {
  it("exports the named API functions", () => {
    expect(parse).toEqual(expect.any(Function));
    expect(normalize).toEqual(expect.any(Function));
    expect(validate).toEqual(expect.any(Function));
    expect(serialize).toEqual(expect.any(Function));
  });

  it("VAL-7: exposes parse, normalize, validate, and serialize result contracts", () => {
    const parseResult = parse(markdown, { path: contractPath });
    const normalizeResult = normalize(parseResult.parsed);
    const validationResult = validate(normalizeResult.document, config);
    const serializedValidation = serialize(validationResult, { pretty: true });

    expect(parseResult).toMatchObject({
      parsed: {
        markdown,
        body: "\n# API Contract\n\nBody text.\n",
        path: contractPath,
        frontmatter: contractFrontmatter,
        document: {
          kind: "markdown-document",
          version: "0.0.0",
          path: contractPath,
          frontmatter: contractFrontmatter,
        },
        diagnostics: [],
      },
      diagnostics: [],
    });
    expect(normalizeResult).toMatchObject({
      document: {
        kind: "markdown-document",
        version: "0.0.0",
        path: contractPath,
        frontmatter: contractFrontmatter,
      },
      diagnostics: [],
    });
    expect(validationResult).toEqual({
      valid: true,
      diagnostics: [],
      ruleResults: [
        {
          ruleId: "frontmatter.required",
          passed: true,
          diagnostics: [],
        },
      ],
    });
    expect(serializedValidation).toBe(`{
  "diagnostics": [],
  "ruleResults": [
    {
      "diagnostics": [],
      "passed": true,
      "ruleId": "frontmatter.required"
    }
  ],
  "valid": true
}`);
  });

  it("VAL-7: keeps raw parser AST fields out of public results", () => {
    const parseResult = parse(markdown);
    const normalizeResult = normalize(parseResult.parsed);

    expect(JSON.stringify(parseResult)).not.toContain('"position"');
    expect(JSON.stringify(normalizeResult)).not.toContain('"position"');
    expect(JSON.stringify(normalizeResult)).not.toContain('"value"');
  });
});
