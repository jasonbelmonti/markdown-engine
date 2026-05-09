import { describe, expect, it } from "vitest";

import type { ValidationProfile } from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

describe("declarative validation compiler proof", () => {
  it("compiles supported profiles into private data-only rule records", () => {
    const result = compileValidationProfile(supportedProfile);

    expect(result.diagnostics).toEqual([]);
    expect(result.plan).toMatchObject({
      rules: [
        {
          ruleId: "objective.contains",
          severity: "error",
          selector: { target: "section", title: "Objective" },
          assertions: [{ kind: "text", contains: "architecture viable" }],
        },
        {
          ruleId: "document.required-sections",
          selector: { target: "document" },
          assertions: [
            {
              kind: "sectionsRequired",
              headings: ["Objective", "Verification"],
              order: "strict",
            },
            {
              kind: "sectionOrder",
              headings: ["Objective", "Verification"],
            },
          ],
        },
        {
          ruleId: "table.columns",
          selector: { target: "table", header: ["Step", "State"] },
          assertions: [{ kind: "tableColumnsRequired", columns: ["Owner"] }],
        },
        {
          ruleId: "table.ids",
          selector: { target: "tableRow", tableHeader: ["ID"], where: { column: "State", equals: "ready" } },
          assertions: [
            {
              kind: "ids",
              unique: true,
              caseSensitive: false,
              column: "ID",
              prefix: "REQ",
            },
          ],
        },
        {
          ruleId: "references.required",
          selector: { target: "document" },
          assertions: [
            {
              kind: "references",
              idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
              mustAppearIn: ["Verification"],
            },
          ],
        },
        {
          ruleId: "occurrences",
          selector: { target: "textSpan", nodeType: "paragraph" },
          assertions: [{ kind: "textOccurrenceCount", text: "MUST", count: 1 }],
        },
        {
          ruleId: "frontmatter.required",
          selector: { target: "frontmatter" },
          assertions: [{ kind: "frontmatterRequired", fields: ["title", "owner"] }],
        },
      ],
    });
    expect(result.plan).not.toHaveProperty("profile");
    expect(containsFunction(result.plan)).toBe(false);

    const profileWithUnsafeRootValue = {
      ...supportedProfile,
      callback: () => "not part of the compiled plan",
    } as unknown as ValidationProfile;
    const closedResult = compileValidationProfile(profileWithUnsafeRootValue);

    expect(closedResult.plan).toBeUndefined();
    expect(closedResult.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message: "Profile.callback must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(containsFunction(closedResult.plan)).toBe(false);
  });

  it("rejects direct typed profile containers before plan creation", () => {
    const accessorRules: unknown[] = [];
    accessorRules.length = 1;
    Object.defineProperty(accessorRules, "0", {
      get: () => ({
        id: "accessor.rule",
        select: { target: "document" },
        assert: { sectionsRequired: { headings: ["Objective"] } },
      }),
    });

    const invalidProfiles = [
      {
        profile: null,
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile must be an object.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: accessorRules,
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.rules[0] must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: {
            flatMap: () => [
              {
                ruleId: () => "function-bearing compiled rule",
                severity: "error",
                selector: { target: "document" },
                assertions: [],
              },
            ],
          },
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.rules.flatMap must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [null],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile rule at index 0 must be an object.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      profile: unknown;
      diagnostics: unknown[];
    }[];

    for (const { profile, diagnostics } of invalidProfiles) {
      const result = compileValidationProfile(profile as ValidationProfile);

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
      expect(containsFunction(result.plan)).toBe(false);
    }
  });

  it("ignores caller-owned array methods and iterators before plan creation", () => {
    const rules = [
      {
        id: "document.required-sections",
        select: { target: "document" },
        assert: {
          sectionsRequired: {
            headings: poisonedStringArray(["Objective", "Verification"]),
          },
        },
      },
      {
        id: "table.columns",
        select: {
          target: "table",
          header: poisonedStringArray(["Step", "State"]),
        },
        assert: {
          tableColumnsRequired: {
            columns: poisonedStringArray(["Owner"]),
          },
        },
      },
      {
        id: "document.text-excludes",
        select: { target: "document" },
        assert: {
          text: {
            excludes: poisonedStringArray(["forbidden"]),
          },
        },
      },
    ] as unknown as ValidationProfile["rules"] & {
      flatMap: () => unknown[];
    };
    Object.defineProperty(rules, "flatMap", {
      value: () => [
        {
          ruleId: () => "function-bearing compiled rule",
          severity: "error",
          selector: { target: "document" },
          assertions: [],
        },
      ],
    });
    Object.defineProperty(rules, Symbol.iterator, {
      value: function* poisonedRulesIterator() {
        yield {
          ruleId: () => "function-bearing compiled rule",
          severity: "error",
          selector: { target: "document" },
          assertions: [],
        };
      },
    });

    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules,
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.plan?.rules.map((rule) => rule.ruleId)).toEqual([
      "document.required-sections",
      "table.columns",
      "document.text-excludes",
    ]);
    expect(result.plan?.rules[0]?.assertions[0]).toMatchObject({
      kind: "sectionsRequired",
      headings: ["Objective", "Verification"],
    });
    expect(result.plan?.rules[1]?.selector).toMatchObject({
      target: "table",
      header: ["Step", "State"],
    });
    expect(result.plan?.rules[1]?.assertions[0]).toMatchObject({
      kind: "tableColumnsRequired",
      columns: ["Owner"],
    });
    expect(result.plan?.rules[2]?.assertions[0]).toMatchObject({
      kind: "text",
      excludes: ["forbidden"],
    });
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("rejects direct typed selector and assertion accessors before plan creation", () => {
    const selectorWithAccessor = { target: "section" };
    Object.defineProperty(selectorWithAccessor, "title", {
      enumerable: true,
      get: () => "Objective",
    });
    const textWithAccessor = {};
    Object.defineProperty(textWithAccessor, "contains", {
      enumerable: true,
      get: () => "ready",
    });

    const invalidAccessorProfiles = [
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "selector.accessor",
              select: selectorWithAccessor,
              assert: { text: { contains: "ready" } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].select.title must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "assertion.accessor",
              select: { target: "section", title: "Objective" },
              assert: { text: textWithAccessor },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].assert.text.contains must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      profile: unknown;
      diagnostics: unknown[];
    }[];

    for (const { profile, diagnostics } of invalidAccessorProfiles) {
      const result = compileValidationProfile(profile as ValidationProfile);

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
      expect(containsFunction(result.plan)).toBe(false);
    }
  });

  it("rejects direct typed __proto__ data before plan creation", () => {
    const selector = { target: "document" } as Record<string, unknown>;
    Object.defineProperty(selector, "__proto__", {
      enumerable: true,
      value: {
        toJSON: () => "not data",
      },
    });
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "selector.proto",
          select: selector,
          assert: { sectionsRequired: { headings: ["Objective"] } },
        },
      ],
    } as unknown as ValidationProfile);

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message:
          "Profile.rules[0].select.__proto__ must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("rejects cyclic typed profile data before plan creation", () => {
    const selector = { target: "document" } as Record<string, unknown>;
    selector.self = selector;

    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "selector.cycle",
          select: selector,
          assert: { sectionsRequired: { headings: ["Objective"] } },
        },
      ],
    } as unknown as ValidationProfile);

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message:
          "Profile.rules[0].select.self must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
    expect(containsFunction(result.plan)).toBe(false);
  });

  it("rejects typed proxy traps and non-finite numbers before plan creation", () => {
    let proxyTrapExecuted = false;
    const throwingProxyProfile = new Proxy(
      {
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [],
      },
      {
        ownKeys: () => {
          proxyTrapExecuted = true;
          throw new Error("ownKeys trap must not escape");
        },
      },
    );
    const invalidProfiles = [
      {
        profile: throwingProxyProfile,
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [],
          note: Number.NaN,
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.note must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      profile: unknown;
      diagnostics: unknown[];
    }[];

    for (const { profile, diagnostics } of invalidProfiles) {
      const result = compileValidationProfile(profile as ValidationProfile);

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
      expect(containsFunction(result.plan)).toBe(false);
    }

    expect(proxyTrapExecuted).toBe(false);
  });

  it("rejects direct typed rule metadata before plan creation", () => {
    const invalidRuleMetadata = [
      {
        rule: {
          id: () => "objective.contains",
          select: { target: "section", title: "Objective" },
          assert: { text: { contains: "ready" } },
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.rules[0].id must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        rule: {
          id: "objective.contains",
          severity: () => "error",
          select: { target: "section", title: "Objective" },
          assert: { text: { contains: "ready" } },
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].severity must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
    ] satisfies {
      rule: unknown;
      diagnostics: unknown[];
    }[];

    for (const { rule, diagnostics } of invalidRuleMetadata) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          rule as unknown as ValidationProfile["rules"][number],
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual(diagnostics);
      expect(containsFunction(result.plan)).toBe(false);
    }
  });

  it("rejects incompatible selector and assertion pairs before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "section.requires.sections",
          select: { target: "section", title: "Objective" },
          assert: { sectionsRequired: { headings: ["Objective"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "section.requires.sections",
        message: 'Assertion "sectionsRequired" is compatible only with document selectors.',
        severity: "error",
      },
    ]);
  });

  it("rejects column-scoped assertions outside table selector targets", () => {
    const invalidColumnAssertions = [
      {
        id: "section.column-text",
        assert: { text: { column: "State", contains: "ready" } },
        message:
          'Assertion "text" with a column option is compatible only with table or tableRow selectors.',
      },
      {
        id: "section.column-ids",
        assert: { ids: { unique: true, column: "ID" } },
        message:
          'Assertion "ids" with a column option is compatible only with table or tableRow selectors.',
      },
      {
        id: "section.column-occurrences",
        assert: { textOccurrenceCount: { text: "ready", count: 1, column: "State" } },
        message:
          'Assertion "textOccurrenceCount" with a column option is compatible only with table or tableRow selectors.',
      },
    ] satisfies {
      id: string;
      assert: ValidationProfile["rules"][number]["assert"];
      message: string;
    }[];

    for (const { id, assert, message } of invalidColumnAssertions) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id,
            select: { target: "section", title: "Objective" },
            assert,
          },
        ],
      });

      expect(result.plan).toBeUndefined();
      expect(result.diagnostics).toEqual([
        {
          code: "profile.compile.incompatibleSelectorAssertion",
          ruleId: id,
          message,
          severity: "error",
        },
      ]);
    }
  });

  it("applies frontmatter selector compatibility before execution", () => {
    for (const select of [
      { target: "document" },
      { target: "frontmatter" },
    ] satisfies ValidationProfile["rules"][number]["select"][]) {
      const result = compileValidationProfile({
        syntaxVersion: "markdown-engine.validation@v1",
        rules: [
          {
            id: "frontmatter.allowed",
            select,
            assert: { frontmatterRequired: { fields: ["title"] } },
          },
        ],
      });

      expect(result.diagnostics).toEqual([]);
      expect(result.plan?.rules).toHaveLength(1);
    }

    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "frontmatter.filtered",
          select: { target: "frontmatter", field: "title" },
          assert: { frontmatterRequired: { fields: ["title"] } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.compile.incompatibleSelectorAssertion",
        ruleId: "frontmatter.filtered",
        message:
          'Assertion "frontmatterRequired" is compatible only with document selectors or unfiltered frontmatter selectors.',
        severity: "error",
      },
    ]);
  });

  it("rejects direct typed selectors with unsupported keys before execution", () => {
    const result = compileValidationProfile({
      syntaxVersion: "markdown-engine.validation@v1",
      rules: [
        {
          id: "selector.unsupported-key",
          select: {
            target: "section",
            title: "Objective",
            callback: () => true,
          } as unknown as ValidationProfile["rules"][number]["select"],
          assert: { text: { contains: "ready" } },
        },
      ],
    });

    expect(result.plan).toBeUndefined();
    expect(result.diagnostics).toEqual([
      {
        code: "profile.config.invalidShape",
        message:
          "Profile.rules[0].select.callback must contain only JSON-safe data properties.",
        severity: "error",
      },
    ]);
  });

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

