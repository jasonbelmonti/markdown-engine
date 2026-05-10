import { describe, expect, it } from "vitest";

import type { ValidationProfile } from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

describe("declarative validation compiler assertion proof", () => {
  it("rejects typed text assertions with no predicate before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "text.empty",
          select: { target: "section", title: "Objective" },
          assert: { text: {} },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "text.empty",
        message:
          "text must include contains, containsExactlyOne, or a non-empty excludes array.",
        severity: "error",
      },
    ]);
  });

  it("rejects ids assertions without explicit unique true before execution", () => {
    const invalidIdAssertions = [
      { ids: {}, select: { target: "document" } },
      { ids: { unique: false }, select: { target: "document" } },
      { ids: { column: "ID" }, select: { target: "tableRow" } },
    ] satisfies {
      ids: ValidationProfile["rules"][number]["assert"]["ids"];
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { ids, select } of invalidIdAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "ids.invalid",
            select,
            assert: { ids },
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "ids.invalid",
          message: "ids.unique must be true.",
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed assertions with parser-invalid empty string fields before execution", () => {
    const invalidStringAssertions = [
      {
        assert: { text: { contains: "" } },
        message: "contains must be a non-empty string when provided.",
        select: { target: "section", title: "Objective" },
      },
      {
        assert: { text: { column: "", contains: "ready" } },
        message: "column must be a non-empty string when provided.",
        select: { target: "table" },
      },
      {
        assert: { ids: { unique: true, column: "" } },
        message: "column must be a non-empty string when provided.",
        select: { target: "tableRow" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidStringAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.empty-string",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.empty-string",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed assertions with unsupported keys before execution", () => {
    const invalidUnsupportedKeyAssertions = [
      {
        assert: {
          text: { contains: "Mission", callback: "isMissionReady" },
        },
        message: 'Unsupported validation profile key "callback".',
        select: { target: "section", title: "Objective" },
      },
      {
        assert: {
          matches: "REQ",
          text: { contains: "Mission" },
        },
        message: 'Unsupported validation profile key "matches".',
        select: { target: "section", title: "Objective" },
      },
      {
        assert: {
          references: {
            idsFrom: { section: "Requirements", regexp: "REQ-.*" },
            mustAppearIn: ["Verification"],
          },
        },
        message: 'Unsupported validation profile key "regexp".',
        select: { target: "document" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"] & Record<string, unknown>;
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidUnsupportedKeyAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.unsupported-key",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.unsupportedKey",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed non-object assertion payloads before execution", () => {
    const invalidObjectAssertions = [
      {
        assert: { sectionsRequired: null },
        message: "sectionsRequired must be an object.",
      },
      {
        assert: { ids: null },
        message: "ids must be an object.",
      },
      {
        assert: { frontmatterRequired: null },
        message: "frontmatterRequired must be an object.",
      },
    ];

    for (const { assert, message } of invalidObjectAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.non-object",
            select: { target: "document" },
            assert: assert as unknown as ValidationProfile["rules"][number]["assert"],
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.non-object",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed non-object rule assert payloads before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "assert.non-object",
          select: { target: "document" },
          assert: null as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "assert.non-object",
        message: "Rule assert must be an object.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed references assertions without idsFrom before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "references.missing-ids-from",
          select: { target: "document" },
          assert: {
            references: { mustAppearIn: ["Verification"] },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "references.missing-ids-from",
        message: "references.idsFrom must be an object.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed ids assertions with non-boolean caseSensitive before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "ids.invalid-case-sensitive",
          select: { target: "document" },
          assert: {
            ids: { unique: true, caseSensitive: "no" },
          } as unknown as ValidationProfile["rules"][number]["assert"],
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "ids.invalid-case-sensitive",
        message: "caseSensitive must be a boolean when provided.",
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed assertions with parser-invalid empty string arrays before execution", () => {
    const invalidArrayAssertions = [
      {
        assert: { sectionsRequired: { headings: [] } },
        message:
          "sectionsRequired.headings must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { sectionOrder: { headings: [] } },
        message: "sectionOrder.headings must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { tableColumnsRequired: { columns: [] } },
        message:
          "tableColumnsRequired.columns must be an array of non-empty strings.",
        select: { target: "table" },
      },
      {
        assert: { references: { idsFrom: {}, mustAppearIn: [] } },
        message: "references.mustAppearIn must be an array of non-empty strings.",
        select: { target: "document" },
      },
      {
        assert: { frontmatterRequired: { fields: [] } },
        message:
          "frontmatterRequired.fields must be an array of non-empty strings.",
        select: { target: "frontmatter" },
      },
    ] satisfies {
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
      select: ValidationProfile["rules"][number]["select"];
    }[];

    for (const { assert, message, select } of invalidArrayAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "assertion.empty-array",
            select,
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.config.invalidShape",
          ruleId: "assertion.empty-array",
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("rejects direct typed empty assertion objects before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "assert.empty",
          select: { target: "document" },
          assert: {},
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        ruleId: "assert.empty",
        message: "Rule assert must include at least one supported assertion.",
        severity: "error",
      },
    ]);
  });
});
