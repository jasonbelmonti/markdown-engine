import { describe, expect, it } from "vitest";

import type { MarkdownDiagnostic, SourceRange } from "../src/api/diagnostics.js";
import type { EngineDocument, EngineNode } from "../src/api/document.js";
import {
  CODE_FENCE_LANGUAGES_RULE_ID,
  parseCodeFenceLanguagesRuleConfig,
} from "../src/rules/code-fence-languages-config.js";
import { evaluateCodeFenceLanguagesRule } from "../src/rules/code-fence-languages.js";
import {
  HEADINGS_REQUIRED_RULE_ID,
  parseHeadingsRequiredRuleConfig,
} from "../src/rules/headings-required-config.js";
import { evaluateHeadingsRequiredRule } from "../src/rules/headings-required.js";
import {
  LINKS_ALLOWED_SCHEMES_RULE_ID,
  parseLinksAllowedSchemesRuleConfig,
} from "../src/rules/links-allowed-schemes-config.js";
import { evaluateLinksAllowedSchemesRule } from "../src/rules/links-allowed-schemes.js";
import {
  parseRawHtmlPolicyRuleConfig,
  RAW_HTML_POLICY_RULE_ID,
} from "../src/rules/raw-html-policy-config.js";
import { evaluateRawHtmlPolicyRule } from "../src/rules/raw-html-policy.js";
import {
  parseRequiredFrontmatterRuleConfig,
  REQUIRED_FRONTMATTER_RULE_ID,
} from "../src/rules/required-frontmatter-config.js";
import { evaluateRequiredFrontmatterRule } from "../src/rules/required-frontmatter.js";

const locatedRange: SourceRange = {
  start: {
    line: 3,
    column: 1,
    offset: 18,
  },
  end: {
    line: 3,
    column: 14,
    offset: 31,
  },
};

interface InvalidConfigCase {
  readonly name: string;
  readonly parse: (config: unknown) => { diagnostic?: MarkdownDiagnostic };
  readonly config: unknown;
  readonly expectedDiagnostic: MarkdownDiagnostic;
}

