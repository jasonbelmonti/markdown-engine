import type { DeclarativeAssertion, DeclarativeSelector } from "../profile/index.js";

export type DeclarativeAssertionName = keyof DeclarativeAssertion;

export function selectorAssertionCompatibilityError(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
): string | undefined {
  switch (assertionName) {
    case "exists":
      return undefined;

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
    case "textLength":
      return undefined;

    case "frontmatterRequired":
      return selector.target === "document"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "document");
  }
}

function selectorCompatibilityMessage(
  assertionName: DeclarativeAssertionName,
  selectorName: DeclarativeSelector["target"],
): string {
  return `Assertion "${assertionName}" is compatible only with ${selectorName} selectors.`;
}
