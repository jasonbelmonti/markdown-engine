import { describe, expect, it } from "vitest";

import {
  EngineCompatibilityError,
  normalize,
  parse,
  serialize,
  validate,
  type EngineCompatibilityMode,
  type EngineDocumentVersion,
  type ValidationConfig,
} from "@jasonbelmonti/markdown-engine";

const markdown = `---
title: Compatibility Gate
owner: markdown-engine
---

# Compatibility Gate

Body text.
`;
const fixturePath = "compatibility.md";
const validationConfig = {
  rules: {
    "frontmatter.required": {
      fields: ["title", "owner"],
    },
  },
} satisfies ValidationConfig;

describe("BEL-948 rich IR compatibility contract gate", () => {
  it("preserves the legacy parse, normalize, validate, and serialize flow without an explicit mode", () => {
    const parseResult = parse(markdown, { path: fixturePath });
    const normalizeResult = normalize(parseResult.parsed);
    const validationResult = validate(normalizeResult.document, validationConfig);

    expect(normalizeResult.document.version).toBe("0.0.0");
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
    expect(serialize(validationResult, { pretty: true })).toBe(`{
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
    expect(() => serialize(normalizeResult, { pretty: true })).not.toThrow();
  });

  it("accepts explicit legacy mode for 0.1-compatible document-bearing results", () => {
    const parseResult = parse(markdown, { path: fixturePath });
    const normalizeResult = normalize(parseResult.parsed);

    expect(
      JSON.parse(serialize(parseResult, { compatibilityMode: "legacy-0.1" })),
    ).toMatchObject({
      parsed: {
        document: {
          version: "0.0.0",
        },
      },
    });
    expect(
      JSON.parse(serialize(normalizeResult, { compatibilityMode: "legacy-0.1" })),
    ).toMatchObject({
      document: {
        version: "0.0.0",
      },
    });
  });

  it("accepts explicit default mode for 1.0 draft document-bearing results", () => {
    const draftDocument = normalize(parse(markdown, { path: fixturePath }).parsed, {
      documentVersion: "1.0.0-draft",
    }).document;

    expect(
      JSON.parse(serialize(draftDocument, { compatibilityMode: "default" })),
    ).toMatchObject({
      version: "1.0.0-draft",
      compatibility: {
        mode: "default",
      },
    });
  });

  it("rejects default mode when the document-bearing result is legacy", () => {
    const legacyDocument = normalize(parse(markdown).parsed).document;

    expectCompatibilityError(
      () => serialize(legacyDocument, { compatibilityMode: "default" }),
      {
        requestedMode: "default",
        expectedVersion: "1.0.0-draft",
        actualVersion: "0.0.0",
      },
    );
  });

  it("rejects legacy mode when the document-bearing result is 1.0 draft", () => {
    const draftNormalizeResult = normalize(parse(markdown).parsed, {
      documentVersion: "1.0.0-draft",
    });

    expectCompatibilityError(
      () => serialize(draftNormalizeResult, { compatibilityMode: "legacy-0.1" }),
      {
        requestedMode: "legacy-0.1",
        expectedVersion: "0.0.0",
        actualVersion: "1.0.0-draft",
      },
    );
  });

  it("does not reject explicit modes when the public result has no document version", () => {
    const validationResult = validate(normalize(parse(markdown).parsed).document);

    expect(() =>
      serialize(validationResult, { compatibilityMode: "default" }),
    ).not.toThrow();
  });
});

function expectCompatibilityError(
  action: () => void,
  expected: {
    requestedMode: EngineCompatibilityMode;
    expectedVersion: EngineDocumentVersion;
    actualVersion: string;
  },
): void {
  let thrown: unknown;

  try {
    action();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(EngineCompatibilityError);

  if (!(thrown instanceof EngineCompatibilityError)) {
    return;
  }

  expect({
    name: thrown.name,
    code: thrown.code,
    requestedMode: thrown.requestedMode,
    expectedVersion: thrown.expectedVersion,
    actualVersion: thrown.actualVersion,
    message: thrown.message,
  }).toEqual({
    name: "EngineCompatibilityError",
    code: "engine.compatibility.versionMismatch",
    requestedMode: expected.requestedMode,
    expectedVersion: expected.expectedVersion,
    actualVersion: expected.actualVersion,
    message: `Compatibility mode "${expected.requestedMode}" expects document version "${expected.expectedVersion}" but received "${expected.actualVersion}".`,
  });
}