const supportedProfile = {
  syntaxVersion: "markdown-engine.validation@v1",
  documentVersion: "1.0.0",
  rules: [
    {
      id: "objective.contains",
      select: { target: "section", title: "Objective" },
      assert: { text: { contains: "architecture viable" } },
    },
    {
      id: "document.required-sections",
      select: { target: "document" },
      assert: {
        sectionsRequired: {
          headings: ["Objective", "Verification"],
          order: "strict",
        },
        sectionOrder: {
          headings: ["Objective", "Verification"],
        },
      },
    },
    {
      id: "table.columns",
      select: { target: "table", header: ["Step", "State"] },
      assert: { tableColumnsRequired: { columns: ["Owner"] } },
    },
    {
      id: "table.ids",
      select: {
        target: "tableRow",
        tableHeader: ["ID"],
        where: { column: "State", equals: "ready" },
      },
      assert: {
        ids: {
          column: "ID",
          prefix: "REQ",
          unique: true,
          caseSensitive: false,
        },
      },
    },
    {
      id: "references.required",
      select: { target: "document" },
      assert: {
        references: {
          idsFrom: { section: "Requirements", column: "ID", prefix: "REQ" },
          mustAppearIn: ["Verification"],
        },
      },
    },
    {
      id: "occurrences",
      select: { target: "textSpan", nodeType: "paragraph" },
      assert: { textOccurrenceCount: { text: "MUST", count: 1 } },
    },
    {
      id: "frontmatter.required",
      select: { target: "frontmatter" },
      assert: { frontmatterRequired: { fields: ["title", "owner"] } },
    },
  ],
} satisfies ValidationProfile;

function containsFunction(value: unknown): boolean {
  if (typeof value === "function") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsFunction(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).some((item) => containsFunction(item));
  }

  return false;
}

function poisonedStringArray(values: readonly string[]): readonly string[] {
  const array = values.slice() as string[] & {
    every: () => boolean;
  };
  Object.defineProperty(array, "every", {
    value: () => true,
  });
  Object.defineProperty(array, Symbol.iterator, {
    value: function* poisonedStringIterator() {
      yield () => "function-bearing array item";
    },
  });

  return array;
}
