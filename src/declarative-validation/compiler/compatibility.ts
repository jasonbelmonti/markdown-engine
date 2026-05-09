import type { DeclarativeAssertion, DeclarativeSelector } from "../profile/index.js";

export type DeclarativeAssertionName = keyof DeclarativeAssertion;

const TEXT_SELECTOR_TARGETS = new Set<DeclarativeSelector["target"]>([
  "document",
  "section",
  "heading",
  "table",
  "tableRow",
  "tableCell",
  "textSpan",
  "link",
  "list",
]);

const TABLE_SELECTOR_TARGETS = new Set<DeclarativeSelector["target"]>([
  "table",
  "tableRow",
]);

export function selectorAssertionCompatibilityError(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
  assertion: DeclarativeAssertion,
): string | undefined {
  switch (assertionName) {
    case "sectionsRequired":
    case "sectionOrder":
    case "references":
      return selector.target === "document"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "document");

    case "tableColumnsRequired":
      return selector.target === "table"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "table");

    case "ids":
      return assertion.ids?.column === undefined
        ? textTargetCompatibility(assertionName, selector)
        : tableTargetCompatibility(assertionName, selector);

    case "text":
      return assertion.text?.column === undefined
        ? textTargetCompatibility(assertionName, selector)
        : tableTargetCompatibility(assertionName, selector);

    case "textOccurrenceCount":
      return assertion.textOccurrenceCount?.column === undefined
        ? textTargetCompatibility(assertionName, selector)
        : tableTargetCompatibility(assertionName, selector);

    case "frontmatterRequired":
      if (selector.target === "document") {
        return undefined;
      }

      return selector.target === "frontmatter" && selector.field === undefined
        ? undefined
        : 'Assertion "frontmatterRequired" is compatible only with document selectors or unfiltered frontmatter selectors.';
  }
}

function textTargetCompatibility(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
): string | undefined {
  return TEXT_SELECTOR_TARGETS.has(selector.target)
    ? undefined
    : `Assertion "${assertionName}" is not compatible with frontmatter selectors.`;
}

function tableTargetCompatibility(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
): string | undefined {
  return TABLE_SELECTOR_TARGETS.has(selector.target)
    ? undefined
    : `Assertion "${assertionName}" with a column option is compatible only with table or tableRow selectors.`;
}

function selectorCompatibilityMessage(
  assertionName: DeclarativeAssertionName,
  selectorName: DeclarativeSelector["target"],
): string {
  return `Assertion "${assertionName}" is compatible only with ${selectorName} selectors.`;
}
