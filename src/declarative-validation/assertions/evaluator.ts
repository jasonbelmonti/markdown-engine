import type { ValidationRuleResult } from "../../api/validate.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationRule,
} from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { unsupportedEvaluatorDiagnostic } from "./diagnostics.js";
import { sortAssertionDiagnostics } from "./ordering.js";
import { evaluateSectionsRequired } from "./sections-required.js";
import { evaluateText } from "./text.js";
import { evaluateTextOccurrenceCount } from "./text-occurrence-count.js";

export function evaluateCompiledDeclarativeRule(
  rule: CompiledDeclarativeValidationRule,
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
    case "sectionsRequired":
      return evaluateSectionsRequired(assertion, context);

    case "text":
      return evaluateText(assertion, context);

    case "textOccurrenceCount":
      return evaluateTextOccurrenceCount(assertion, context);

    case "tableColumnsRequired":
    case "ids":
    case "references":
    case "frontmatterRequired":
      return [
        unsupportedEvaluatorDiagnostic(
          assertion,
          context.rule,
          context.assertionIndex,
        ),
      ];
  }
}