describe("direct built-in rule evaluators", () => {
  it("covers frontmatter.required passing and failing fixtures", () => {
    const passing = evaluateRequiredFrontmatterRule(
      document({ frontmatter: { owner: "validation", title: "Mission" } }),
      {
        ruleId: REQUIRED_FRONTMATTER_RULE_ID,
        fields: ["title", "owner"],
        severity: "error",
      },
    );
    const failing = evaluateRequiredFrontmatterRule(
      document({ frontmatter: { title: "Mission" } }),
      {
        ruleId: REQUIRED_FRONTMATTER_RULE_ID,
        fields: ["owner"],
        severity: "info",
      },
    );

    expect(passing).toEqual({
      ruleId: REQUIRED_FRONTMATTER_RULE_ID,
      passed: true,
      diagnostics: [],
    });
    expect(failing).toEqual({
      ruleId: REQUIRED_FRONTMATTER_RULE_ID,
      passed: false,
      diagnostics: [
        {
          code: "frontmatter.required.missing",
          ruleId: REQUIRED_FRONTMATTER_RULE_ID,
          message: 'Required frontmatter field "owner" is missing.',
          severity: "info",
        },
      ],
    });
  });

  it("covers headings.required passing and failing fixtures", () => {
    const passing = evaluateHeadingsRequiredRule(
      document({ children: [heading("Mission Brief")] }),
      {
        ruleId: HEADINGS_REQUIRED_RULE_ID,
        headings: ["Mission Brief"],
        severity: "error",
      },
    );
    const failing = evaluateHeadingsRequiredRule(
      document({ children: [heading("Mission Brief")] }),
      {
        ruleId: HEADINGS_REQUIRED_RULE_ID,
        headings: ["Mission Brief", "Validation Gates"],
        severity: "warning",
      },
    );

    expect(passing).toEqual({
      ruleId: HEADINGS_REQUIRED_RULE_ID,
      passed: true,
      diagnostics: [],
    });
    expect(failing).toEqual({
      ruleId: HEADINGS_REQUIRED_RULE_ID,
      passed: false,
      diagnostics: [
        {
          code: "headings.required.missing",
          ruleId: HEADINGS_REQUIRED_RULE_ID,
          message: 'Required heading "Validation Gates" is missing.',
          severity: "warning",
        },
      ],
    });
  });

  it("covers codeFences.languages passing and source-located failing fixtures", () => {
    const passing = evaluateCodeFenceLanguagesRule(
      document({ children: [codeFence({ lang: "ts" })] }),
      {
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        allowed: ["ts"],
        requireLanguage: true,
        severity: "error",
      },
    );
    const missingLanguage = evaluateCodeFenceLanguagesRule(
      document({ children: [codeFence()] }),
      {
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        allowed: ["ts"],
        requireLanguage: true,
        severity: "error",
      },
    );
    const unsupportedLanguage = evaluateCodeFenceLanguagesRule(
      document({ children: [codeFence({ lang: "js" })] }),
      {
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        allowed: ["ts"],
        requireLanguage: true,
        severity: "error",
      },
    );

    expect(passing).toEqual({
      ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
      passed: true,
      diagnostics: [],
    });
    expect(missingLanguage.diagnostics).toEqual([
      {
        code: "codeFences.languages.missing",
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        message: "Code fence language is required.",
        severity: "error",
        sourceRange: locatedRange,
      },
    ]);
    expect(unsupportedLanguage.diagnostics).toEqual([
      {
        code: "codeFences.languages.unsupported",
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        message: 'Code fence language "js" is not allowed.',
        severity: "error",
        sourceRange: locatedRange,
      },
    ]);
  });

  it("covers links.allowedSchemes passing and source-located failing fixtures", () => {
    const passing = evaluateLinksAllowedSchemesRule(
      document({ children: [link("HTTPS://example.com")] }),
      {
        ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
        schemes: ["https"],
        severity: "error",
      },
    );
    const failing = evaluateLinksAllowedSchemesRule(
      document({ children: [link("ftp://example.com")] }),
      {
        ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
        schemes: ["https"],
        severity: "error",
      },
    );

    expect(passing).toEqual({
      ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
      passed: true,
      diagnostics: [],
    });
    expect(failing).toEqual({
      ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
      passed: false,
      diagnostics: [
        {
          code: "links.allowedSchemes.disallowed",
          ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
          message: 'Link URL scheme "ftp" is not allowed.',
          severity: "error",
          sourceRange: locatedRange,
        },
      ],
    });
  });

  it("covers rawHtml.policy passing and source-located failing fixtures", () => {
    const passing = evaluateRawHtmlPolicyRule(
      document({ children: [html()] }),
      {
        ruleId: RAW_HTML_POLICY_RULE_ID,
        policy: "allow",
      },
    );
    const failing = evaluateRawHtmlPolicyRule(
      document({ children: [html()] }),
      {
        ruleId: RAW_HTML_POLICY_RULE_ID,
        policy: "deny",
      },
    );
    const warning = evaluateRawHtmlPolicyRule(
      document({ children: [html()] }),
      {
        ruleId: RAW_HTML_POLICY_RULE_ID,
        policy: "warn",
      },
    );

    expect(passing).toEqual({
      ruleId: RAW_HTML_POLICY_RULE_ID,
      passed: true,
      diagnostics: [],
    });
    expect(failing).toEqual({
      ruleId: RAW_HTML_POLICY_RULE_ID,
      passed: false,
      diagnostics: [
        {
          code: "rawHtml.policy.denied",
          ruleId: RAW_HTML_POLICY_RULE_ID,
          message: "Raw HTML is not allowed by policy.",
          severity: "error",
          sourceRange: locatedRange,
        },
      ],
    });
    expect(warning.diagnostics).toEqual([
      {
        code: "rawHtml.policy.warned",
        ruleId: RAW_HTML_POLICY_RULE_ID,
        message: "Raw HTML is present.",
        severity: "warning",
        sourceRange: locatedRange,
      },
    ]);
  });
});

describe("direct built-in rule config parsers", () => {
  it("normalizes valid configs for every built-in rule", () => {
    expect(
      parseRequiredFrontmatterRuleConfig({
        fields: ["title"],
        severity: "warning",
      }),
    ).toEqual({
      rule: {
        ruleId: REQUIRED_FRONTMATTER_RULE_ID,
        fields: ["title"],
        severity: "warning",
      },
    });
    expect(
      parseHeadingsRequiredRuleConfig({
        headings: ["Mission Brief"],
      }),
    ).toEqual({
      rule: {
        ruleId: HEADINGS_REQUIRED_RULE_ID,
        headings: ["Mission Brief"],
        severity: "error",
      },
    });
    expect(
      parseCodeFenceLanguagesRuleConfig({
        allowed: ["ts"],
        requireLanguage: true,
      }),
    ).toEqual({
      rule: {
        ruleId: CODE_FENCE_LANGUAGES_RULE_ID,
        allowed: ["ts"],
        requireLanguage: true,
        severity: "error",
      },
    });
    expect(
      parseLinksAllowedSchemesRuleConfig({
        schemes: ["HTTPS"],
        severity: "info",
      }),
    ).toEqual({
      rule: {
        ruleId: LINKS_ALLOWED_SCHEMES_RULE_ID,
        schemes: ["https"],
        severity: "info",
      },
    });
    expect(parseRawHtmlPolicyRuleConfig({ policy: "warn" })).toEqual({
      rule: {
        ruleId: RAW_HTML_POLICY_RULE_ID,
        policy: "warn",
      },
    });
  });

  it.each(invalidConfigCases)(
    "rejects malformed $name config with deterministic diagnostics",
    ({ parse, config, expectedDiagnostic }) => {
      expect(parse(config)).toEqual({
        diagnostic: expectedDiagnostic,
      });
    },
  );
});

