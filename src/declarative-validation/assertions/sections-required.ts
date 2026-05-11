import { documentQueries } from "../../api/document-queries.js";
import type {
  EngineDocument,
  EngineSection,
} from "../../api/document.js";
import type { SourceRange } from "../../api/diagnostics.js";
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
  const sections = documentQueries.sections(context.selection.document);
  const sectionTitles = sections.map((section) => section.title);
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
        ...strictSectionOrderDiagnostics(context, assertion.headings, sections),
      ]
    : missingDiagnostics;
}

function strictSectionOrderDiagnostics(
  context: AssertionEvaluationContext,
  expectedHeadings: readonly string[],
  actualSections: readonly EngineSection[],
): AssertionDiagnostic[] {
  const actualHeadings = actualSections.map((section) => section.title);
  let cursor = -1;

  for (const [diagnosticOrder, heading] of expectedHeadings.entries()) {
    const nextIndex = actualHeadings.findIndex(
      (actualHeading, index) => index > cursor && actualHeading === heading,
    );

    if (nextIndex === -1) {
      const fallbackSection = firstSectionByTitle(actualSections, heading);
      const sourceRange = sectionHeadingSourceRange(
        context.selection.document,
        fallbackSection,
      );

      return [
        validationDiagnostic(
          "profile.validation.sectionOrder",
          `Required section "${heading}" is not present after the previous required section.`,
          context.rule,
          {
            assertionIndex: context.assertionIndex,
            targetKey: `section:${heading}`,
            diagnosticOrder,
            ...(sourceRange !== undefined ? { sourceRange } : {}),
          },
        ),
      ];
    }

    cursor = nextIndex;
  }

  return [];
}

function firstSectionByTitle(
  sections: readonly EngineSection[],
  heading: string,
): EngineSection | undefined {
  return sections.find((section) => section.title === heading);
}

function sectionHeadingSourceRange(
  document: EngineDocument,
  section: EngineSection | undefined,
): SourceRange | undefined {
  return section === undefined
    ? undefined
    : documentQueries.sourceSlice(document, section.headingTarget)?.range;
}
