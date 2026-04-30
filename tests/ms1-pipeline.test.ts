import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  normalize,
  parse,
  serialize,
  validate,
  type ValidationConfig,
} from "markdown-engine";

const fixturePath = "fixtures/representative.md";
const fixture = readFileSync(
  new URL("../fixtures/representative.md", import.meta.url),
  "utf8",
);

const provingConfig = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
  },
} satisfies ValidationConfig;

describe("MS-1 proving pipeline", () => {
  it("VAL-3/VAL-4: normalizes the representative fixture and validates one deterministic rule", () => {
    const parseResult = parse(fixture, { path: fixturePath });
    const normalizeResult = normalize(parseResult.parsed);
    const validationResult = validate(normalizeResult.document, provingConfig);

    expect(normalizeResult.diagnostics).toEqual([]);
    expect(normalizeResult.document).toMatchObject({
      kind: "markdown-document",
      version: "0.0.0",
      path: fixturePath,
      frontmatter: {
        title: "Representative parser fixture",
        status: "draft",
        tags: ["parser", "frontmatter"],
        owner: "markdown-engine",
      },
    });
    expect(normalizeResult.document.children[0]).toMatchObject({
      type: "heading",
      text: "Mission Brief",
      attributes: { depth: 1 },
      sourceRange: {
        start: { line: 10, column: 1, offset: expect.any(Number) },
      },
    });

    expect(findNode(normalizeResult.document.children, "html")).toMatchObject({
      type: "html",
      text: '<div data-engine="inert">Raw HTML data</div>',
      sourceRange: {
        start: { line: 20, column: 1, offset: expect.any(Number) },
      },
    });
    expect(JSON.stringify(normalizeResult.document)).not.toContain('"position"');
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

    const normalizedJson = serialize(normalizeResult, { pretty: true });
    const validationJson = serialize(validationResult, { pretty: true });
    const serializedNormalizeResult = JSON.parse(normalizedJson) as {
      document: {
        frontmatter?: unknown;
        children: Array<{ type: string; text?: string }>;
      };
      diagnostics: unknown[];
    };

    expect(serializedNormalizeResult).toMatchObject({
      document: {
        frontmatter: {
          title: "Representative parser fixture",
          owner: "markdown-engine",
        },
      },
      diagnostics: [],
    });
    expect(serializedNormalizeResult.document.children[0]).toMatchObject({
      type: "heading",
      text: "Mission Brief",
    });
    expect(validationJson).toBe(`{
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
    expect(JSON.parse(validationJson)).toEqual(validationResult);
  });

  it("VAL-4: emits explicit diagnostics for missing required frontmatter and unsupported rules", () => {
    const document = normalize(parse("# Body\n").parsed).document;
    const validationResult = validate(document, {
      rules: {
        "frontmatter.required": {
          fields: ["title", "owner"],
        },
        "semantic.summaryQuality": {
          threshold: "high",
        },
      },
    });

    expect(validationResult.valid).toBe(false);
    expect(validationResult.ruleResults).toHaveLength(1);
    expect(validationResult.ruleResults[0]).toMatchObject({
      ruleId: "frontmatter.required",
      passed: false,
      diagnostics: [
        {
          code: "frontmatter.required.missing",
          ruleId: "frontmatter.required",
          severity: "error",
          message: 'Required frontmatter field "title" is missing.',
        },
        {
          code: "frontmatter.required.missing",
          ruleId: "frontmatter.required",
          severity: "error",
          message: 'Required frontmatter field "owner" is missing.',
        },
      ],
    });
    expect(
      validationResult.diagnostics.map((diagnostic) => [
        diagnostic.code,
        diagnostic.ruleId,
      ]),
    ).toEqual([
      ["config.rule.unsupported", "semantic.summaryQuality"],
      ["frontmatter.required.missing", "frontmatter.required"],
      ["frontmatter.required.missing", "frontmatter.required"],
    ]);
  });

  it("VAL-4: rejects empty frontmatter required field lists", () => {
    const document = normalize(parse(fixture).parsed).document;
    const validationResult = validate(document, {
      rules: {
        "frontmatter.required": {
          fields: [],
        },
      },
    });

    expect(validationResult).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "config.rule.invalid",
          ruleId: "frontmatter.required",
          severity: "error",
          message:
            "Rule frontmatter.required fields must be a non-empty string array.",
        },
      ],
      ruleResults: [],
    });
  });
});

function findNode(
  nodes: Array<{ type: string; children?: Array<{ type: string }> }>,
  type: string,
): { type: string } | undefined {
  const queue = [...nodes];

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === undefined) {
      continue;
    }

    if (node.type === type) {
      return node;
    }

    queue.push(...(node.children ?? []));
  }

  return undefined;
}
