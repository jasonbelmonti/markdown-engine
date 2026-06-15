import type { ValidationRuleResult } from "../../api/validate.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationExecutableRule,
} from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import {
  type AssertionDiagnostic,
  unsupportedEvaluatorDiagnostic,
} from "./diagnostics.js";
import { evaluateExists } from "./exists.js";
import { evaluateFrontmatterShape } from "./frontmatter-shape.js";
import { evaluateFrontmatterRequired } from "./frontmatter-required.js";
import { evaluateIds } from "./ids.js";
import { sortAssertionDiagnostics } from "./ordering.js";
import { evaluateReferences } from "./references.js";
import { evaluateSectionsRequired } from "./sections-required.js";
import { evaluateTableColumnCoverage } from "./table-column-coverage.js";
import { evaluateTableColumnsRequired } from "./table-columns-required.js";
import { evaluateText } from "./text.js";
import { evaluateTextLength } from "./text-length.js";
import { evaluateTextOccurrenceCount } from "./text-occurrence-count.js";

export function evaluateCompiledDeclarativeRule(
  rule: CompiledDeclarativeValidationExecutableRule,
  selection: DeclarativeSelection,
): ValidationRuleResult {
  const evaluatedDiagnostics = rule.assertions.flatMap(
    (assertion, assertionIndex) =>
      evaluateAssertion(assertion, {
        rule,
        selection,
        assertionIndex,
      }),
  );
  const diagnostics = sortAssertionDiagnostics(evaluatedDiagnostics);

  return {
    ruleId: rule.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}

function evaluateAssertion(
  assertion: CompiledDeclarativeAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  switch (assertion.kind) {
    case "exists":
      return evaluateExists(context);

    case "sectionsRequired":
      return evaluateSectionsRequired(assertion, context);

    case "text":
      return evaluateText(assertion, context);

    case "textOccurrenceCount":
      return evaluateTextOccurrenceCount(assertion, context);

    case "textLength":
      return evaluateTextLength(assertion, context);

    case "textFormat":
      return [
        unsupportedEvaluatorDiagnostic(
          assertion,
          context.rule,
          context.assertionIndex,
        ),
      ];

    case "frontmatterRequired":
      return evaluateFrontmatterRequired(assertion, context);

    case "tableColumnsRequired":
      return evaluateTableColumnsRequired(assertion, context);

    case "ids":
      return evaluateIds(assertion, context);

    case "references":
      return evaluateReferences(assertion, context);

    case "tableColumnCoverage":
      return evaluateTableColumnCoverage(assertion, context);

    case "frontmatterShape":
      return evaluateFrontmatterShape(assertion, context);
  }
}
