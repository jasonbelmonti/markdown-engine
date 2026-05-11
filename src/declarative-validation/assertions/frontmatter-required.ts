import { hasOwnProperty, isPlainRecord } from "../../internal/plain-record.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { validationDiagnostic } from "./diagnostics.js";

type FrontmatterRequiredAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "frontmatterRequired" }
>;

export function evaluateFrontmatterRequired(
  assertion: FrontmatterRequiredAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  return assertion.fields
    .filter(
      (field) =>
        !hasRequiredFrontmatterField(context.selection.document.frontmatter, field),
    )
    .map((field, diagnosticOrder) =>
      validationDiagnostic(
        "profile.validation.frontmatterFieldMissing",
        `Required frontmatter field "${field}" is missing.`,
        context.rule,
        {
          assertionIndex: context.assertionIndex,
          targetKey: `frontmatter:${field}`,
          diagnosticOrder,
        },
      ),
    );
}

function hasRequiredFrontmatterField(
  frontmatter: unknown,
  field: string,
): boolean {
  return isPlainRecord(frontmatter) && hasOwnProperty(frontmatter, field);
}
