import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { documentQueries } from "../../api/document-queries.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationRule,
} from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";

export function evaluateCompiledDeclarativeRule(
  rule: CompiledDeclarativeValidationRule,
  selection: DeclarativeSelection,
): ValidationRuleResult {
  const diagnostics = rule.assertions.flatMap((assertion) =>
    evaluateAssertion(rule, assertion, selection),
  );

  return {
    ruleId: rule.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}

function evaluateAssertion(
  rule: CompiledDeclarativeValidationRule,
  assertion: CompiledDeclarativeAssertion,
  selection: DeclarativeSelection,
): MarkdownDiagnostic[] {
  switch (assertion.kind) {
    case "sectionsRequired":
      return evaluateSectionsRequired(rule, assertion, selection);

    case "textContains":
      return evaluateTextContains(rule, assertion, selection);
  }
}

function evaluateSectionsRequired(
  rule: CompiledDeclarativeValidationRule,
  assertion: Extract<CompiledDeclarativeAssertion, { kind: "sectionsRequired" }>,
  selection: DeclarativeSelection,
): MarkdownDiagnostic[] {
  const sectionTitles = documentQueries
    .sections(selection.document)
    .map((section) => section.title);
  const missingHeadings = assertion.headings.filter(
    (heading) => !sectionTitles.includes(heading),
  );
  const diagnostics = missingHeadings.map((heading) =>
    validationDiagnostic(
      "profile.validation.sectionMissing",
      `Required section "${heading}" is missing.`,
      rule,
    ),
  );

  return assertion.order === "strict"
    ? [
        ...diagnostics,
        ...strictSectionOrderDiagnostics(rule, assertion.headings, sectionTitles),
      ]
    : diagnostics;
}

function strictSectionOrderDiagnostics(
  rule: CompiledDeclarativeValidationRule,
  expectedHeadings: readonly string[],
  actualHeadings: readonly string[],
): MarkdownDiagnostic[] {
  let cursor = -1;

  for (const heading of expectedHeadings) {
    const nextIndex = actualHeadings.findIndex(
      (actualHeading, index) => index > cursor && actualHeading === heading,
    );

    if (nextIndex === -1) {
      return [
        validationDiagnostic(
          "profile.validation.sectionOrder",
          `Required section "${heading}" is not present after the previous required section.`,
          rule,
        ),
      ];
    }

    cursor = nextIndex;
  }

  return [];
}

function evaluateTextContains(
  rule: CompiledDeclarativeValidationRule,
  assertion: Extract<CompiledDeclarativeAssertion, { kind: "textContains" }>,
  selection: DeclarativeSelection,
): MarkdownDiagnostic[] {
  if (selection.targets.length === 0) {
    return [
      validationDiagnostic(
        "profile.validation.emptySelection",
        "Rule selector did not match any document targets.",
        rule,
      ),
    ];
  }

  return selection.targets.flatMap((target) =>
    target.text.includes(assertion.text)
      ? []
      : [
          validationDiagnostic(
            "profile.validation.textMissing",
            `Selected ${target.kind} text must contain "${assertion.text}".`,
            rule,
            target.kind === "section" ? target.source?.range : undefined,
          ),
        ],
  );
}

function validationDiagnostic(
  code: string,
  message: string,
  rule: CompiledDeclarativeValidationRule,
  sourceRange?: MarkdownDiagnostic["sourceRange"],
): MarkdownDiagnostic {
  return {
    code,
    ruleId: rule.ruleId,
    message,
    severity: rule.severity,
    ...(sourceRange !== undefined ? { sourceRange } : {}),
  };
}
