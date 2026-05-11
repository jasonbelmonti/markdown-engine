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

    case "text":
      return evaluateText(rule, assertion, selection);

    case "tableColumnsRequired":
    case "ids":
    case "references":
    case "textOccurrenceCount":
    case "frontmatterRequired":
      return [
        unsupportedEvaluatorDiagnostic(
          "profile.validation.assertionUnsupported",
          `Assertion "${assertion.kind}" is compiled but not implemented by the assertion evaluator yet.`,
          rule,
        ),
      ];
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

function evaluateText(
  rule: CompiledDeclarativeValidationRule,
  assertion: Extract<CompiledDeclarativeAssertion, { kind: "text" }>,
  selection: DeclarativeSelection,
): MarkdownDiagnostic[] {
  if (hasUnsupportedTextEvaluatorPredicate(assertion)) {
    return [
      unsupportedEvaluatorDiagnostic(
        "profile.validation.assertionUnsupported",
        'Assertion "text" is compiled but only text.contains without a column is implemented by the assertion evaluator yet.',
        rule,
      ),
    ];
  }

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
    evaluateTextTarget(
      rule,
      assertion,
      target.kind,
      target.text,
      targetSourceRange(target),
    ),
  );
}

function evaluateTextTarget(
  rule: CompiledDeclarativeValidationRule,
  assertion: Extract<CompiledDeclarativeAssertion, { kind: "text" }>,
  targetKind: string,
  text: string,
  sourceRange?: MarkdownDiagnostic["sourceRange"],
): MarkdownDiagnostic[] {
  const diagnostics: MarkdownDiagnostic[] = [];

  if (assertion.contains !== undefined && !text.includes(assertion.contains)) {
    diagnostics.push(
      validationDiagnostic(
        "profile.validation.textMissing",
        `Selected ${targetKind} text must contain "${assertion.contains}".`,
        rule,
        sourceRange,
      ),
    );
  }

  return diagnostics;
}

function hasUnsupportedTextEvaluatorPredicate(
  assertion: Extract<CompiledDeclarativeAssertion, { kind: "text" }>,
): boolean {
  return (
    assertion.column !== undefined ||
    assertion.containsExactlyOne !== undefined ||
    assertion.excludes !== undefined
  );
}

function targetSourceRange(
  target: DeclarativeSelection["targets"][number],
): MarkdownDiagnostic["sourceRange"] | undefined {
  return "source" in target ? target.source?.range : undefined;
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

function unsupportedEvaluatorDiagnostic(
  code: string,
  message: string,
  rule: CompiledDeclarativeValidationRule,
): MarkdownDiagnostic {
  return {
    code,
    ruleId: rule.ruleId,
    message,
    severity: "error",
  };
}
