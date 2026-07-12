import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { DeclarativeAssertion, DeclarativeSelector } from "../profile/index.js";
import { compileDiagnostic } from "./diagnostics.js";

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
    case "tableColumnCoverage":
    case "frontmatterShape":
    case "sourceLength":
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
    case "textFormat":
      return undefined;

    case "frontmatterRequired":
      return selector.target === "document"
        ? undefined
        : selectorCompatibilityMessage(assertionName, "document");
  }
}

export function pushCompatibilityDiagnostic(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const message = selectorAssertionCompatibilityError(assertionName, selector);

  if (message === undefined) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.compile.incompatibleSelectorAssertion",
      message,
      ruleId,
    ),
  );

  return false;
}

function selectorCompatibilityMessage(
  assertionName: DeclarativeAssertionName,
  selectorName: DeclarativeSelector["target"],
): string {
  return `Assertion "${assertionName}" is compatible only with ${selectorName} selectors.`;
}
