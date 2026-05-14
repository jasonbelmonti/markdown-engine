import { describe, expect, it } from "vitest";

import type { ValidationProfile } from "@jasonbelmonti/markdown-engine";
import { compileValidationProfile } from "../src/declarative-validation/compiler/index.js";

describe("declarative validation compiler direct profile proof", () => {
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

  it("rejects unsupported direct typed profile root keys before plan creation", () => {
    const invalidProfiles = [
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [],
          callback: () => "not part of the compiled plan",
        },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "callback".',
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [],
          plugin: () => "mission-control",
        },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "plugin".',
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

  it("rejects unsupported direct typed rule keys and duplicate rule ids before plan creation", () => {
    const invalidProfiles = [
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "rule.notes",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Objective"] } },
              notes: () => "not part of the public profile contract",
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.unsupportedKey",
            message: 'Unsupported validation profile key "notes".',
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "duplicate",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Objective"] } },
            },
            {
              id: "duplicate",
              select: { target: "document" },
              assert: { sectionsRequired: { headings: ["Verification"] } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: 'Profile rule at index 1 duplicates rule id "duplicate".',
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
    let rulesProxyTrapExecuted = false;
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
    const throwingRulesProxy = new Proxy([], {
      get: (target, property, receiver) => {
        if (property === "length") {
          rulesProxyTrapExecuted = true;
          throw new Error("rules length trap must not escape");
        }

        return Reflect.get(target, property, receiver);
      },
    });
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
          rules: throwingRulesProxy,
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message: "Profile.rules must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "selector.depth",
              select: { target: "section", depth: Number.NaN },
              assert: { text: { contains: "Objective" } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].select.depth must contain only JSON-safe data properties.",
            severity: "error",
          },
        ],
      },
      {
        profile: {
          syntaxVersion: "markdown-engine.validation@v1",
          rules: [
            {
              id: "text-length.non-finite",
              select: { target: "section", title: "Objective" },
              assert: { textLength: { min: Number.POSITIVE_INFINITY } },
            },
          ],
        },
        diagnostics: [
          {
            code: "profile.config.invalidShape",
            message:
              "Profile.rules[0].assert.textLength.min must contain only JSON-safe data properties.",
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
    expect(rulesProxyTrapExecuted).toBe(false);
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
});

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
