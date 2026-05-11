import { documentQueries } from "../../api/document-queries.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { validationDiagnostic } from "./diagnostics.js";

type SectionsRequiredAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "sectionsRequired" }
>;

export function evaluateSectionsRequired(
  assertion: SectionsRequiredAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const sectionTitles = documentQueries
    .sections(context.selection.document)
    .map((section) => section.title);
  const missingDiagnostics = assertion.headings
    .filter((heading) => !sectionTitles.includes(heading))
    .map((heading, diagnosticOrder) =>
      validationDiagnostic(
        "profile.validation.sectionMissing",
        `Required section "${heading}" is missing.`,
        context.rule,
        {
          assertionIndex: context.assertionIndex,
          targetKey: `section:${heading}`,
          diagnosticOrder,
        },
      ),
    );

  return assertion.order === "strict"
    ? [
        ...missingDiagnostics,
        ...strictSectionOrderDiagnostics(context, assertion.headings, sectionTitles),
      ]
    : missingDiagnostics;
}

function strictSectionOrderDiagnostics(
  context: AssertionEvaluationContext,
  expectedHeadings: readonly string[],
  actualHeadings: readonly string[],
): AssertionDiagnostic[] {
  let cursor = -1;

  for (const [diagnosticOrder, heading] of expectedHeadings.entries()) {
    const nextIndex = actualHeadings.findIndex(
      (actualHeading, index) => index > cursor && actualHeading === heading,
    );

    if (nextIndex === -1) {
      return [
        validationDiagnostic(
          "profile.validation.sectionOrder",
          `Required section "${heading}" is not present after the previous required section.`,
          context.rule,
          {
            assertionIndex: context.assertionIndex,
            targetKey: `section:${heading}`,
            diagnosticOrder,
          },
        ),
      ];
    }

    cursor = nextIndex;
  }

  return [];
}