const invalidConfigCases: InvalidConfigCase[] = [
  {
    name: REQUIRED_FRONTMATTER_RULE_ID,
    parse: parseRequiredFrontmatterRuleConfig,
    config: { fields: [] },
    expectedDiagnostic: invalidConfigDiagnostic(
      REQUIRED_FRONTMATTER_RULE_ID,
      "Rule frontmatter.required fields must be a non-empty string array.",
    ),
  },
  {
    name: `${REQUIRED_FRONTMATTER_RULE_ID} severity`,
    parse: parseRequiredFrontmatterRuleConfig,
    config: { fields: ["title"], severity: "notice" },
    expectedDiagnostic: invalidConfigDiagnostic(
      REQUIRED_FRONTMATTER_RULE_ID,
      "Rule frontmatter.required severity must be error, warning, or info.",
    ),
  },
  {
    name: HEADINGS_REQUIRED_RULE_ID,
    parse: parseHeadingsRequiredRuleConfig,
    config: null,
    expectedDiagnostic: invalidConfigDiagnostic(
      HEADINGS_REQUIRED_RULE_ID,
      "Rule headings.required must be an object with a headings array.",
    ),
  },
  {
    name: `${HEADINGS_REQUIRED_RULE_ID} headings`,
    parse: parseHeadingsRequiredRuleConfig,
    config: { headings: [""] },
    expectedDiagnostic: invalidConfigDiagnostic(
      HEADINGS_REQUIRED_RULE_ID,
      "Rule headings.required headings must be a non-empty string array.",
    ),
  },
  {
    name: CODE_FENCE_LANGUAGES_RULE_ID,
    parse: parseCodeFenceLanguagesRuleConfig,
    config: {},
    expectedDiagnostic: invalidConfigDiagnostic(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages must set allowed or requireLanguage.",
    ),
  },
  {
    name: `${CODE_FENCE_LANGUAGES_RULE_ID} allowed`,
    parse: parseCodeFenceLanguagesRuleConfig,
    config: { allowed: [""], requireLanguage: true },
    expectedDiagnostic: invalidConfigDiagnostic(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages allowed must be a non-empty string array.",
    ),
  },
  {
    name: `${CODE_FENCE_LANGUAGES_RULE_ID} requireLanguage`,
    parse: parseCodeFenceLanguagesRuleConfig,
    config: { requireLanguage: "yes" },
    expectedDiagnostic: invalidConfigDiagnostic(
      CODE_FENCE_LANGUAGES_RULE_ID,
      "Rule codeFences.languages requireLanguage must be a boolean.",
    ),
  },
  {
    name: LINKS_ALLOWED_SCHEMES_RULE_ID,
    parse: parseLinksAllowedSchemesRuleConfig,
    config: { schemes: [] },
    expectedDiagnostic: invalidConfigDiagnostic(
      LINKS_ALLOWED_SCHEMES_RULE_ID,
      "Rule links.allowedSchemes schemes must be a non-empty string array.",
    ),
  },
  {
    name: `${LINKS_ALLOWED_SCHEMES_RULE_ID} severity`,
    parse: parseLinksAllowedSchemesRuleConfig,
    config: { schemes: ["https"], severity: "fatal" },
    expectedDiagnostic: invalidConfigDiagnostic(
      LINKS_ALLOWED_SCHEMES_RULE_ID,
      "Rule links.allowedSchemes severity must be error, warning, or info.",
    ),
  },
  {
    name: RAW_HTML_POLICY_RULE_ID,
    parse: parseRawHtmlPolicyRuleConfig,
    config: "deny",
    expectedDiagnostic: invalidConfigDiagnostic(
      RAW_HTML_POLICY_RULE_ID,
      "Rule rawHtml.policy must be an object with a policy value.",
    ),
  },
  {
    name: `${RAW_HTML_POLICY_RULE_ID} policy`,
    parse: parseRawHtmlPolicyRuleConfig,
    config: { policy: "sanitize" },
    expectedDiagnostic: invalidConfigDiagnostic(
      RAW_HTML_POLICY_RULE_ID,
      "Rule rawHtml.policy policy must be allow, warn, or deny.",
    ),
  },
];

function document(
  overrides: Partial<Omit<EngineDocument, "kind" | "version">> = {},
): EngineDocument {
  return {
    kind: "markdown-document",
    version: "0.0.0",
    children: [],
    ...overrides,
  };
}

function heading(text: string): EngineNode {
  return {
    type: "heading",
    text,
  };
}

function codeFence(attributes: Record<string, unknown> = {}): EngineNode {
  return {
    type: "code",
    attributes: {
      kind: "fenced",
      ...attributes,
    },
    sourceRange: locatedRange,
  };
}

function link(url: string): EngineNode {
  return {
    type: "link",
    attributes: {
      url,
    },
    sourceRange: locatedRange,
  };
}

function html(): EngineNode {
  return {
    type: "html",
    sourceRange: locatedRange,
  };
}

function invalidConfigDiagnostic(
  ruleId: string,
  message: string,
): MarkdownDiagnostic {
  return {
    code: "config.rule.invalid",
    ruleId,
    message,
    severity: "error",
  };
}
