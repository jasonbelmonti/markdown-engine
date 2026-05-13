import type { ValidationRuleResult } from "../../api/validate.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationRule,
} from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { unsupportedEvaluatorDiagnostic } from "./diagnostics.js";
import { evaluateFrontmatterRequired } from "./frontmatter-required.js";
import { evaluateIds } from "./ids.js";
import { sortAssertionDiagnostics } from "./ordering.js";
import { evaluateReferences } from "./references.js";
import { evaluateSectionsRequired } from "./sections-required.js";
import { evaluateTableColumnsRequired } from "./table-columns-required.js";
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

    case "frontmatterRequired":
      return evaluateFrontmatterRequired(assertion, context);

    case "tableColumnsRequired":
      return evaluateTableColumnsRequired(assertion, context);

    case "ids":
      return evaluateIds(assertion, context);

    case "references":
      return evaluateReferences(assertion, context);

    default:
      return [
        unsupportedEvaluatorDiagnostic(
          assertion,
          context.rule,
          context.assertionIndex,
        ),
      ];
  }
}
