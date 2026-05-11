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

export function selectorAssertionCompatibilityError(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
): string | undefined {
  switch (assertionName) {
    case "sectionsRequired":
    case "references":
      return selector.target === "document"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "document");

    case "tableColumnsRequired":
      return selector.target === "table"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "table");

    case "ids":
    case "text":
    case "textOccurrenceCount":
      return textTargetCompatibility(assertionName, selector);

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

function selectorCompatibilityMessage(
  assertionName: DeclarativeAssertionName,
  selectorName: DeclarativeSelector["target"],
): string {
  return `Assertion "${assertionName}" is compatible only with ${selectorName} selectors.`;
}
